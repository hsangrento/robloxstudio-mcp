#!/usr/bin/env node
// TODO#5: execute_luau büyük dönüşleri sessizce kesmez; truncated/totalBytes/returnedBytes + max_output_bytes.
// Ayrıca regresyon: edit bağlamında HttpService:GetAsync("http://127.0.0.1:<port>/...") çalışır.
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { McpClient, runTest } from '../lib/mcp-client.mjs';

const KB = 1000;
const MEASURE_SIZES = [30 * KB, 200 * KB, 2000 * KB];

function record(label, args, result) {
  const body = result.body;
  const returnValue = typeof body?.returnValue === 'string' ? body.returnValue : undefined;
  const line = {
    label,
    timestamp: new Date().toISOString(),
    tool: 'execute_luau',
    args: { ...args, code: args.code.length > 120 ? `${args.code.slice(0, 120)}…` : args.code },
    isError: result.isError,
    success: body?.success,
    returnValueLength: returnValue?.length,
    returnValueBytes: returnValue === undefined ? undefined : Buffer.byteLength(returnValue),
    truncated: body?.truncated,
    totalBytes: body?.totalBytes,
    returnedBytes: body?.returnedBytes,
    maxOutputBytes: body?.maxOutputBytes,
    responseBytes: Buffer.byteLength(JSON.stringify(body ?? null)),
    error: body?.error,
  };
  console.log(JSON.stringify(line));
  return line;
}

await runTest('TODO#5 execute_luau large return truncation contract', async ({ track }) => {
  const client = track(new McpClient('todo-05', { startupTimeoutMs: 20000 }));
  await client.start();
  await client.initialize();
  const instanceId = process.env.MCP_INSTANCE_ID;
  assert.ok(instanceId, 'Run through run-all.mjs --managed');

  const call = (args, timeoutMs = 120_000) => client.callToolResult('execute_luau', { instance_id: instanceId, target: 'edit', ...args }, timeoutMs);

  console.log('--- ölçüm: katman katman ham uzunluklar (düzeltme öncesi/sonrası aynı komut) ---');
  const measured = {};
  for (const size of MEASURE_SIZES) {
    const args = { code: `return string.rep("x", ${size})` };
    measured[size] = record(`string.rep ${size}`, args, await call(args));
  }
  const concatArgs = { code: `local t = {} for i = 1, ${30 * KB} do t[i] = "y" end return table.concat(t)` };
  measured.concat = record('table.concat 30000', concatArgs, await call(concatArgs));

  console.log('--- sözleşme ---');
  const small = await call({ code: 'return "abc"' });
  assert.equal(small.body.success, true);
  assert.equal(small.body.returnValue, 'abc');
  assert.equal(small.body.truncated, false, 'küçük dönüşte truncated:false alanı olmalı');
  assert.equal(small.body.totalBytes, 3, 'totalBytes dönüş değerinin bayt sayısı');
  assert.equal(small.body.returnedBytes, 3, 'returnedBytes dönüş değerinin bayt sayısı');

  const capped = await call({ code: `return string.rep("x", ${200 * KB})`, max_output_bytes: 1000 });
  record('200 kB, max_output_bytes=1000', { code: 'string.rep 200000', max_output_bytes: 1000 }, capped);
  assert.equal(capped.isError, false, `max_output_bytes reddedilmemeli: ${JSON.stringify(capped.body).slice(0, 300)}`);
  assert.equal(capped.body.truncated, true, 'limit altındaysa truncated:true');
  assert.equal(capped.body.totalBytes, 200 * KB, 'totalBytes tam dönüşün boyutu');
  assert.equal(capped.body.returnedBytes, 1000, 'returnedBytes = max_output_bytes');
  assert.equal(capped.body.returnValue.length, 1000, 'returnValue tam olarak limit kadar');

  const defaultRun = measured[200 * KB];
  assert.equal(defaultRun.success, true);
  if (defaultRun.truncated === true) {
    assert.equal(defaultRun.totalBytes, 200 * KB, 'varsayılan limitte kesildiyse totalBytes doğru');
    assert.equal(defaultRun.returnedBytes, defaultRun.returnValueBytes, 'returnedBytes gerçek dönüşle eşit');
    assert.ok(defaultRun.returnedBytes < 200 * KB);
  } else {
    assert.equal(defaultRun.truncated, false, 'varsayılan limitte kesilmediyse truncated:false');
    assert.equal(defaultRun.returnValueLength, 200 * KB, '200 kB dönüş tam');
    assert.equal(defaultRun.totalBytes, 200 * KB);
  }

  const full = await call({ code: `return string.rep("x", ${200 * KB})`, max_output_bytes: 300 * KB });
  record('200 kB, max_output_bytes=300000', { code: 'string.rep 200000', max_output_bytes: 300 * KB }, full);
  assert.equal(full.body.truncated, false, 'limit yeterliyse truncated:false');
  assert.equal(full.body.returnValue.length, 200 * KB, 'büyük çıktı limit dahilinde tam döner');
  assert.equal(full.body.returnedBytes, 200 * KB);

  const twoMb = await call({ code: `return string.rep("x", ${2000 * KB})`, max_output_bytes: 2100 * KB });
  record('2 MB, max_output_bytes=2100000', { code: 'string.rep 2000000', max_output_bytes: 2100 * KB }, twoMb);
  assert.equal(twoMb.body.truncated, false);
  assert.equal(twoMb.body.returnValue.length, 2000 * KB, '2 MB dönüş limit dahilinde tam');

  const tooBig = await call({ code: 'return 1', max_output_bytes: 10 ** 12 });
  record('max_output_bytes üst sınır', { code: 'return 1', max_output_bytes: 10 ** 12 }, tooBig);
  assert.equal(tooBig.isError, true, 'HTTP gövde limitini aşan max_output_bytes reddedilir');

  const printed = await call({ code: `for i = 1, 50 do print(string.rep("p", 1000)) end return "done"`, max_output_bytes: 5000 });
  record('print çıktısı 50×1000 B, max_output_bytes=5000', { code: 'print loop', max_output_bytes: 5000 }, printed);
  assert.equal(printed.body.returnValue, 'done');
  assert.equal(printed.body.outputTruncated, true, 'print çıktısı da limitle işaretlenir');
  assert.equal(printed.body.outputTotalBytes, 50 * 1000 + 49, 'outputTotalBytes = satırlar + ayırıcılar');
  assert.ok(Array.isArray(printed.body.output) && printed.body.output.length < 50);

  console.log('--- regresyon: HttpService:GetAsync http://127.0.0.1 (edit bağlamı) ---');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.end(`pong:${req.url}`);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  try {
    const enabled = await call({ code: 'return game:GetService("HttpService").HttpEnabled' });
    console.log(JSON.stringify({ label: 'HttpEnabled before', returnValue: enabled.body.returnValue }));
    if (enabled.body.returnValue !== 'true') {
      const set = await call({ code: 'local ok, err = pcall(function() game:GetService("HttpService").HttpEnabled = true end) return tostring(ok) .. ":" .. tostring(err)' });
      console.log(JSON.stringify({ label: 'HttpEnabled set attempt', returnValue: set.body.returnValue }));
    }
    const probe = await call({ code: `local ok, res = pcall(function() return game:GetService("HttpService"):GetAsync("http://127.0.0.1:${port}/todo05") end) return tostring(ok) .. "|" .. tostring(res)` });
    record('HttpService:GetAsync 127.0.0.1', { code: `GetAsync http://127.0.0.1:${port}/todo05` }, probe);
    if (probe.body.returnValue === 'true|pong:/todo05') {
      console.log('  ✓ execute_luau edit bağlamında localhost HTTP çalışıyor');
    } else if (String(probe.body.returnValue).includes('Http requests are not enabled')) {
      console.log('  ⏭️ HttpEnabled kapalı ve eklentiden açılamadı; localhost regresyonu atlandı: ' + probe.body.returnValue);
    } else {
      assert.fail(`localhost HTTP beklenmeyen sonuç: ${probe.body.returnValue}`);
    }
  } finally {
    server.close();
  }
});
