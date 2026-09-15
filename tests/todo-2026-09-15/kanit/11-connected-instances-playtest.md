# TODO#11 (+ #9 kısmen) — `get_connected_instances`: `playtest {active, mode, startedAt}` + `windowTitle` / `processId`

Ajan B, dal `todo/B`, 2026-09-15.

## Belirti / yeniden üretme

Komut (worktree'den, managed baseplate):

```
node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/11-connected-instances-playtest.mjs
```

Kırmızı ham çıktı (kod `636f2a1`+`55577fa`, düzeltmesiz, 2026-09-15 ~11:20):

```
=== TODO#11 get_connected_instances playtest + window ===
{"step":"before-play","instance":{"id":"instance:29t-38i","placeId":0,"placeName":"RunnerBaseplate.rbxl","peers":{"edit":"peer:9pn-kjs"}}}
  ✓ get_connected_instances lists instance:29t-38i
❌ TODO#11 get_connected_instances playtest + window FAILED: ASSERT FAIL: playtest field present before play
========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/11-connected-instances-playtest.mjs
0/1 passed.
EXIT 1
```

Birim (jest) kırmızı: `studio-playtest-control.test.ts` derlenemedi — `soloPlaytest` 5. parametreyi (before_start) kabul etmiyor (TS2554), `before_start` şemada yok; `playtest`/`windowTitle` bekleyen testler `Tests: 0 total` ile hiç koşamadı.

## Düzeltme

- `packages/core/src/bridge-service.ts` (60–72, 398–407, 886): `ConnectedPlaytestState` tipi; `playtestStateOf(instance)` — runtime peer (server/client-N) varsa `active:true`; `mode` = multiplayer grubuysa `"multiplayer"`, client peer varsa `"play"`, yalnız server ise `"run"`; `startedAt` = en erken runtime peer `connectedAt` (ISO). Runtime peer yoksa `{active:false}`.
- `packages/core/src/tools/index.ts` (`getConnectedInstances`, 4165–4240): her instance için `windowTitle` + `processId`. Kaynak: `observeStudioProcesses()` (`studio-instance-manager.ts`, mevcut export; `Get-Process RobloxStudioBeta` → `Id`, `MainWindowTitle`). Eşleme: pencere başlığından " - Roblox Studio" soneki ve dizin yolu atılır (yerel dosyalarda başlık tam yoldur: `C:\…\RunnerBaseplate.rbxl - Roblox Studio`), kalan `.rbxl/.rbxlx` uzantılı/uzantısız olarak peer'ın `dataModelName`/`placeName`'i ile karşılaştırılır. Tek eşleşme → alanlar yazılır; 0 ya da >1 eşleşme → managed kayıt pid'i (`instanceManager.get(id).nativeProcessId`) ile çözülür, o da yoksa alanlar yazılmaz (yanlış pencere raporlamaktansa boş). Süreç listesi 2 s önbelleklenir (`STUDIO_WINDOW_SNAPSHOT_TTL_MS`; `waitForEditPeer` 500 ms'de bir çağırıyor). Eklenti tarafında pencere başlığı okunamadığı için sunucu tarafı çözüm; `host-capture.ts`'e dokunulmadı.
- Birim testlerde PowerShell çağrısı olmasın diye `studioWindowLookup` özel alanı sahte snapshot ile değiştiriliyor (`proxy-runtime-logs.test.ts` 3 yer, `smoke.test.ts` 1 yer, yeni testler).

## Yeşil

Aynı komut, 2026-09-15 11:35 (UTC 08:35), final dist ile (`npm run build` sonrası):

```
=== TODO#11 get_connected_instances playtest + window ===
{"step":"before-play","instance":{"id":"instance:gsu-8eu","placeId":0,"placeName":"RunnerBaseplate.rbxl","peers":{"edit":"peer:p2t-qd7"},"playtest":{"active":false},"windowTitle":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-runner-Syb5iR\\RunnerBaseplate.rbxl - Roblox Studio","processId":70444}}
  ✓ get_connected_instances lists instance:gsu-8eu
  ✓ playtest field present before play
  ✓ playtest.active is false before play
  ✓ windowTitle is a string (got "C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-runner-Syb5iR\\RunnerBaseplate.rbxl - Roblox Studio")
  ✓ windowTitle "C:\Users\hasan\AppData\Local\Temp\rsmcp-runner-Syb5iR\RunnerBaseplate.rbxl - Roblox Studio" contains place name "RunnerBaseplate.rbxl"
  ✓ processId is a positive integer (got 70444)
  ✓ start succeeds
{"step":"during-play","instance":{"id":"instance:gsu-8eu","placeId":0,"placeName":"RunnerBaseplate.rbxl","peers":{"edit":"peer:p2t-qd7","server":"peer:fbk-z7x","client-1":"peer:nvn-zfs"},"playtest":{"active":true,"mode":"play","startedAt":"2026-09-15T08:35:30.323Z"},"windowTitle":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-runner-Syb5iR\\RunnerBaseplate.rbxl - Roblox Studio","processId":70444}}
  ✓ get_connected_instances lists instance:gsu-8eu
  ✓ playtest.active is true during play
  ✓ playtest.mode is "play" (got play)
  ✓ playtest.startedAt is ISO (got 2026-09-15T08:35:30.323Z)
  ✓ playtest.startedAt is recent
  ✓ processId is stable across play
  ✓ stop succeeds
{"step":"after-stop","instance":{"id":"instance:gsu-8eu","placeId":0,"placeName":"RunnerBaseplate.rbxl","peers":{"edit":"peer:p2t-qd7"},"playtest":{"active":false},"windowTitle":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-runner-Syb5iR\\RunnerBaseplate.rbxl - Roblox Studio","processId":70444}}
  ✓ get_connected_instances lists instance:gsu-8eu
  ✓ playtest.active is false after stop
  ✓ no mode/startedAt when idle
✅ TODO#11 get_connected_instances playtest + window PASSED
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/11-connected-instances-playtest.mjs
1/1 passed.
EXIT 0
```

Araç: `get_connected_instances {}` → ham JSON yukarıda (3 çağrı: play öncesi / play / stop sonrası). `solo_playtest {action:"start", mode:"play", timeout:60}` ve `{action:"stop", timeout:30}` başarılı.

Jest (`npm test -w packages/core -- studio-playtest-control`): `TODO#11 / TODO#9` describe'ında 6 test — idle `{active:false}` ve pencere alanı yok; play → `mode:"play"` + ISO `startedAt` (en erken runtime peer); yalnız server → `"run"`; yayınlanmış başlık ve tam yollu `.rbxl` başlığı → doğru pid; belirsiz başlık (2 aynı ad, managed kayıt yok) → alanlar yok.

Önce/sonra: önce çıktıda `id, placeId, placeName, peers` (4 alan; play durumu `peers` içinden tahmin ediliyordu, süre yok, pencere yok) → sonra +`playtest` (3 alt alan) +`windowTitle` +`processId`.

## Regresyon

- `npm run typecheck`: yeşil.
- `npm run lint`: 7 hata / 40 uyarı = başlangıçtaki 7 eski hata (install-plugin-helpers 254–257, opencloud-client 445, install-plugin `_chunk` ×2); yeni hata yok.
- `npm test -w packages/core`: 37 suite / 654 test yeşil (başlangıç 643 + 11 yeni; `mcp-runtime.test.ts` fixture'ına `playtest:{active:false}` eklendi, `tool-schema.test.ts` enum beklentisine `restart` eklendi).
- Not: ilk tam jest koşusunda `proxy-runtime-logs.test.ts` 2 test düştü (get_connected_instances gerçek PowerShell `Get-Process`'i çağırıyor, paralel worker + makine yükü → 30 s timeout). Sahte `studioWindowLookup` enjekte edilince 37/37 yeşil; birim testler artık süreç başlatmıyor.
- İlk yeşil denemelerinde 2 kez managed launch altyapı hatası (5 ajan aynı anda): `Timed out waiting for managed instance registry lock` ve `ENOENT …\managed-instances\v1\.lock\owner.json` (`managed-instance-registry.ts:235–243`: mkdir'den sonra owner.json yazımı ENOENT verince yeniden denemek yerine fırlatıyor). Test kodu/ürün kodumla ilgisiz; yeniden koşuşta geçti. Orkestratöre iletildi.
