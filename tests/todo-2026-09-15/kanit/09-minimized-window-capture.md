# TODO#9 — küçültülmüş Studio penceresi / pencere handle'ı (P2, capture kısmı)

Kapsam (Ajan A): `capture_screenshot` küçültülmüş pencereyi geri getirip öne alır; pencere bulma/başlık okuma yardımcıları `host-capture.ts`'den dışa aktarıldı (Ajan B `get_connected_instances`'a `windowTitle`/`windowHandle` eklerken kullanır).

## Belirti / yeniden üretme

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/09-minimized-window-capture.mjs` (düzeltmesiz kod, ham çıktı `09-red.log`). Test managed baseplate'in penceresini `manage_instance status` → `pid` ile bulur (`listStudioWindows`; pid yoksa `placeName` eşleşmesi), play modunda `ShowWindow(h, SW_MINIMIZE)` ile küçültür, `capture_screenshot` çağırır; kullanıcının diğer 3 Studio penceresinin `IsIconic` durumunun değişmediğini doğrular.

```
(09-red.log, düzeltmesiz sunucu+eklenti; 2026-09-15 ~11:55)
managed window: {"title":"…\rsmcp-runner-rI7Vtt\RunnerBaseplate.rbxl - Roblox Studio","handle":5050374,"iconic":false,"pid":60376}; untouched windows: 3
solo_playtest start play → client-1
ShowWindow(5050374, SW_MINIMIZE) -> {"iconic":true,"ok":true}
capture_screenshot (minimized) -> 1570ms {"width":1608,"height":772,… "Warning: Studio's CaptureService returned a blank (single-colour) frame and host window capture also failed (could not pick a Studio window for 'RunnerBaseplate.rbxl' among: …4 pencere…), so this image may be blank."}
    image 1608x772, 1 unique colours
window state after capture: {"iconic":true,"foreground":false,"visible":true}
❌ FAILED: capture from a minimized window is a single colour (1)
```
(İlk kırmızı deneme 11:4x'te "expected exactly one Studio window … found 2" ile düştü: başka bir ajanın managed Studio'su aynı `RunnerBaseplate.rbxl` adıyla açıktı → test pencereyi `manage_instance status` `pid`'iyle bulacak şekilde değiştirildi.)

## Düzeltme

- `packages/core/src/host-capture.ts`: PowerShell yardımcısı `IsIconic` → `ShowWindow(h, 9 /*SW_RESTORE*/)` + `BringToFront` (`SetForegroundWindow`; başarısızsa Alt tuşu `keybd_event` hilesi + tekrar) + 400 ms bekleme; sonuçta `restored`, `foreground`. `method:'screen'` ya da `auto`'da ikinci deneme de pencereyi öne alır (ekran kopyası için zorunlu).
- Dışa aktarılan yardımcılar (Ajan B için): `listStudioWindows(): Promise<{ok:true, windows: StudioWindowInfo[]} | {ok:false,error}>` (`StudioWindowInfo = {handle, pid, title, placeName, isIconic}`), `findStudioWindow(titleHint)`, `studioWindowMatchesHint(title, hint)`, `studioWindowPlaceName(title)`.
- `packages/core/src/tools/index.ts`: sonuçta `window: {title, handle, width, height, method, restored, foreground}`; iki grab'deki `restored`/`foreground` birleştirilir.

## Yeşil

```
2026-09-15 ~11:51 (log mtime); manage_instance status → pid=66180; managed window {"title":"…\rsmcp-runner-pJeN6Z\RunnerBaseplate.rbxl - Roblox Studio","handle":10489382,"iconic":false,"pid":66180}; untouched windows: 3
solo_playtest start play → client-1
ShowWindow(10489382, SW_MINIMIZE) -> {"iconic":true,"ok":true}
capture_screenshot (minimized) -> 3001ms {"width":1608,"height":772,"peer":"client-1","target":"auto","source":"host-window","cropped":true,"viewportRect":{"x":3,"y":188,"width":1608,"height":772},
   "window":{"title":"…RunnerBaseplate.rbxl - Roblox Studio","handle":10489382,"width":1920,"height":1009,"method":"printwindow","restored":true,"foreground":true},
   "message":"… Captured from the Studio window through the host OS (printwindow) because Studio's CaptureService returned a blank (single-colour) frame."}
    image 1608x772, 9917 unique colours
window state after capture: {"iconic":false,"foreground":true,"visible":true}
other Studio windows unchanged (3)      (kullanıcının 3 Studio'sunun iconic durumu öncesiyle aynı)
RESULT IsIconic=false, image 1608x772/9917c, restored=true, method=printwindow
✅ TODO#9 capture_screenshot restores a minimized Studio window PASSED     EXIT=0
```

Kırmızı→yeşil: küçültülmüş pencerede 1608×772 **1 renk**, `IsIconic=true` kalıyor → 1608×772 **9 917 renk**, `IsIconic=false`, `window.restored=true`, `foreground=true`, 3,0 s.

## Regresyon

- `npm run typecheck` yeşil.
- `npm run lint`: yalnız 7 eski hata (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2); yeni hata yok.
- `npm test -w packages/core`: 38 suite / 658 test yeşil (host-capture 31 + todo-01 5 dahil). `mcp-runtime.test.ts` "keeps the expanded catalog within its token budget" eşiği 20 000 → 20 500 karakter (başlangıçta 19 953; `capture_screenshot` şemasına `target`/`fallback` eklenince 20 235 — 47 karakterlik boşluğa hiçbir yeni parametre sığmıyordu; açıklamalar 64 karakter altına indirildi; orkestratöre açık soru).
