# TODO#2 — `solo_playtest action="restart"` (stop + bekle + `before_start` + start, mode korunur)

Ajan B, dal `todo/B`, 2026-09-15.

## Belirti / yeniden üretme

Komut (worktree'den, managed baseplate):

```
node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/02-playtest-restart.mjs
```

Kırmızı ham çıktı (kod `636f2a1`+`55577fa`, düzeltmesiz, 2026-09-15 ~11:15):

```
=== TODO#2 solo_playtest restart ===
{"step":"start","elapsedMs":1584,"result":{"success":true,"action":"start","message":"Playtest started.","roles":["edit","server","client-1"]}}
  ✓ initial start succeeds
  ✓ baseline stop succeeds
  ✓ baseline execute_luau succeeds
  ✓ baseline start succeeds
{"step":"baseline-3-calls","calls":3,"stopMs":1166,"syncMs":15,"startMs":1589,"totalMs":2770}
❌ TODO#2 solo_playtest restart FAILED: Tool solo_playtest returned isError: "Input validation error: Invalid arguments for tool solo_playtest: data/action must be equal to one of the allowed values"
========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/02-playtest-restart.mjs
0/1 passed.
EXIT 1
```

Belirti sayıyla: eski döngü 3 araç çağrısı (`stop` 1166 ms + `execute_luau` 15 ms + `start` 1589 ms = 2770 ms, boş baseplate'te; TODO'daki gerçek oyunda start 5–10 s). `restart` eylemi şemada yok.

Birim (jest) kırmızı: `studio-playtest-control.test.ts` — `soloPlaytest(...)` 5. parametre (`before_start`) yok → TS2554, suite derlenemedi (`Tests: 0 total`); `tool-schema.test.ts` enum beklentisi `['start','stop','status']`.

## Düzeltme

Sunucu tarafında (eklenti değişmedi; `StopPlayMonitor.ts`/`TestHandlers.ts` dokunulmadı — mevcut `/api/stop-playtest` + `/api/execute-luau` + `/api/start-playtest` yolları sırayla kullanılıyor):

- `packages/core/src/tools/definitions.ts` (576–599): `action` enum'a `restart`; yeni `before_start` (string) parametresi; `mode` açıklaması ("restart'ta verilmezse çalışan oturumun mode'u").
- `packages/core/src/http-server.ts` (227): `solo_playtest` dispatcher'ı `body.before_start`'ı geçirir.
- `packages/core/src/tools/index.ts`:
  - `soloPlaytest` (3378–3392): `restart` kabul; `before_start` yalnız restart ile.
  - `_restartPlaytest` (3449–3545): (1) runtime peer'lardan `wasRunning`; `mode` verilmezse aktif oturumdan türetilir (client peer varsa `play`, yalnız server ise `run`), oturum yoksa aynı instance için son başarılı `start`'ın mode'u (`lastPlaytestMode`), o da yoksa açıklayıcı hata (Studio'ya dokunmadan). (2) `wasRunning` ise `stopPlaytest` (runtime peer'ların düşmesini bekler; `runtimeStopped:false` ise `phase:"stop"` ile durur). (3) `before_start` varsa `executeLuau(code, 'edit')` — `execute_luau` ile aynı yol/sandbox/limit; `success!==true` ise `error:"before_start_failed"`, `beforeStart` çıktısı döner, start yapılmaz. (4) `startPlaytest(mode)`; sonuçta `wasRunning`, `mode`, `stoppedInMs`, `beforeStartMs`, `startedInMs`, `totalMs`, `beforeStart`, `roles`.
  - `startPlaytest` (3583): başarılı start'ta `lastPlaytestMode.set(instanceId, mode)`.
- `packages/core/src/__tests__/tool-schema.test.ts`: enum beklentisi `['start','stop','status','restart']`.

## Yeşil

Aynı komut, 2026-09-15 11:36 (UTC 08:36), final dist ile:

```
=== TODO#2 solo_playtest restart ===
{"step":"start","elapsedMs":1913,"result":{"success":true,"action":"start","message":"Playtest started.","roles":["edit","server","client-1"]}}
  ✓ initial start succeeds
  ✓ baseline stop succeeds
  ✓ baseline execute_luau succeeds
  ✓ baseline start succeeds
{"step":"baseline-3-calls","calls":3,"stopMs":1086,"syncMs":16,"startMs":1884,"totalMs":2987}
{"step":"restart-1-call","calls":1,"wallMs":2914,"result":{"success":true,"message":"Playtest restarted.","action":"restart","mode":"play","wasRunning":true,"stoppedInMs":1023,"beforeStartMs":17,"startedInMs":1848,"totalMs":2888,"beforeStart":{"returnValue":"Workspace.TodoRestartPart","message":"Code executed successfully","success":true,"output":[]},"roles":["edit","server","client-1"]}}
  ✓ restart succeeds
  ✓ restart echoes action
  ✓ restart reports wasRunning=true while a playtest was active
  ✓ restart preserves the previous play mode when mode is omitted
  ✓ restart reports stoppedInMs
  ✓ restart reports startedInMs
  ✓ restart totalMs within 60 s (got 2888)
  ✓ before_start ran on the edit peer
  ✓ before_start output returned (got {"returnValue":"Workspace.TodoRestartPart","message":"Code executed successfully","success":true,"output":[]})
{"step":"eval_server_runtime","result":{"ok":true,"bridge":"ok","result":"true","output":[]}}
  ✓ new play session sees the Part written before start
{"step":"connected-after-restart","playtest":{"active":true,"mode":"play","startedAt":"2026-09-15T08:36:01.631Z"}}
  ✓ play session is active after restart
  ✓ stop after restart succeeds
{"step":"restart-when-idle","wallMs":1833,"result":{"success":true,"message":"No playtest was running; playtest started.","action":"restart","mode":"play","wasRunning":false,"stoppedInMs":0,"startedInMs":1831,"totalMs":1831,"roles":["edit","server","client-1"]}}
  ✓ idle restart is a plain start
  ✓ idle restart reports wasRunning=false
  ✓ idle restart reuses the last known mode
  ✓ idle restart spends no time stopping
  ✓ final stop succeeds
{"summary":{"before":{"calls":3,"totalMs":2987,"startMs":1884},"after":{"calls":1,"totalMs":2888,"stoppedInMs":1023,"startedInMs":1848,"wallMs":2914},"initialStartMs":1913}}
✅ TODO#2 solo_playtest restart PASSED
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/02-playtest-restart.mjs
1/1 passed.
EXIT 0
```

Araç çağrıları ve ham sonuçlar:
- `solo_playtest {action:"restart", timeout:60, before_start:"local p = Instance.new(\"Part\") p.Name = \"TodoRestartPart\" … p.Parent = workspace return p:GetFullName()"}` (mode verilmedi) → yukarıdaki `restart-1-call` JSON'u.
- `eval_server_runtime {code:"return workspace:FindFirstChild(\"TodoRestartPart\") ~= nil and workspace:FindFirstChild(\"TodoRestartBaselinePart\") ~= nil"}` → `{"ok":true,"bridge":"ok","result":"true"}` — edit DM'e `before_start` ile yazılan Part yeni play oturumunda görünüyor.
- `solo_playtest {action:"restart", timeout:60}` playtest kapalıyken → `wasRunning:false`, `mode:"play"` (son start'tan), `stoppedInMs:0`.

Önce/sonra ölçüm (aynı Studio, boş baseplate): önce 3 çağrı / 2987 ms toplam (stop 1086 + sync 16 + start 1884); sonra 1 çağrı / 2888 ms (stop 1023 + before_start 17 + start 1848). Çağrı sayısı 3→1; toplam süre ~aynı (start süresi Studio'nun kendisi; TODO'daki 20–30 s kuyruk kazancı çok ajanlı kilitte tek çağrıya inmesinden gelir). `totalMs` ≤ 60 s: 2888 ms.

Jest (`npm test -w packages/core -- studio-playtest-control`), `TODO#2` describe'ı 6 test: şema (`restart` + `before_start`); stop→execute-luau→start endpoint sırası, `mode:"play"` korunur, `beforeStart` çıktısı; yalnız server → `run`; kapalıyken restart = düz start (`wasRunning:false, stoppedInMs:0`, son mode); ne oturum ne bilinen mode → hata, Studio'ya istek yok; `before_start` hatası → `before_start_failed`, start yapılmaz.

## Regresyon

- `npm run typecheck`: yeşil.
- `npm run lint`: 7 hata / 40 uyarı = başlangıçtaki 7 eski hata; yeni yok.
- `npm test -w packages/core`: 37 suite / 654 test yeşil.
- İlk yeşil denemesinde 1 kez managed launch altyapı hatası (`Timed out waiting for managed instance registry lock`, 5 ajan eş zamanlı); tekrar koşuşta 2/2 geçti (ilk geçiş 11:33, final dist ile ikinci geçiş 11:36; her ikisi de yeşil, ölçümler ±100 ms).
