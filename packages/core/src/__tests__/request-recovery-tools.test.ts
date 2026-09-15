import { BridgeService } from '../bridge-service.js';
import { RobloxStudioTools } from '../tools/index.js';

class RecoveryTestBridge extends BridgeService {
  protected override notifyPeerRegistered(): void {
    // Simulated topology must not mutate the local managed-Studio registry.
  }
}

describe('mutation recovery tools', () => {
  let bridge: BridgeService;
  let tools: RobloxStudioTools;
  beforeEach(() => {
    jest.useFakeTimers();
    bridge = new RecoveryTestBridge();
    tools = new RobloxStudioTools(bridge);
    expect(bridge.registerPeer({
      peerId: 'edit', transportPeerId: 'edit', instanceId: 'instance:recovery',
      role: 'edit', placeId: 0, placeName: 'Recovery',
    }).ok).toBe(true);
  });
  afterEach(() => {
    bridge.clearAllPendingRequests();
    jest.useRealTimers();
  });

  test.each(['execute_luau', 'set_properties'])('%s recovers a late result using caller operation identity', async tool => {
    const operationId = `recovery-${tool}`;
    const invoke = () => tool === 'execute_luau'
      ? tools.executeLuau('return 42', 'edit', 'instance:recovery', operationId)
      : tools.setProperties('game.Workspace.Text', { Value: 'recipe' }, 'instance:recovery', operationId);
    const original = invoke();
    const timedOut = expect(original).rejects.toThrow(operationId);
    const delivery = bridge.claimNextRequestForTransport('edit', 'socket');
    expect(delivery?.requestId).toBe(operationId);
    await jest.advanceTimersByTimeAsync(30_000);
    await timedOut;
    const unknown = await tools.getRequestStatus(operationId);
    expect(JSON.parse(unknown.content[0].text)).toMatchObject({ requestId: operationId, outcome: 'unknown' });
    expect(bridge.settleTransportResponse('wrong-peer', operationId, { success: true })).toBe('unknown');
    expect(bridge.settleTransportResponse('edit', operationId, { success: true, value: 42 })).toBe('accepted');
    const recovered = await tools.getRequestStatus(operationId);
    expect(JSON.parse(recovered.content[0].text)).toMatchObject({
      requestId: operationId, outcome: 'success', response: { success: true, value: 42 },
    });
    const replay = await invoke();
    expect(JSON.parse(replay.content[0].text)).toMatchObject({ success: true, value: 42, ...(tool === 'execute_luau' ? { operationId } : {}) });
    expect(bridge.claimNextRequestForTransport('edit', 'socket')).toBeNull();
  });

  describe('TODO#7 automatic execute_luau dedupe without operation_id', () => {
    const code = 'Instance.new("Folder", workspace)';
    const flush = () => jest.advanceTimersByTimeAsync(0);
    const settleNext = (value: unknown) => {
      const delivery = bridge.claimNextRequestForTransport('edit', 'socket');
      if (!delivery) return undefined;
      expect(bridge.settleTransportResponse('edit', delivery.requestId, { success: true, returnValue: value })).toBe('accepted');
      return delivery.requestId;
    };

    test('identical code while the first is still pending → one dispatch; second result carries deduplicatedFrom', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      const second = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      const dispatchedId = settleNext('one');
      expect(dispatchedId).toMatch(/^auto-[0-9a-f]{64}$/);
      expect(bridge.claimNextRequestForTransport('edit', 'socket')).toBeNull();
      const firstBody = JSON.parse((await first).content[0].text);
      const secondBody = JSON.parse((await second).content[0].text);
      expect(firstBody).toMatchObject({ returnValue: 'one', operationId: dispatchedId, dedupe: 'auto', queued_ahead: 0 });
      expect(firstBody.deduplicatedFrom).toBeUndefined();
      expect(secondBody).toMatchObject({ returnValue: 'one', operationId: dispatchedId, dedupe: 'auto', deduplicatedFrom: dispatchedId });
    });

    test('a delivered result never dedupes the next identical call → two dispatches, no deduplicatedFrom', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      const firstId = settleNext('one');
      expect(JSON.parse((await first).content[0].text)).toMatchObject({ returnValue: 'one', operationId: firstId });
      const second = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      const secondId = settleNext('two');
      expect(secondId).toBe(`${firstId}-2`);
      const secondBody = JSON.parse((await second).content[0].text);
      expect(secondBody).toMatchObject({ returnValue: 'two', operationId: secondId, dedupe: 'auto' });
      expect(secondBody.deduplicatedFrom).toBeUndefined();
      const third = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      expect(settleNext('three')).toBe(`${firstId}-3`);
      expect(JSON.parse((await third).content[0].text)).toMatchObject({ returnValue: 'three' });
    });

    test('a result settled after its waiter timed out (undelivered) dedupes the next identical call', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      const failure = expect(first).rejects.toMatchObject({ code: 'request_timeout' });
      await flush();
      const delivery = bridge.claimNextRequestForTransport('edit', 'socket');
      expect(delivery?.requestId).toMatch(/^auto-[0-9a-f]{64}$/);
      await jest.advanceTimersByTimeAsync(30_000);
      await failure;
      expect(bridge.settleTransportResponse('edit', delivery!.requestId, { success: true, returnValue: 'late' })).toBe('accepted');
      expect(bridge.getRequestStatus(delivery!.requestId)).toMatchObject({ state: 'settled', waiterEndedAt: expect.any(Number) });
      const retry = tools.executeLuau(code, 'edit', 'instance:recovery');
      expect(bridge.claimNextRequestForTransport('edit', 'socket')).toBeNull();
      expect(JSON.parse((await retry).content[0].text)).toMatchObject({
        returnValue: 'late', operationId: delivery!.requestId, dedupe: 'auto', deduplicatedFrom: delivery!.requestId,
      });
    });

    test('different code → two dispatches with distinct auto ids', async () => {
      const a = tools.executeLuau('return 1', 'edit', 'instance:recovery');
      const b = tools.executeLuau('return 2', 'edit', 'instance:recovery');
      await flush();
      const idA = settleNext(1);
      const idB = settleNext(2);
      expect(idA).toBeDefined();
      expect(idB).toBeDefined();
      expect(idA).not.toBe(idB);
      expect(JSON.parse((await a).content[0].text)).toMatchObject({ returnValue: 1, operationId: idA, queued_ahead: 0 });
      expect(JSON.parse((await b).content[0].text)).toMatchObject({ returnValue: 2, operationId: idB, queued_ahead: 1 });
    });

    test('dedupe:false or a new operation_id re-runs identical code', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      const autoId = settleNext('one');
      await first;
      const forced = tools.executeLuau(code, 'edit', 'instance:recovery', undefined, undefined, false);
      await flush();
      const forcedId = settleNext('two');
      expect(forcedId).toBeDefined();
      expect(forcedId).not.toBe(autoId);
      const forcedBody = JSON.parse((await forced).content[0].text);
      expect(forcedBody).toMatchObject({ returnValue: 'two', operationId: forcedId });
      expect(forcedBody.dedupe).toBeUndefined();
      expect(forcedBody.deduplicatedFrom).toBeUndefined();
      const explicit = tools.executeLuau(code, 'edit', 'instance:recovery', 'explicit-rerun');
      await flush();
      expect(settleNext('three')).toBe('explicit-rerun');
      expect(JSON.parse((await explicit).content[0].text)).toMatchObject({ returnValue: 'three', operationId: 'explicit-rerun' });
    });

    test('after the 5 minute retention window identical code runs again', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      const autoId = settleNext('one');
      await first;
      await jest.advanceTimersByTimeAsync(5 * 60_000 + 1);
      const again = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      expect(settleNext('fresh')).toBe(autoId);
      const body = JSON.parse((await again).content[0].text);
      expect(body).toMatchObject({ returnValue: 'fresh', operationId: autoId, dedupe: 'auto' });
      expect(body.deduplicatedFrom).toBeUndefined();
    });

    test('timed-out dispatched code with unknown outcome is not re-run automatically', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      const failure = expect(first).rejects.toMatchObject({ code: 'request_timeout' });
      await flush();
      const delivery = bridge.claimNextRequestForTransport('edit', 'socket');
      expect(delivery).toBeDefined();
      await jest.advanceTimersByTimeAsync(30_000);
      await failure;
      await expect(tools.executeLuau(code, 'edit', 'instance:recovery')).rejects.toMatchObject({
        code: 'operation_not_replayed',
        message: expect.stringContaining(`call get_request_status with operation_id ${delivery!.requestId}; do not resend`),
      });
      expect(bridge.claimNextRequestForTransport('edit', 'socket')).toBeNull();
      const forced = tools.executeLuau(code, 'edit', 'instance:recovery', undefined, undefined, false);
      await flush();
      expect(settleNext('forced')).not.toBe(delivery!.requestId);
      expect(JSON.parse((await forced).content[0].text)).toMatchObject({ returnValue: 'forced' });
    });

    test('a queued request that never dispatched moves to the next auto id and runs', async () => {
      const first = tools.executeLuau(code, 'edit', 'instance:recovery');
      const failure = expect(first).rejects.toMatchObject({ code: 'request_timeout', details: { outcome: 'not_executed' } });
      await jest.advanceTimersByTimeAsync(30_000);
      await failure;
      const retry = tools.executeLuau(code, 'edit', 'instance:recovery');
      await flush();
      const retryId = settleNext('ran');
      expect(retryId).toMatch(/^auto-[0-9a-f]{64}-2$/);
      expect(JSON.parse((await retry).content[0].text)).toMatchObject({ returnValue: 'ran', operationId: retryId, dedupe: 'auto' });
    });

    test('execute_luau truncates the return value to max_output_bytes with accounting', async () => {
      const pending = tools.executeLuau('return big', 'edit', 'instance:recovery', 'big-return', 1000);
      await flush();
      settleNext('x'.repeat(200_000));
      const body = JSON.parse((await pending).content[0].text);
      expect(body).toMatchObject({ truncated: true, totalBytes: 200_000, returnedBytes: 1000, maxOutputBytes: 1000 });
      expect(body.returnValue).toBe('x'.repeat(1000));
      await expect(tools.executeLuau('return 1', 'edit', 'instance:recovery', undefined, 60 * 1024 * 1024)).rejects.toThrow('max_output_bytes');
      await expect(tools.executeLuau('return 1', 'edit', 'instance:recovery', undefined, undefined, 'always' as unknown as false)).rejects.toThrow('dedupe');
    });
  });

  test('unknown and expired IDs never claim the mutation was unexecuted', async () => {
    const result = await tools.getRequestStatus('unknown');
    expect(JSON.parse(result.content[0].text)).toMatchObject({ state: 'unknown', outcome: 'unknown' });
    await expect(tools.getRequestStatus('')).rejects.toThrow('request_id');
  });
});
