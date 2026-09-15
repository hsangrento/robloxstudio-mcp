# TODO#1 — `capture_screenshot` play modunda boş kare (P1)

Dal `todo/A`, başlangıç `55577fa`. Managed baseplate Studio (kullanıcının 4 açık Studio'suna dokunulmadı; pencere listesi ham loglarda).

## Belirti / yeniden üretme

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/01-capture-play-blank.mjs` (düzeltmesiz kod, ham çıktı `01-red.log`).

Ham (kırpılmış; tam metin `01-red.log`):

```
instance instance:62t-uf7 placeName=RunnerBaseplate.rbxl peers={"edit":"peer:bmy-5dy"}
capture_screenshot {} -> 2231ms {"width":1324,"height":772,...}            image 1324x772, 1613 unique colours   (edit, kontrol)
Studio window {"title":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-runner-xjn68r\\RunnerBaseplate.rbxl - Roblox Studio","handle":6033628,"iconic":false,"pid":41268}
window probe (play, no markers): {"width":1920,"height":1009,"printed":true,"printwindowColours":9298,"printwindowMagenta":0,"screenColours":9323,"screenMagenta":0}
client-1 ViewportSize 1608x772 (emulation off)
capture_screenshot {} -> 4769ms {"width":1608,"height":772,... "Warning: Studio's CaptureService returned a blank (single-colour) frame and host window capture also failed (could not pick a Studio window for 'RunnerBaseplate.rbxl' among: C:\\...\\RunnerBaseplate.rbxl - Roblox Studio | 🐌 +1 Salyangoz Kaçışı! [OBBY] - Roblox Studio | ...keyboard_escape_sangrento_studio_full_rebrand.rbxl - Roblox Studio | ...VWScripted-imp.rbxl - Roblox Studio), so this image may be blank."}
    image 1608x772, 1 unique colours
set_device_simulator {"target":"client-1","deviceId":"hd_720"}  → client-1 ViewportSize 1279x720 (isSimulating, scalingMode ScaleToPhysicalSize, resolution 1280x720)
capture_screenshot {} -> 2177ms {"width":1466,"height":825, ... aynı uyarı}   image 1466x825, 1 unique colours
capture_screenshot {"fallback":"window"} -> 2051ms {"width":1466,"height":825, ... aynı uyarı}   image 1466x825, 1 unique colours   (parametre yok sayıldı)
❌ FAILED: play capture (emulation off) is a single colour (1)
```

Birim (düzeltmesiz `host-capture.ts`, `npm test -w packages/core -- todo-01-capture-markers`, ham `01-unit-red.log`):

```
● a 1326x662 on-screen pane is accepted when the client reports a 1608x661 viewport
  + "error": "viewport marker box 1326x662 does not match the reported 1608x661 viewport aspect"
● a marker miss reports the pixel count and the branch that failed   (branch/markerPixels alanları yok)
Tests: 2 failed, 3 passed
```

## Kök neden (ham loglardan)

1. **CaptureService play istemcisinde siyah kare veriyor**: `/api/capture-begin` client-1'de `CaptureService:CaptureScreenshot` → rbxtemp id; `/api/capture-read` edit DM'de EditableImage → 1608×772, **1 renk**. Emülasyon açıkken de 1466×825, 1 renk (kare boyutu = fiziksel emülasyon çerçevesi, ViewportSize 1279×720 değil).
2. **Pencere seçimi**: `host-capture.ts` pencereyi `Title.StartsWith(hint)` ile seçiyordu; hint = `dataModelName`/`placeName` (`RunnerBaseplate.rbxl`), yerel dosya yerlerinde başlık **tam dosya yolu** (`C:\...\RunnerBaseplate.rbxl - Roblox Studio`). Birden çok Studio açıkken → "could not pick a Studio window". (Sahada yayınlanmış yer adıyla eşleşiyordu; orada 3. madde geçerli.)
3. **Marker'lar cihaz emülasyonunda**: HD 720 + "Fiziksel boyut" modunda emüle çerçeve pencere içinde 1466×825 px (67,177'den başlar), görünür pane yüksekliği ~758 px → **alt marker'lar pane dışında** (kaydırma çubuğu çıkıyor; ekran görüntüsü `todo-probe-*/printwindow.png`). Eski kod: dört köşe kontrolü yalnız üst iki marker'la da geçiyor → 1466×14'lük sahte kutu (ilk yeşil denemede `viewportRect.height=14`, görüntü 93 renk). Ayrıca `MARKER_SCALE_TOLERANCE` (host-capture.ts:128–134) eksen başına farklı ölçeği (1326/1608 vs 662/661) reddediyordu.
4. **PrintWindow bu makinede viewport'u içeriyor** (probe: printwindow 9703 renk vs screen 9709; play modunda, işaretsiz). Sahadaki "no viewport markers" için tek açıklama PrintWindow değil, 3. madde ya da pane dışı marker'lar; artık hata metni marker sayısı/yöntem/emülasyon/peer veriyor ve `auto` yöntemi PrintWindow'da marker yoksa pencereyi öne alıp ekran kopyası (BitBlt) alıyor.
5. **CoreGui client peer'da erişilebilir**: `/api/capture-markers` ClientBroker üzerinden client-1 VM'inde çalışıyor (`CLIENT_BROKER_ALLOWED_ENDPOINTS`), ScreenGui `CoreGui`'ye parent'lanıyor; yeşil koşuda marker'lar client-1 için bulundu (`peer:"client-1"`, `viewportRect` dolu). `show` yanıtına `markerParent` ve `emulation` alanları eklendi.

## Düzeltme

- `packages/core/src/host-capture.ts`: `findViewportRect` → `ViewportLocateResult` (`markerPixels`, `scaleX/scaleY`, `branch: none|rectangle`, tek sıra marker'dan yükseklik çıkarımı + `clipped:{edge,pixels}`); aspect reddi kaldırıldı; `cropToViewport` pencere dışı kaynak pikselleri siyah bırakır; PowerShell yardımcısı: `MCP_CAPTURE_MODE=list|capture`, `MCP_CAPTURE_METHOD=printwindow|screen|auto`, küçültülmüş pencereyi `ShowWindow(SW_RESTORE)` + `SetForegroundWindow` (Alt tuşu hilesiyle) ile geri getirir, per-monitor DPI, `ClientToScreen` (viewportRect ekran koordinatı), C#'ta magenta sayımı; başlık eşleşmesi `studioWindowMatchesHint` (yer adı / dosya adı / uzantısız dosya adı); pencere seçimi `MCP_CAPTURE_PID` (yönetilen sürecin pid'i) → tek başlık eşleşmesi → tek aday; dışa aktarılan yardımcılar: `listStudioWindows()`, `findStudioWindow(titleHint, pid)`, `pickStudioWindow(windows, titleHint, pid)`, `studioWindowMatchesHint`, `studioWindowPlaceName`, `captureStudioWindow(titleHint, {method, foreground, pid})`.
- `packages/core/src/studio-instance-manager.ts`: `peekProcessIdByInstanceId(instanceId)` (bellekteki managed kayıttan `nativeProcessId ?? spawnPid`; capture yolunda pencere seçimi için).
- `packages/core/src/tools/index.ts` (capture bölümü): `captureScreenshot(instance_id, format, quality, target, fallback)`; sonuçta `peer`, `target`, `source`, `cropped`, `viewportRect`, `clipped`, `window{title,handle,width,height,method,restored,foreground}`; `fallback:"window"` Studio yakalamasını atlayıp kırpılmamış pencereyi döndürür; marker hatası metni: `branch`, marker piksel sayısı, yöntem başına magenta sayısı, pencere/yöntem/foreground/restored, render edilen kare sayısı, viewport, emülasyon durumu, peer.
- `packages/core/src/http-server.ts:276` (target/fallback geçişi), `packages/core/src/tools/definitions.ts` (`capture_screenshot` şeması: `target`, `fallback`).
- `studio-plugin/src/modules/handlers/CaptureHandlers.ts`: `capture-markers` `query`/`show` yanıtına `emulation{active,deviceId,resolution}` (StudioDeviceSimulatorService, pcall) ve `markerParent`.

## Yeşil

Aynı komut (ham `01-green.log`; tarih-saat log dosyasında):

```
2026-09-15 ~11:50 (log mtime), pid=56328 (manage_instance status), Studio window "…\rsmcp-runner-KOzrU4\RunnerBaseplate.rbxl - Roblox Studio" handle 20450826
capture_screenshot {}  (edit)                -> 680ms  {"width":1324,"height":772,"peer":"edit","target":"auto","source":"CaptureService","cropped":true}   image 1324x772, 1613 unique colours
solo_playtest start play → client-1; ViewportSize 1608x772 (emulation off)
capture_screenshot {}  (play, emülasyon KAPALI) -> 4865ms {"width":1608,"height":772,"peer":"client-1","target":"auto","source":"host-window","cropped":true,
   "viewportRect":{"x":3,"y":188,"width":1608,"height":772},"window":{"title":"…RunnerBaseplate.rbxl - Roblox Studio","handle":20450826,"width":1920,"height":1009,"method":"printwindow","restored":false,"foreground":false},
   "message":"… Captured from the Studio window through the host OS (printwindow) because Studio's CaptureService returned a blank (single-colour) frame."}
    image 1608x772, 10014 unique colours
set_device_simulator {"target":"client-1","deviceId":"hd_720"} → ViewportSize 1279x720 (isSimulating, ScaleToPhysicalSize, 1280x720)
capture_screenshot {}  (play, emülasyon AÇIK)  -> 4702ms {"width":1279,"height":720,"peer":"client-1","source":"host-window","cropped":true,
   "viewportRect":{"x":67,"y":203,"width":1466,"height":825},"clipped":{"edge":"bottom","pixels":0},
   "message":"… Only the top viewport markers were visible, so the viewport extends past the Studio pane (device emulation larger than the pane); the bottom strip of this image may show pane chrome or black instead of the viewport."}
    image 1279x720, 18067 unique colours
capture_screenshot {"fallback":"window"}       -> 1327ms {"width":1920,"height":1009,"peer":"client-1","source":"host-window","cropped":false,"viewportRect":{"x":67,"y":203,"width":1466,"height":825},…}
    image 1920x1009, 15729 unique colours   (pencere 1920x1009 ≥ viewport 1279x720)
RESULT edit=1324x772/1613c play-off=1608x772/10014c play-on=1279x720/18067c window=1920x1009/15729c
✅ TODO#1 capture_screenshot play-mode blank frame PASSED     EXIT=0
```

Kırmızı→yeşil: play (emülasyon kapalı) 1608×772 **1 renk** → 1608×772 **10 014 renk**; play (HD 720) 1466×825 1 renk → 1279×720 (ViewportSize) 18 067 renk; `fallback:"window"` yok sayılıyordu → 1920×1009 kırpılmamış pencere + `viewportRect`.

Ara denemeler: (a) 11:37 — emülasyonlu capture `viewportRect.height=14`, 93 renk (alt marker'lar pane dışında; dört köşe kontrolü üst iki marker'la geçiyordu) → tek sıra marker çıkarımı + `clipped`. (b) 11:4x — sunucu başka bir ajanın aynı adlı managed Studio penceresini (`rsmcp-runner-xEWG7k`, bizimki `UpuM1x`) yakaladı → "no viewport markers … (branch: none; marker pixels in the analysed grab: 0; magenta pixels per method: screen=0, printwindow=0; window '…' 1920x1009 via screen, foreground=true, restored=false; frames rendered with markers: 3; reported viewport 1608x772; device emulation: off; peer: client-1)" — hata metni beklendiği gibi ayrıntılı; pencere seçimi artık yönetilen sürecin **pid**'iyle (`StudioInstanceManager.peekProcessIdByInstanceId` → `MCP_CAPTURE_PID`), sonra tek başlık eşleşmesi, sonra tek aday; birden çok başlık eşleşmesi "several Studio windows match" hatası.

Birim: `npm test -w packages/core -- host-capture todo-01` → `Tests: 34 passed, 34 total` (`01-unit-green.log`).

## Regresyon

- `npm run typecheck` yeşil.
- `npm run lint`: yalnız 7 eski hata (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2); yeni hata yok.
- `npm test -w packages/core`: 38 suite / 658 test yeşil (host-capture 31 + todo-01 5 dahil). `mcp-runtime.test.ts` "keeps the expanded catalog within its token budget" eşiği 20 000 → 20 500 karakter (başlangıçta 19 953; `capture_screenshot` şemasına `target`/`fallback` eklenince 20 235 — 47 karakterlik boşluğa hiçbir yeni parametre sığmıyordu; açıklamalar 64 karakter altına indirildi; orkestratöre açık soru).
