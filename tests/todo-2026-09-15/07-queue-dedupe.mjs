#!/usr/bin/env node
// TODO#7: operation_id'siz özdeş kod yalnız pending ya da teslim edilmemiş (waiter timeout) sonuç varken dedupe edilir (deduplicatedFrom); teslim edilmiş sonuç yeniden çalıştırmayı engellemez;
// execute_luau/export_rbxm sonucunda queued_ahead + waitedMs; timeout hata metninde get_request_status yönergesi.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { resolveAuthToken } from '../../packages/core/dist/auth.js';
import { BASE_PORT, McpClient, runTest } from '../lib/mcp-client.mjs';

const ROOT = '__RSMCP_Todo07';

function log(label, extra) {
  console.log(JSON.stringify({ label, timestamp: new Date().toISOString(), ...extra }));
}

function authHeaders(extra) {
  const { token } = resolveAuthToken();
  return { ...(token ? { 'X-MCP-Auth': token } : {}), ...extra };
}

async function editPeerId(instanceId) {
  const response = await fetch(`http://127.0.0.1:${BASE_PORT}/topology`, { headers: authHeaders() });
  assert.equal(response.ok, true, `/topology HTTP ${response.status}`);
  const body = await response.json();
  const peer = (body.peers ?? []).find((candidate) => candidate.instanceId === instanceId && candidate.role === 'edit');
  assert.ok(peer, `edit peer for ${instanceId} not in topology`);
  return peer.peerId;
}

function autoOperationId(targetPeerId, code) {
  return `auto-${createHash('sha256').update(JSON.stringify({ targetPeerId, endpoint: '/api/execute-luau', data: { code } })).digest('hex')}`;
}

async function proxyExecute(targetPeerId, code, operationId, timeoutMs) {
  const response = await fetch(`http://127.0.0.1:${BASE_PORT}/proxy`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ endpoint: '/api/execute-luau', data: { code }, targetPeerId, timeoutMs, operationId }),
  });
  return { status: response.status, body: await response.json() };
}

await runTest('TODO#7 queue metrics, automatic dedupe, timeout guidance', async ({ track }) => {
  const client = track(new McpClient('todo-07', { startupTimeoutMs: 20000 }));
  await client.start();
  await client.initialize();
  const instanceId = process.env.MCP_INSTANCE_ID;
  assert.ok(instanceId, 'Run through run-all.mjs --managed');

  const call = (args, timeoutMs = 60_000) => client.callToolResult('execute_luau', { instance_id: instanceId, target: 'edit', ...args }, timeoutMs);
  const countNamed = async (name) => {
    const res = await call({ code: `local r = workspace:FindFirstChild("${ROOT}") if not r then return "0" end local n = 0 for _, c in ipairs(r:GetChildren()) do if c.Name == "${name}" then n += 1 end end return tostring(n)`, dedupe: false });
    return Number(res.body.returnValue);
  };
  const count = () => countNamed('Dedupe');

  try {
    const setup = await call({ code: `local old = workspace:FindFirstChild("${ROOT}") if old then old:Destroy() end local f = Instance.new("Folder") f.Name = "${ROOT}" f.Parent = workspace return "ok"`, dedupe: false });
    assert.equal(setup.body.returnValue, 'ok');

    console.log('--- (b) teslim edilmiş sonuç: aynı kod, operation_id yok → bilinçli yeniden çalıştırma (2 dispatch) ---');
    const mutation = `local f = Instance.new("Folder") f.Name = "Dedupe" f.Parent = workspace["${ROOT}"] return f.Name`;
    const first = await call({ code: mutation });
    const second = await call({ code: mutation });
    log('first', { body: first.body });
    log('second', { body: second.body });
    assert.equal(first.body.success, true);
    assert.equal(typeof first.body.operationId, 'string', 'sonuçta operationId olmalı');
    assert.equal(first.body.dedupe, 'auto', 'operation_id verilmeyince dedupe:"auto" işareti');
    assert.equal(first.body.deduplicatedFrom, undefined, 'ilk çalıştırma dedupe edilmez');
    assert.equal(second.body.deduplicatedFrom, undefined, 'teslim edilmiş sonuç sonraki özdeş çağrıyı dedupe etmez');
    assert.equal(second.body.operationId, `${first.body.operationId}-2`, 'ikinci çalıştırma sonraki attempt kimliğini alır');
    assert.equal(second.body.returnValue, 'Dedupe');
    assert.equal(await count(), 2, 'Workspace altında 2 Folder (bilinçli yeniden çalıştırma)');

    console.log('--- (b) dedupe:false → yeniden çalışır ---');
    const forced = await call({ code: mutation, dedupe: false });
    log('forced', { body: forced.body });
    assert.equal(forced.body.success, true);
    assert.equal(forced.body.deduplicatedFrom, undefined);
    assert.equal(forced.body.dedupe, undefined, 'dedupe:false auto işareti taşımaz');
    assert.ok(!String(forced.body.operationId).startsWith('auto-'), 'dedupe:false rastgele operationId üretir');
    assert.equal(await count(), 3, 'dedupe:false ile 3 Folder');

    console.log('--- (b) yeni operation_id → yeniden çalışır ---');
    const explicit = await call({ code: mutation, operation_id: `todo07-${Date.now()}` });
    log('explicit', { body: explicit.body });
    assert.equal(explicit.body.dedupe, undefined, 'açık operation_id auto işareti taşımaz');
    assert.equal(await count(), 4, 'yeni operation_id ile 4 Folder');

    console.log('--- (b) teslim EDİLMEMİŞ sonuç: kısa waiter timeout → aynı kod tekrar → kod bir kez çalışır ---');
    const slowMutation = `task.wait(8) local f = Instance.new("Folder") f.Name = "SlowDedupe" f.Parent = workspace["${ROOT}"] return f.Name`;
    const peerId = await editPeerId(instanceId);
    const slowId = autoOperationId(peerId, slowMutation);
    const timedOutProxy = await proxyExecute(peerId, slowMutation, slowId, 1000);
    log('slow via /proxy timeoutMs=1000', timedOutProxy);
    assert.equal(timedOutProxy.status, 500, 'waiter 1 s sonra timeout ile ayrılır');
    assert.equal(timedOutProxy.body.code, 'request_timeout');
    assert.ok(String(timedOutProxy.body.error).includes(`call get_request_status with operation_id ${slowId}; do not resend`), timedOutProxy.body.error);
    const resend = await call({ code: slowMutation });
    log('immediate resend (still executing)', { body: resend.body });
    if (resend.isError) {
      assert.equal(resend.body.error, 'operation_not_replayed', 'çalışması süren bilinmeyen sonuç yeniden çalıştırılmaz');
      assert.ok(String(resend.body.message).includes(`operation_id ${slowId}`), resend.body.message);
    } else {
      assert.equal(resend.body.deduplicatedFrom, slowId, 'ya dedupe ya operation_not_replayed');
    }
    await delay(10_000);
    assert.equal(await countNamed('SlowDedupe'), 1, '10 s sonra SlowDedupe sayısı 1 (kod bir kez çalıştı)');
    const settledStatus = await client.callToolResult('get_request_status', { request_id: slowId });
    log('status after late settle', { body: settledStatus.body });
    assert.equal(settledStatus.body.state, 'settled');
    assert.equal(typeof settledStatus.body.waiterEndedAt, 'number', 'sonuç teslim edilmeden settle oldu');
    const afterSettle = await call({ code: slowMutation });
    log('resend after undelivered settle', { body: afterSettle.body });
    assert.equal(afterSettle.isError, false, JSON.stringify(afterSettle.body).slice(0, 300));
    assert.equal(afterSettle.body.deduplicatedFrom, slowId, 'teslim edilmemiş retained sonuç dedupe edilir');
    assert.equal(afterSettle.body.returnValue, 'SlowDedupe');
    assert.equal(await countNamed('SlowDedupe'), 1, 'dedupe sonrası sayı hâlâ 1');

    console.log('--- (a) 5 paralel execute_luau → queued_ahead 0..4, waitedMs ---');
    const started = Date.now();
    const parallel = await Promise.all([0, 1, 2, 3, 4].map((i) => call({ code: `task.wait(2) return "p${i}"`, dedupe: false })));
    const elapsedMs = Date.now() - started;
    const queuedAhead = parallel.map((r) => r.body.queued_ahead);
    const waited = parallel.map((r) => r.body.waitedMs);
    log('parallel', { elapsedMs, queuedAhead, waited, operationIds: parallel.map((r) => r.body.operationId) });
    for (const r of parallel) assert.equal(r.isError, false, JSON.stringify(r.body).slice(0, 300));
    assert.deepEqual([...queuedAhead].sort(), [0, 1, 2, 3, 4], 'queued_ahead değerleri 0..4');
    for (const w of waited) assert.ok(Number.isInteger(w) && w >= 0, `waitedMs tam sayı ≥ 0: ${w}`);

    console.log('--- (a) export_rbxm sonucunda queued_ahead + waitedMs ---');
    const outputPath = path.join(os.tmpdir(), `todo07-${process.pid}.rbxm`);
    const exported = await client.callToolResult('export_rbxm', {
      instance_id: instanceId, instance_paths: [`game.Workspace.${ROOT}`], output_path: outputPath,
    }, 60_000);
    log('export', { body: exported.body });
    assert.equal(exported.isError, false);
    assert.equal(typeof exported.body.queued_ahead, 'number');
    assert.equal(typeof exported.body.waitedMs, 'number');
    assert.equal(typeof exported.body.operationId, 'string');
    fs.rmSync(outputPath, { force: true });

    console.log('--- (c) timeout hata metni: get_request_status yönergesi + operation_id ---');
    const timeoutId = `todo07-timeout-${Date.now()}`;
    const timedOut = await call({ code: 'task.wait(40) return "late"', operation_id: timeoutId }, 90_000);
    log('timeout', { body: timedOut.body });
    assert.equal(timedOut.isError, true, 'bridge 30 s timeout hata döner');
    assert.equal(timedOut.body.requestId, timeoutId);
    assert.ok(String(timedOut.body.message).includes(`call get_request_status with operation_id ${timeoutId}; do not resend`), `yönerge cümlesi: ${timedOut.body.message}`);
    const status = await client.callToolResult('get_request_status', { request_id: timeoutId });
    log('status after timeout', { body: status.body });
    assert.equal(status.body.requestId, timeoutId);
  } finally {
    await call({ code: `local f = workspace:FindFirstChild("${ROOT}") if f then f:Destroy() end return "cleaned"`, dedupe: false }).catch(() => {});
  }
});
