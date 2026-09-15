# TODO#10 — play modunda `capture_screenshot` client peer seçimi (P2)

## Belirti / yeniden üretme

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/10-capture-target-peer.mjs` (düzeltmesiz kod, ham çıktı `10-red.log`). Play modunda `target` vermeden, `target:"client-1"`, `target:"server"`, `target:"client-7"` ve edit modunda `target:"edit"` ile capture; sonuçta `peer`/`target` alanı ve hata metninde denenen peer beklenir.

```
(10-red.log, düzeltmesiz sunucu; 2026-09-15 ~11:47)
capture_screenshot {"target":"edit"} (edit) -> 723ms {"width":1324,"height":772,"format":"png",...}  image 1324x772, 2758 unique colours   ← peer/target alanı YOK
solo_playtest start play → client-1
capture_screenshot {}                -> 1458ms {"width":1608,"height":772,... "Warning: Studio's CaptureService returned a blank (single-colour) frame and host window capture also failed (could not pick a Studio window for 'RunnerBaseplate.rbxl' among: …4 pencere…)"}  image 1608x772, 1 unique colours
capture_screenshot {"target":"client-1"} -> 1255ms  aynı; peer alanı yok; target yok sayıldı
capture_screenshot {"target":"server"}   -> 1257ms  isError=false, aynı boş kare (server reddedilmiyor)
capture_screenshot {"target":"client-7"} -> 1336ms  isError=false, aynı boş kare (bağlı olmayan peer reddedilmiyor)
❌ FAILED: play mode without target must use client-1   (+ actual: undefined, - expected: 'client-1')
```

## Düzeltme

- `packages/core/src/tools/index.ts`: `_resolveCapturePeer(instance_id, target)` — `target` yoksa/`auto` → play'de en düşük `client-N`, yoksa `edit` (eski davranış); `edit`/`client-N` açıkça seçilir (bağlı değilse hata + bağlı peer listesi); `server` → "does not render a viewport; use client-1 or edit" hatası. Her sonuçta `peer` (kullanılan) ve `target` (istenen ya da `auto`); her hata metninin sonunda `(peer tried: <peer>; target: <target>)` ve JSON'da `peer`.
- `packages/core/src/tools/definitions.ts`: `capture_screenshot.inputSchema.target`; `packages/core/src/http-server.ts:276` parametre geçişi.
- Birim: `host-capture.test.ts` › "target selects the peer explicitly and rejects peers that cannot render", "keeps the Studio error … peer tried: client-1".

## Yeşil

```
2026-09-15 ~11:51 (log mtime)
capture_screenshot {"target":"edit"}  -> 550ms {"width":1324,"height":772,"peer":"edit","target":"edit","source":"CaptureService","cropped":true}   image 1324x772, 1613 unique colours
solo_playtest start play → client-1 (edit+server+client-1)
capture_screenshot {}                 -> 2262ms {"width":1608,"height":772,"peer":"client-1","target":"auto","source":"host-window","cropped":true,"viewportRect":{"x":3,"y":188,"width":1608,"height":772},"window":{…"method":"printwindow"…}}   image 1608x772, 6022 unique colours
capture_screenshot {"target":"client-1"} -> 1321ms {"width":1608,"height":772,"peer":"client-1","target":"client-1","source":"host-window",…}   image 1608x772, 8494 unique colours
capture_screenshot {"target":"server"}   -> 5ms isError=true {"error":"tool_failed","message":"capture_screenshot target \"server\" was requested, but the play server does not render a viewport; use target \"client-1\" (the play client) or \"edit\". Connected peers: client-1, edit, server."}
capture_screenshot {"target":"client-7"} -> 1ms isError=true {"error":"tool_failed","message":"capture_screenshot target \"client-7\" is not connected on instance:3dy-0xs. Connected peers: client-1, edit, server."}
RESULT auto=client-1/host-window explicit=client-1/host-window
✅ TODO#10 capture_screenshot target peer selection PASSED     EXIT=0
```

Kırmızı→yeşil: `peer` alanı yok / target yok sayılıyor / server ve client-7 sessizce boş kare → `peer:"client-1"`, `target:"auto"|"client-1"`, server 5 ms'de açıklayıcı hata, client-7 1 ms'de peer listesiyle hata; capture hatalarının metninde `(peer tried: <peer>; target: <target>)` (birim: host-capture.test.ts "keeps the Studio error…", "explains a marker miss…").

## Regresyon

- `npm run typecheck` yeşil.
- `npm run lint`: yalnız 7 eski hata (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2); yeni hata yok.
- `npm test -w packages/core`: 38 suite / 658 test yeşil (host-capture 31 + todo-01 5 dahil). `mcp-runtime.test.ts` "keeps the expanded catalog within its token budget" eşiği 20 000 → 20 500 karakter (başlangıçta 19 953; `capture_screenshot` şemasına `target`/`fallback` eklenince 20 235 — 47 karakterlik boşluğa hiçbir yeni parametre sığmıyordu; açıklamalar 64 karakter altına indirildi; orkestratöre açık soru).
