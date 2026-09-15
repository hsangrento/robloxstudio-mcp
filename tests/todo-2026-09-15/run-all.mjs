#!/usr/bin/env node
// TODO.md (2026-09-15) test paketi: jest todo-* birim testleri, Studio gerektirmeyen
// NN-*.mjs betikleri doğrudan, Studio gerektirenler tek managed baseplate oturumunda.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const skipStudio = process.argv.includes('--no-studio');

async function run(label, command, args, cwd = REPO_ROOT) {
  const startedAt = Date.now();
  const proc = spawn(command, args, { stdio: 'inherit', cwd, shell: process.platform === 'win32' });
  const [code] = await once(proc, 'exit');
  return { label, code: code ?? 1, ms: Date.now() - startedAt };
}

const results = [];
results.push(await run('jest packages/core todo-*', 'npm', ['test', '-w', 'packages/core', '--', 'todo-']));

const files = readdirSync(__dirname).filter((file) => /^\d\d-.*\.mjs$/.test(file)).sort();
const nodeOnly = files.filter((file) => !/mcp-client\.mjs/.test(readFileSync(resolve(__dirname, file), 'utf8')));
for (const file of nodeOnly) {
  results.push(await run(`node ${file}`, process.execPath, [resolve(__dirname, file)]));
}

const studioCount = files.length - nodeOnly.length;
if (studioCount > 0 && !skipStudio) {
  results.push(await run(
    `managed Studio suite (${studioCount} test)`,
    process.execPath,
    [resolve(REPO_ROOT, 'tests/run-with-test-port.mjs'), resolve(REPO_ROOT, 'tests/run-all.mjs'), '--managed', '--todo'],
  ));
}

console.log('\n========== TODO SUMMARY ==========');
for (const r of results) console.log(`  ${r.code === 0 ? '✅ PASS' : '❌ FAIL'}  ${r.label}  (${r.ms} ms)`);
const failed = results.filter((r) => r.code !== 0).length;
console.log(`\n${results.length - failed}/${results.length} passed.`);
process.exitCode = failed === 0 ? 0 : 1;
