import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { build as esbuildBuild, type Plugin } from 'esbuild';
import { BridgeService } from '../bridge-service.js';
import { RobloxStudioTools } from '../tools/index.js';
import { TOOL_DEFINITIONS } from '../tools/definitions.js';
import type { StudioProcessInfo, StudioProcessSnapshot } from '../studio-instance-manager.js';

interface TestHandlersModule {
  startPlaytest(request: Record<string, unknown>): Record<string, unknown>;
  stopPlaytest(request: Record<string, unknown>): Record<string, unknown>;
}

function repositoryRoot(): string {
  const cwd = process.cwd();
  return fs.existsSync(path.join(cwd, 'studio-plugin')) ? cwd : path.resolve(cwd, '../..');
}

function robloxPcall(callback: () => unknown): [boolean, unknown] {
  try {
    return [true, callback()];
  } catch (error) {
    return [false, error];
  }
}

const dependencies: Plugin = {
  name: 'studio-playtest-control-dependencies',
  setup(build) {
    build.onResolve({ filter: /^@rbxts\/services$/ }, () => ({ path: 'services', namespace: 'studio-playtest' }));
    build.onResolve({ filter: /^\.\.\/(StopPlayMonitor|PluginSession|PeerRole)$/ }, (args) => ({
      path: args.path.slice(3), namespace: 'studio-playtest',
    }));
    build.onLoad({ filter: /.*/, namespace: 'studio-playtest' }, (args) => {
      if (args.path === 'services') {
        return {
          contents: `export const HttpService = {};
            export const Players = { GetPlayers: () => [] };
            export const RunService = globalThis.__RUN_SERVICE__;`,
          loader: 'js',
        };
      }
      const globals: Record<string, string> = {
        StopPlayMonitor: '__STOP_MONITOR__',
        PluginSession: '__PLUGIN_SESSION__',
        PeerRole: '__PEER_ROLE__',
      };
      return { contents: `export default globalThis.${globals[args.path]};`, loader: 'js' };
    });
  },
};

let bundledModule: Promise<string> | undefined;
function pluginModule(): Promise<string> {
  bundledModule ??= esbuildBuild({
    entryPoints: [path.join(repositoryRoot(), 'studio-plugin/src/modules/handlers/TestHandlers.ts')],
    bundle: true, write: false, platform: 'node', format: 'cjs', target: 'node20',
    logLevel: 'silent', plugins: [dependencies],
  }).then((result) => result.outputFiles[0].text);
  return bundledModule;
}

async function createHarness(editModeActive = false) {
  const spawned: Array<() => void> = [];
  let now = 0;
  let onWait: () => void = () => undefined;
  const studioTestService = {
    EditModeActive: editModeActive,
    ExecutePlayModeAsync: jest.fn(() => undefined),
    ExecuteRunModeAsync: jest.fn(() => undefined),
  };
  const pluginSession = {
    prepareSharedTopology: jest.fn(() => 'topology-token'),
    clearTopologyMarker: jest.fn(),
  };
  const stopMonitor = {
    requestStop: () => ({ ok: true, requestId: 'stop-request' }),
    waitForConsumption: (): { ok: boolean; consumed: boolean; error?: string } => ({ ok: true, consumed: true }),
    clearPending: () => undefined,
  };
  const commonJsModule = { exports: {} as unknown };
  const context = vm.createContext({
    module: commonJsModule,
    exports: commonJsModule.exports,
    __RUN_SERVICE__: { IsRunning: () => false },
    __STOP_MONITOR__: stopMonitor,
    __PLUGIN_SESSION__: pluginSession,
    __PEER_ROLE__: { detect: () => 'edit' },
    game: { GetService: () => studioTestService },
    tick: () => now,
    task: {
      spawn: (callback: () => void) => { spawned.push(callback); },
      wait: (seconds: number) => {
        now = Math.round((now + seconds) * 1000) / 1000;
        if (now > 11) throw new Error('Playtest teardown exceeded its bounded wait');
        onWait();
      },
    },
    pcall: robloxPcall,
    warn: () => undefined,
  });
  vm.runInContext(await pluginModule(), context);
  // esbuild emits the known plugin export assignment as CommonJS (or a default wrapper).
  const loaded = commonJsModule.exports as TestHandlersModule & { default?: TestHandlersModule };
  return {
    handlers: loaded.default ?? loaded,
    studioTestService,
    pluginSession,
    stopMonitor,
    get now() { return now; },
    get scheduledCount() { return spawned.length; },
    onWait(callback: () => void) { onWait = callback; },
    finishExecution() {
      const callback = spawned.shift();
      if (callback === undefined) throw new Error('No playtest execution is scheduled');
      callback();
    },
  };
}

describe('Studio playtest lifecycle control', () => {
  test.each(['tracked', 'manual'])('reconciles a lost acknowledgement after %s playtest teardown completes', async (mode) => {
    const harness = await createHarness(mode === 'tracked');
    if (mode === 'tracked') {
      expect(harness.handlers.startPlaytest({ mode: 'play' }).success).toBe(true);
      harness.studioTestService.EditModeActive = false;
    }
    harness.stopMonitor.waitForConsumption = () => {
      if (mode === 'tracked') harness.finishExecution();
      harness.studioTestService.EditModeActive = true;
      return { ok: false, consumed: false, error: 'acknowledgement lost' };
    };

    expect(harness.handlers.stopPlaytest({})).toMatchObject({ success: true });
  });

  test.each(['no active playtest', 'runtime still active', 'execution still pending', 'EndTest failed'])(
    'does not hide a stop failure when %s',
    async (state) => {
      const harness = await createHarness(state !== 'runtime still active');
      if (state === 'execution still pending') harness.handlers.startPlaytest({ mode: 'play' });
      if (state === 'EndTest failed') harness.studioTestService.EditModeActive = false;
      harness.stopMonitor.waitForConsumption = () => {
        if (state === 'EndTest failed') harness.studioTestService.EditModeActive = true;
        return { ok: false, consumed: state === 'EndTest failed', error: 'stop failed' };
      };

      const result = harness.handlers.stopPlaytest({});
      expect(result.success).not.toBe(true);
      expect(result.error).toEqual(expect.any(String));
      expect(result.detail).toBe('stop failed');
    },
  );

  test('waits for native edit mode after an accepted stop with no tracked execution', async () => {
    // A manually started test (or an already-unwound execution) leaves testRunning false.
    const harness = await createHarness();
    harness.onWait(() => {
      if (harness.now >= 0.3) harness.studioTestService.EditModeActive = true;
    });

    const result = harness.handlers.stopPlaytest({});

    expect(result.success).toBe(true);
    expect(harness.studioTestService.EditModeActive).toBe(true);
    expect(harness.now).toBeGreaterThanOrEqual(0.3);
  });

  test('returns a bounded failure when an accepted stop never restores native edit mode', async () => {
    const harness = await createHarness();

    const result = harness.handlers.stopPlaytest({});

    expect(result).toMatchObject({
      success: false,
      error: 'Playtest teardown did not complete.',
      stopSignalAccepted: true,
      editModeReady: false,
      timedOut: true,
    });
    expect(result).not.toHaveProperty('runtimeStopped');
    expect(harness.now).toBeGreaterThanOrEqual(10);
    expect(harness.now).toBeLessThanOrEqual(10.1);
  });

  test('rejects immediate starts before native edit mode without changing topology or scheduling execution', async () => {
    const harness = await createHarness();

    const result = harness.handlers.startPlaytest({ mode: 'play' });

    expect(result).toMatchObject({
      success: false,
      error: 'Studio is not ready to start a playtest.',
      editModeReady: false,
    });
    expect(harness.pluginSession.prepareSharedTopology).not.toHaveBeenCalled();
    expect(harness.scheduledCount).toBe(0);
    expect(harness.studioTestService.ExecutePlayModeAsync).not.toHaveBeenCalled();
    expect(harness.studioTestService.ExecuteRunModeAsync).not.toHaveBeenCalled();
  });

  test('allows the next execution immediately after stop waits for unwinding and native edit mode', async () => {
    const harness = await createHarness(true);
    expect(harness.handlers.startPlaytest({ mode: 'play' }).success).toBe(true);
    harness.studioTestService.EditModeActive = false;
    harness.onWait(() => {
      // Running the queued coroutine models ExecutePlayModeAsync returning during teardown.
      if (harness.now === 0.1) harness.finishExecution();
      if (harness.now >= 0.3) harness.studioTestService.EditModeActive = true;
    });

    const stopped = harness.handlers.stopPlaytest({});
    expect(stopped.success).toBe(true);
    expect(harness.studioTestService.EditModeActive).toBe(true);
    expect(harness.now).toBeGreaterThanOrEqual(0.3);

    const restarted = harness.handlers.startPlaytest({ mode: 'run' });
    expect(restarted.success).toBe(true);
    expect(harness.scheduledCount).toBe(1);
    harness.finishExecution();
    expect(harness.studioTestService.ExecuteRunModeAsync).toHaveBeenCalledTimes(1);
  });

  test('waits for tracked execution to unwind even when native edit mode is already ready', async () => {
    const harness = await createHarness(true);
    expect(harness.handlers.startPlaytest({ mode: 'play' }).success).toBe(true);
    harness.onWait(() => {
      if (harness.now >= 0.3) harness.finishExecution();
    });

    const result = harness.handlers.stopPlaytest({});

    expect(result.success).toBe(true);
    expect(harness.now).toBeGreaterThanOrEqual(0.3);
    expect(harness.scheduledCount).toBe(0);
    expect(harness.studioTestService.ExecutePlayModeAsync).toHaveBeenCalledTimes(1);
  });

  test('does not report success when native edit mode is ready but tracked execution never unwinds', async () => {
    const harness = await createHarness(true);
    expect(harness.handlers.startPlaytest({ mode: 'play' }).success).toBe(true);

    expect(harness.handlers.stopPlaytest({})).toMatchObject({
      success: false,
      stopSignalAccepted: true,
      editModeReady: true,
      playtestTaskPending: true,
      timedOut: true,
    });
    expect(harness.now).toBeGreaterThanOrEqual(10);
    expect(harness.now).toBeLessThanOrEqual(10.1);
    expect(harness.scheduledCount).toBe(1);
  });
});

// TODO#2 / TODO#11 / TODO#9: solo_playtest restart; get_connected_instances playtest + window fields (fake bridge, queued plugin requests resolved by the test).
const EDIT_PEER = {
  peerId: 'edit-1',
  transportPeerId: 'edit-1',
  instanceId: 'instance:restart',
  role: 'edit',
  placeId: 0,
  placeName: 'RestartPlace.rbxl',
  dataModelName: 'RestartPlace',
  isRunning: false,
  pluginVersion: 'test-version',
  pluginVariant: 'main',
  timestamp: Date.now(),
};

function runtimePeer(role: 'server' | 'client', peerId: string, transportPeerId = 'server-1') {
  return { ...EDIT_PEER, peerId, transportPeerId, role, isRunning: true };
}

async function claimQueued(bridge: BridgeService, transportPeerId: string) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const queued = bridge.claimNextRequestForTransport(transportPeerId, 'restart-test');
    if (queued) return queued;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`No queued request for ${transportPeerId}`);
}

function parse(result: { content: Array<{ type: string; text?: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0].text ?? '{}') as Record<string, unknown>;
}

function toolsWithWindows(bridge: BridgeService, processes: StudioProcessInfo[] = []): RobloxStudioTools {
  const tools = new RobloxStudioTools(bridge);
  (tools as unknown as { studioWindowLookup: () => Promise<StudioProcessSnapshot> }).studioWindowLookup =
    async () => ({ status: 'ok', observedAt: Date.now(), processes });
  return tools;
}

describe('TODO#2 solo_playtest restart', () => {
  test('schema exposes restart, optional mode and before_start', () => {
    const schema = TOOL_DEFINITIONS.find((tool) => tool.name === 'solo_playtest')!.inputSchema as {
      properties: Record<string, { enum?: string[]; type?: string }>;
    };
    expect(schema.properties.action.enum).toContain('restart');
    expect(schema.properties.before_start?.type).toBe('string');
  });

  test('restart stops, runs before_start on the edit peer, then starts with the previous mode', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);
    bridge.registerPeer(runtimePeer('server', 'server-1'));
    bridge.registerPeer(runtimePeer('client', 'client-1'));

    const resultPromise = tools.soloPlaytest('restart', undefined, 5, EDIT_PEER.instanceId, 'return workspace.Name');
    const endpoints: string[] = [];

    const stop = await claimQueued(bridge, 'edit-1');
    endpoints.push(stop.endpoint);
    bridge.resolveRequest(stop.requestId, { success: true, message: 'Playtest stopped.' });
    bridge.unregisterPeer('server-1');

    const luau = await claimQueued(bridge, 'edit-1');
    endpoints.push(luau.endpoint);
    expect(luau.data).toMatchObject({ code: 'return workspace.Name' });
    bridge.resolveRequest(luau.requestId, { success: true, returnValue: 'Workspace' });

    const start = await claimQueued(bridge, 'edit-1');
    endpoints.push(start.endpoint);
    expect(start.data).toMatchObject({ mode: 'play' });
    bridge.resolveRequest(start.requestId, { success: true, message: 'started' });
    bridge.registerPeer(runtimePeer('server', 'server-2', 'server-2'));
    bridge.registerPeer(runtimePeer('client', 'client-2', 'server-2'));

    const body = parse(await resultPromise);
    expect(endpoints).toEqual(['/api/stop-playtest', '/api/execute-luau', '/api/start-playtest']);
    expect(body).toMatchObject({
      success: true,
      action: 'restart',
      mode: 'play',
      wasRunning: true,
      beforeStart: { success: true, returnValue: 'Workspace' },
      roles: ['edit', 'server', 'client-1'],
    });
    expect(typeof body.stoppedInMs).toBe('number');
    expect(typeof body.startedInMs).toBe('number');
    expect(body.totalMs as number).toBeGreaterThanOrEqual(body.stoppedInMs as number);
  });

  test('restart with only a server peer preserves run mode', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);
    bridge.registerPeer(runtimePeer('server', 'server-1'));

    const resultPromise = tools.soloPlaytest('restart', undefined, 5, EDIT_PEER.instanceId);
    const stop = await claimQueued(bridge, 'edit-1');
    bridge.resolveRequest(stop.requestId, { success: true });
    bridge.unregisterPeer('server-1');
    const start = await claimQueued(bridge, 'edit-1');
    expect(start.endpoint).toBe('/api/start-playtest');
    expect(start.data).toMatchObject({ mode: 'run' });
    bridge.resolveRequest(start.requestId, { success: true });
    bridge.registerPeer(runtimePeer('server', 'server-2', 'server-2'));

    expect(parse(await resultPromise)).toMatchObject({ success: true, mode: 'run', wasRunning: true });
  });

  test('restart without an active playtest is a plain start that reuses the last mode', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);

    const firstStart = tools.soloPlaytest('start', 'run', 5, EDIT_PEER.instanceId);
    const first = await claimQueued(bridge, 'edit-1');
    bridge.resolveRequest(first.requestId, { success: true });
    bridge.registerPeer(runtimePeer('server', 'server-1'));
    expect(parse(await firstStart).success).toBe(true);
    bridge.unregisterPeer('server-1');

    const resultPromise = tools.soloPlaytest('restart', undefined, 5, EDIT_PEER.instanceId);
    const start = await claimQueued(bridge, 'edit-1');
    expect(start.endpoint).toBe('/api/start-playtest');
    expect(start.data).toMatchObject({ mode: 'run' });
    bridge.resolveRequest(start.requestId, { success: true });
    bridge.registerPeer(runtimePeer('server', 'server-2', 'server-2'));

    expect(parse(await resultPromise)).toMatchObject({
      success: true, action: 'restart', mode: 'run', wasRunning: false, stoppedInMs: 0,
    });
  });

  test('restart with no active playtest and no known mode fails before touching Studio', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);

    await expect(tools.soloPlaytest('restart', undefined, 5, EDIT_PEER.instanceId)).rejects.toThrow(/mode/);
    expect(bridge.claimNextRequestForTransport('edit-1', 'restart-test')).toBeNull();
  });

  test('restart reports a before_start failure and does not start', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);
    bridge.registerPeer(runtimePeer('server', 'server-1'));

    const resultPromise = tools.soloPlaytest('restart', undefined, 5, EDIT_PEER.instanceId, 'error("boom")');
    const stop = await claimQueued(bridge, 'edit-1');
    bridge.resolveRequest(stop.requestId, { success: true });
    bridge.unregisterPeer('server-1');
    const luau = await claimQueued(bridge, 'edit-1');
    bridge.resolveRequest(luau.requestId, { success: false, error: 'boom' });

    const body = parse(await resultPromise);
    expect(body).toMatchObject({ success: false, action: 'restart', wasRunning: true, error: 'before_start_failed' });
    expect(body.beforeStart).toMatchObject({ success: false, error: 'boom' });
    expect(bridge.claimNextRequestForTransport('edit-1', 'restart-test')).toBeNull();
  });
});

describe('TODO#11 / TODO#9 get_connected_instances playtest and window fields', () => {
  test('idle instance reports playtest.active=false and no window when none is found', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);

    const body = parse(await tools.getConnectedInstances());
    const instances = body.instances as Array<Record<string, unknown>>;
    expect(instances).toHaveLength(1);
    expect(instances[0].playtest).toEqual({ active: false });
    expect(instances[0]).not.toHaveProperty('windowTitle');
    expect(instances[0]).not.toHaveProperty('processId');
  });

  test('play session reports mode play with an ISO startedAt from the earliest runtime peer', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);
    const before = Date.now();
    bridge.registerPeer(runtimePeer('server', 'server-1'));
    bridge.registerPeer(runtimePeer('client', 'client-1'));

    const body = parse(await tools.getConnectedInstances());
    const playtest = (body.instances as Array<{ playtest: { active: boolean; mode?: string; startedAt?: string } }>)[0].playtest;
    expect(playtest.active).toBe(true);
    expect(playtest.mode).toBe('play');
    const startedAt = Date.parse(playtest.startedAt ?? '');
    expect(startedAt).toBeGreaterThanOrEqual(before - 1);
    expect(startedAt).toBeLessThanOrEqual(Date.now() + 1);
  });

  test('server-only session reports mode run', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge);
    bridge.registerPeer(EDIT_PEER);
    bridge.registerPeer(runtimePeer('server', 'server-1'));

    const body = parse(await tools.getConnectedInstances());
    expect((body.instances as Array<{ playtest: unknown }>)[0].playtest).toMatchObject({ active: true, mode: 'run' });
  });

  test.each([
    ['published place title', 'RestartPlace - Roblox Studio'],
    ['local file title with a full path', String.raw`C:\places\RestartPlace.rbxl - Roblox Studio`],
  ])('window title and process id are matched by place name (%s)', async (_label, title) => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge, [
      { Id: 4242, Name: 'RobloxStudioBeta', MainWindowTitle: String.raw`C:\places\OtherPlace.rbxl - Roblox Studio` },
      { Id: 1337, Name: 'RobloxStudioBeta', MainWindowTitle: title },
    ]);
    bridge.registerPeer(EDIT_PEER);

    const body = parse(await tools.getConnectedInstances());
    expect((body.instances as Array<Record<string, unknown>>)[0]).toMatchObject({
      windowTitle: title,
      processId: 1337,
    });
  });

  test('ambiguous window titles leave the window fields out', async () => {
    const bridge = new BridgeService();
    const tools = toolsWithWindows(bridge, [
      { Id: 1, Name: 'RobloxStudioBeta', MainWindowTitle: 'RestartPlace - Roblox Studio' },
      { Id: 2, Name: 'RobloxStudioBeta', MainWindowTitle: 'RestartPlace - Roblox Studio' },
    ]);
    (tools as unknown as { instanceManager: unknown }).instanceManager = { get: async () => undefined };
    bridge.registerPeer(EDIT_PEER);

    const instance = (parse(await tools.getConnectedInstances()).instances as Array<Record<string, unknown>>)[0];
    expect(instance).not.toHaveProperty('windowTitle');
    expect(instance).not.toHaveProperty('processId');
  });
});
