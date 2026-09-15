#!/usr/bin/env node
// TODO#7: operation_id'siz aynı kod 5 dk içinde iki kez çalışmaz (dedupe:"auto", deduplicatedFrom), dedupe:false ile çalışır;
// execute_luau/export_rbxm sonucunda queued_ahead + waitedMs; timeout hata metninde get_request_status yönergesi.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { McpClient, runTest } from '../lib/mcp-client.mjs';

const ROOT = '__RSMCP_Todo07';

function log(label, extra) {
  console.log(JSON.stringify({ label, timestamp: new Date().toISOString(), ...extra }));
}

await runTest('TODO#7 queue metrics, automatic dedupe, timeout guidance', async ({ track }) => {
  const client = track(new McpClient('todo-07', { startupTimeoutMs: 20000 }));
  await client.start();
  await client.initialize();
  const instanceId = process.env.MCP_INSTANCE_ID;
  assert.ok(instanceId, 'Run through run-all.mjs --managed');

  const call = (args, timeoutMs = 60_000) => client.callToolResult('execute_luau', { instance_id: instanceId, target: 'edit', ...args }, timeoutMs);
  const count = async () => {
    const res = await call({ code: `local r = workspace:FindFirstChild("${ROOT}") if not r then return "0" end return tostring(#r:GetChildren())`, dedupe: false });
    return Number(res.body.returnValue);
  };

  try {
    const setup = await call({ code: `local old = workspace:FindFirstChild("${ROOT}") if old then old:Destroy() end local f = Instance.new("Folder") f.Name = "${ROOT}" f.Parent = workspace return "ok"`, dedupe: false });
    assert.equal(setup.body.returnValue, 'ok');

    console.log('--- (b) aynı kod, operation_id yok → tek dispatch ---');
    const mutation = `local f = Instance.new("Folder") f.Name = "Dedupe" f.Parent = workspace["${ROOT}"] return f.Name`;
    const first = await call({ code: mutation });
    const second = await call({ code: mutation });
    log('first', { body: first.body });
    log('second', { body: second.body });
    assert.equal(first.body.success, true);
    assert.equal(typeof first.body.operationId, 'string', 'sonuçta operationId olmalı');
    assert.equal(first.body.dedupe, 'auto', 'operation_id verilmeyince dedupe:"auto" işareti');
    assert.equal(first.body.deduplicatedFrom, undefined, 'ilk çalıştırma dedupe edilmez');
    assert.equal(second.body.deduplicatedFrom, first.body.operationId, 'ikinci istek ilkinin retained sonucunu döner');
    assert.equal(second.body.operationId, first.body.operationId);
    assert.equal(second.body.returnValue, 'Dedupe');
    assert.equal(await count(), 1, 'Workspace altında 1 Folder (kod iki kez çalışmadı)');

    console.log('--- (b) dedupe:false → yeniden çalışır ---');
    const forced = await call({ code: mutation, dedupe: false });
    log('forced', { body: forced.body });
    assert.equal(forced.body.success, true);
    assert.equal(forced.body.deduplicatedFrom, undefined);
    assert.notEqual(forced.body.operationId, first.body.operationId, 'dedupe:false yeni operationId üretir');
    assert.equal(await count(), 2, 'dedupe:false ile 2 Folder');

    console.log('--- (b) yeni operation_id → yeniden çalışır ---');
    const explicit = await call({ code: mutation, operation_id: `todo07-${Date.now()}` });
    log('explicit', { body: explicit.body });
    assert.equal(explicit.body.dedupe, undefined, 'açık operation_id auto işareti taşımaz');
    assert.equal(await count(), 3, 'yeni operation_id ile 3 Folder');

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
