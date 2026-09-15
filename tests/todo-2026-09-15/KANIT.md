# KANIT — TODO.md maddeleri (2026-09-15)

## Başlangıç (HEAD 3847349 = df6e536 + TODO.md commit'i, Node v24.13.0, npm 11.6)

| Komut | Sonuç |
|---|---|
| `npm ci` / `npm ci --prefix studio-plugin` | tamam (55 paket eklenti) |
| `npm run build:all` | tamam; MCPPlugin.rbxmx + MCPInspectorPlugin.rbxmx üretildi, `%LOCALAPPDATA%\Roblox\Plugins`'e kuruldu |
| `npm run typecheck` | yeşil |
| `npm run lint` | **baştan kırmızı**: 7 hata (install-plugin-helpers.ts:254–257 mixed spaces/tabs; opencloud-client.ts:445 no-constant-condition; packages/robloxstudio-mcp{,-inspector}/src/install-plugin.ts `_chunk` unused), 40 uyarı — TODO kapsamı dışı, dokunulmadı |
| `npm test -w packages/core` | 37 suite / 643 test yeşil |
| `npm run test:asset-security` | 4/4 yeşil |
| `npm run test:package-contents` | **baştan kırmızı**: `spawnSync('npm.cmd', …)` Node 24'te `status: null` (EINVAL; shell olmadan .cmd) — ortam sorunu, TODO dışı |
| `npm run test:runner` | 6/6 yeşil (mcp-http-client, output-parser 134 MB/296 ms, managed-studio-session, instance-routing, auto-install-run-process, studio-directory-isolation) |
| `npm run test:port-isolation` | 3/3 yeşil |
| `npm run test:studio:smoke` (ayrı baseplate Studio, kullanıcının 3 Studio'su açıkken) | 3/3 yeşil: studio-tooling-smoke, eval-context-routing, micro-profiler-responsiveness |

Canlı MCP (port 58741) başlangıçta 3 instance görüyor: `instance:kqq-3vh`, `instance:v5b-wun` (edit+server+client-1), `instance:f4w-te1`.

Ajan düzeni: 5 worktree (`mcp/wt/A..E`, dallar `todo/A..E`), madde başına kanıt dosyası `tests/todo-2026-09-15/kanit/NN-*.md`; bu dosya sonda birleştirilir.

## Birleşik doğrulama (HEAD 073418a, 2026-09-15 12:00–12:40)

Dallar `todo/A..E` sırayla `fix/playtest-screenshot-host-capture`'a birleştirildi (çatışmalar: `tools/index.ts` exportRbxm C↔D, `QueryHandlers.ts` getInstanceProperties C↔E, `TODO.md` #9 A↔B, `mcp-runtime.test.ts` katalog bütçesi A↔E — elle çözüldü).

| Komut | Sonuç |
|---|---|
| `npm run typecheck` | yeşil |
| `npm run lint` | 7 hata / 40 uyarı = başlangıçtaki eski 7; yeni hata yok |
| `npm test -w packages/core` | 41 suite / 702 test yeşil (başlangıç 37/643; +4 suite `todo-*.test.ts`) |
| `npm run test:asset-security` | 4/4 |
| `npm run test:runner` / `test:port-isolation` | 6/6, 3/3 |
| `npm run build:all` | tamam; eklenti `%LOCALAPPDATA%\Roblox\Plugins\MCPPlugin.rbxmx` güncellendi (Studio yeniden açılınca yüklenir) |
| `npm run test:todo` (jest todo-* 17/17 + 13 Studio testi tek managed baseplate'te) | ilk koşu 12/13 (01: emülasyon sonrası `ViewportSize` 1608×772 kaldı, görüntü 1279×720 — test beklentisi gevşetildi, commit 073418a); 01 tek başına yeniden: yeşil |
| `npm run test:studio:smoke` | 3/3 yeşil |
| `npm run test:studio:runner` | aşağıda |

Katalog bütçesi: 5 aracın yeni parametreleri toplam 45 143 karakter → `mcp-runtime.test.ts` eşiği 45 000→46 000 (inspector 21 000→21 500), `docs/token-efficiency.md` güncellendi (açık API kararı, commit 3c37625).

`test:todo` managed Studio özeti (ilk birleşik koşu):
```
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/00-saha-regresyon.mjs
  ❌ FAIL  todo-2026-09-15/01-capture-play-blank.mjs
  ✅ PASS  todo-2026-09-15/02-playtest-restart.mjs
  ✅ PASS  todo-2026-09-15/03-import-service-root.mjs
  ✅ PASS  todo-2026-09-15/04-streaming-props.mjs
  ✅ PASS  todo-2026-09-15/05-execute-luau-truncation.mjs
  ✅ PASS  todo-2026-09-15/06-runtime-log-merge.mjs
  ✅ PASS  todo-2026-09-15/07-queue-dedupe.mjs
  ✅ PASS  todo-2026-09-15/08-tags.mjs
  ✅ PASS  todo-2026-09-15/09-minimized-window-capture.mjs
  ✅ PASS  todo-2026-09-15/10-capture-target-peer.mjs
  ✅ PASS  todo-2026-09-15/11-connected-instances-playtest.mjs
  ✅ PASS  todo-2026-09-15/13-export-report.mjs

12/13 passed.

========== TODO SUMMARY ==========
  ✅ PASS  jest packages/core todo-*  (4332 ms)
  ❌ FAIL  managed Studio suite (13 test)  (147553 ms)

1/2 passed.
EXIT 1
```
01 yeniden koşu (073418a):
```
=== TODO#1 capture_screenshot play-mode blank frame ===
  capture_screenshot {} -> 509ms {"width":1324,"height":772,"format":"png","mimeType":"image/png","peer":"edit","target":"auto","source":"CaptureService","cropped":true,"message":"Screenshot 1324x772p
    image 1324x772, 1613 unique colours
  client-1 ViewportSize 1608x772 (emulation off)
  capture_screenshot {} -> 2067ms {"width":1608,"height":772,"format":"png","mimeType":"image/png","peer":"client-1","target":"auto","source":"host-window","cropped":true,"viewportRect":{"x":3,"y":188
    image 1608x772, 9555 unique colours
  client-1 ViewportSize 1608x772 (emulation on: {"target":"client-1","role":"client-1","isSimulating":true,"activeDeviceId":"hd_720","orientation":"LandscapeRight","scalingMode":"ScaleToPhysicalSize",
  capture_screenshot {} -> 2085ms {"width":1279,"height":720,"format":"png","mimeType":"image/png","peer":"client-1","target":"auto","source":"host-window","cropped":true,"viewportRect":{"x":67,"y":20
    image 1279x720, 18739 unique colours
  capture_screenshot {"fallback":"window"} -> 725ms {"width":1920,"height":1009,"format":"png","mimeType":"image/png","peer":"client-1","target":"auto","source":"host-window","cropped":false,"viewport
    image 1920x1009, 16565 unique colours
✅ TODO#1 capture_screenshot play-mode blank frame PASSED
```

## Son kapı (HEAD 00d4e02 + bu commit, 2026-09-15 12:50–13:20)

Birleşik ilk `test:studio:runner` koşusunda `runtime-bridge-lifecycle.mjs` düştü ("Timed out waiting for roles edit, server, client-1"); baseline 3847349 worktree'inde aynı test yeşil → #7 otomatik dedupe regresyonu (aynı `ExecutePlayModeAsync` kodu operation_id'siz ikinci kez gönderilince retained sonuç döndü, play başlamadı). Kural daraltıldı (commit 1ae2e0e): teslim edilmiş sonuç sonraki özdeş çağrıyı dedupe etmez; yalnız pending ya da bekleyeni kopmuş (`waiterEndedAt`) istekler dedupe edilir. Sonra `runtime-bridge-lifecycle.mjs` tek başına ✅.

| Komut | Sonuç |
|---|---|
| `npm run typecheck` / `npm test -w packages/core` | yeşil; 41 suite / 704 test |
| `npm run build:all` | tamam (canlı eklenti dosyası güncellendi) |
| `npm run test:todo` | jest todo-* 17/17; managed Studio 13/13 (157 s) |
| `npm run test:studio:runner` | 21/21 |
| `npm run test:studio:smoke` (önceki HEAD 073418a) | 3/3 |

```
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/00-saha-regresyon.mjs
  ✅ PASS  todo-2026-09-15/01-capture-play-blank.mjs
  ✅ PASS  todo-2026-09-15/02-playtest-restart.mjs
  ✅ PASS  todo-2026-09-15/03-import-service-root.mjs
  ✅ PASS  todo-2026-09-15/04-streaming-props.mjs
  ✅ PASS  todo-2026-09-15/05-execute-luau-truncation.mjs
  ✅ PASS  todo-2026-09-15/06-runtime-log-merge.mjs
  ✅ PASS  todo-2026-09-15/07-queue-dedupe.mjs
  ✅ PASS  todo-2026-09-15/08-tags.mjs
  ✅ PASS  todo-2026-09-15/09-minimized-window-capture.mjs
  ✅ PASS  todo-2026-09-15/10-capture-target-peer.mjs
  ✅ PASS  todo-2026-09-15/11-connected-instances-playtest.mjs
  ✅ PASS  todo-2026-09-15/13-export-report.mjs

13/13 passed.

========== TODO SUMMARY ==========
  ✅ PASS  jest packages/core todo-*  (4185 ms)
  ✅ PASS  managed Studio suite (13 test)  (156698 ms)

2/2 passed.
TODO EXIT 0
```
```
========== SUMMARY ==========
  ✅ PASS  path-resolution.mjs
  ✅ PASS  property-value-conversion.mjs
  ✅ PASS  luau-payload-transfers.mjs
  ✅ PASS  capture-broker-transfers.mjs
  ✅ PASS  large-input-workflow.mjs
  ✅ PASS  studio-tooling-smoke.mjs
  ✅ PASS  eval-bridge-error-preservation.mjs
  ✅ PASS  eval-context-routing.mjs
  ✅ PASS  runtime-bridge-lifecycle.mjs
  ✅ PASS  playtest-control-repro.mjs
  ✅ PASS  play-cycle-event-stream-regression.mjs
  ✅ PASS  micro-profiler-responsiveness.mjs
  ✅ PASS  studio-grep-responsiveness.mjs
  ✅ PASS  studio-plugin-connection-timeout-regression.mjs
  ✅ PASS  execute-luau-error-preservation.mjs
  ✅ PASS  proxy-mode-peer-fanout.mjs
  ✅ PASS  execute-luau-output-capture.mjs
  ✅ PASS  simulation-state-lifecycle.mjs
  ✅ PASS  multiplayer-add-player-end-regression.mjs
  ✅ PASS  multiplayer-test-lifecycle.mjs
  ✅ PASS  studio-websocket-transport.mjs

21/21 passed.
RUNNER EXIT 0
```

---
# Madde kanıtları (tests/todo-2026-09-15/kanit/*.md birebir)



<!-- 00-saha-regresyon.md -->

# 00 — Saha regresyon listesi (TODO.md "dokunulmaması gerekenler")

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/00-saha-regresyon.mjs` (2026-09-15, HEAD 55577fa + bu dosya; managed baseplate, kullanıcının 3 Studio'su açıkken)

Ham çıktı:
```
{"grepMs":16,"matches":50}
{"soloPlaytestStartMs":3107}
{"evalServerA":{"ok":true,"bridge":"ok","result":"1","output":[]},"evalServerB":{"ok":true,"bridge":"ok","result":"2","output":[]}}
{"evalClient":{"ok":true,"bridge":"ok","result":"hsangrento","output":[]}}
{"exported":{"bytes_written":7020,"instance_count":1,"output_path":"C:\Users\hasan\AppData\Local\Temp\todo0-sTltG5\saha.rbxm"}}
{"soloPlaytestStopMs":1415}
✅ saha regresyon listesi PASSED
```
Eşikler: grep_scripts < 5 s (ölçüm 16 ms, 50 script), solo_playtest start ≤ 15 s (3,1 s), stop 1,4 s, require önbelleği 1→2, export_rbxm play modunda edit DM'den 7 020 B.
Not (#13 için): export_rbxm zaten `bytes_written` ve `instance_count` döndürüyor; `instance_count` kök sayısı (1), alt nesne sayısı (56) değil.
Localhost HTTP (devserver köprüsü) kanıtı Ajan D'nin 07 testinde.


<!-- 01-capture-play-blank.md -->

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


<!-- 02-playtest-restart.md -->

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


<!-- 03-import-service-root.md -->

# TODO#3 — import_rbxm: servis/konteyner köklü rbxm

Test: `tests/todo-2026-09-15/03-import-service-root.mjs`
Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/03-import-service-root.mjs`

## Belirti / yeniden üretme (kırmızı, düzeltmesiz, 2026-09-15 11:18)

Senaryo: managed baseplate'te `StarterPlayer.StarterCharacterScripts` altına 2 LocalScript (`execute_luau`) → `export_rbxm instance_paths=["game.StarterPlayer.StarterCharacterScripts"]` → çocuklar silinir → `import_rbxm source.path=… parent_path="game.StarterPlayer.StarterCharacterScripts"`.

Ham hata (Roblox pcall mesajı aynen): `Cannot change Parent of type StarterCharacterScripts`. Not: TODO'da tahmin edilen "The Parent property of X is locked" metni değil; StarterCharacterScripts bir servis de değil (`game:GetService("StarterCharacterScripts")` hata verir), StarterPlayer'ın taşınamaz tekil çocuğu. Deserialize edilen kök, servis-benzeri bu sınıfın yeni bir örneği; Parent ataması reddediliyor.

```
##### RED 03-import-service-root 2026-09-15T11:18:52+03:00
Test process using port 61369 (automatically assigned)
Full integration suite using port 61369 (from ROBLOX_STUDIO_PORT)
Installing worktree plugin C:\Users\hasan\Desktop\mcp\wt\C\studio-plugin\MCPPlugin.rbxmx
Installed MCPPlugin.rbxmx to C:\Users\hasan\AppData\Local\Temp\robloxstudio-mcp-workers\run-all-H1VCks\RsmcpIsolatedPlugins\MCPPlugin.rbxmx
Launched managed Studio instance instance:6as-bop

=== TODO#3 import_rbxm with a service-rooted rbxm ===
  ✓ managed instance id is set
[2026-09-15T08:19:08.911Z] setup: {"returnValue":"2","message":"Code executed successfully","success":true,"output":[]}
  ✓ execute_luau created 2 LocalScripts under StarterCharacterScripts
[2026-09-15T08:19:08.943Z] export_rbxm(StarterCharacterScripts): {"bytes_written":1186,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo03-n9IwHo\\scs.rbxm"}
  ✓ service-rooted rbxm exported
  ✓ StarterCharacterScripts emptied before import
[2026-09-15T08:19:08.976Z] import_rbxm(parent_path=StarterCharacterScripts): {"body":{"error":"failed to parent StarterCharacterScripts (StarterCharacterScripts) under game.StarterPlayer.StarterCharacterScripts: Cannot change Parent of type StarterCharacterScripts"},"isError":true}

❌ TODO#3 import_rbxm with a service-rooted rbxm FAILED: import_rbxm rejected the service-rooted rbxm: failed to parent StarterCharacterScripts (StarterCharacterScripts) under game.StarterPlayer.StarterCharacterScripts: Cannot change Parent of type StarterCharacterScripts

--- todo-03-import-service-root stderr tail ---
responseMode: 'json' drops mid-call notifications. subscriptions/listen streams are always served over SSE regardless; other notifications emitted before a result are dropped.
Port 61369 in use, trying next...
Port 61369 in use - entering proxy mode (forwarding to localhost:61369)
robloxstudio-mcp v3.1.4 running on stdio
MCP server active in proxy mode - forwarding requests to primary
Waiting for Studio plugin to connect...
Closed managed Studio instance instance:6as-bop

========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/03-import-service-root.mjs

0/1 passed.
##### EXIT=1 2026-09-15T11:19:13+03:00
```

## Düzeltme

- `studio-plugin/src/modules/handlers/SerializationHandlers.ts` (importRbxm): kök nesne (a) gerçek bir servis sınıfıysa (`game:GetService(ClassName)` başarılı) ya da (b) Parent ataması "Cannot change Parent" / "locked" içeren mesajla reddedilirse kökün ÇOCUKLARI `parent_path`'e taşınır, boş kök kabuğu Destroy edilir; sonuçta `unwrappedServiceRoot: "<ClassName>"` (+ `unwrappedServiceRoots: [...]`). Diğer Parent hataları eskisi gibi ham pcall metniyle döner (`failed to parent X (Class) under P: <Roblox mesajı>`) ve tüm-ya-hiç geri alma korunur.
- `packages/core/src/tools/definitions.ts`: `import_rbxm` açıklaması (tek cümle, ≤120 karakter bütçesi).

## Yeşil (aynı komut, 2026-09-15 11:28)

- `import_rbxm` sonucu: `unwrappedServiceRoot: "StarterCharacterScripts"`, `instanceCount: 2`, `rootClasses: ["LocalScript","LocalScript"]`, yollar `game.StarterPlayer.StarterCharacterScripts.__RSMCP_ImportA/B`.
- `execute_luau` doğrulaması: `count=2`, sınıflar LocalScript, iç içe StarterCharacterScripts yok (`service=false`).
- Regresyon: ScreenGui köklü rbxm `parent_path="game.StarterGui"` → `instance_count: 1`, `unwrappedServiceRoot` yok, 2 alt nesne yerinde.

```
##### GREEN 03-import-service-root 2026-09-15T11:28:56+03:00
Test process using port 64420 (automatically assigned)
Full integration suite using port 64420 (from ROBLOX_STUDIO_PORT)
Installing worktree plugin C:\Users\hasan\Desktop\mcp\wt\C\studio-plugin\MCPPlugin.rbxmx
Installed MCPPlugin.rbxmx to C:\Users\hasan\AppData\Local\Temp\robloxstudio-mcp-workers\run-all-gjjP5c\RsmcpIsolatedPlugins\MCPPlugin.rbxmx
Launched managed Studio instance instance:a91-5s4

=== TODO#3 import_rbxm with a service-rooted rbxm ===
  ✓ managed instance id is set
[2026-09-15T08:29:12.448Z] setup: {"returnValue":"2","message":"Code executed successfully","success":true,"output":[]}
  ✓ execute_luau created 2 LocalScripts under StarterCharacterScripts
[2026-09-15T08:29:12.481Z] export_rbxm(StarterCharacterScripts): {"bytes_written":1187,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo03-g2Oyqs\\scs.rbxm","bytes":1187,"instanceCount":3,"rootClass":"StarterCharacterScripts","rootName":"StarterCharacterScripts","rootClasses":["StarterCharacterScripts"],"rootNames":["StarterCharacterScripts"]}
  ✓ service-rooted rbxm exported
  ✓ StarterCharacterScripts emptied before import
[2026-09-15T08:29:12.514Z] import_rbxm(parent_path=StarterCharacterScripts): {"body":{"source":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo03-g2Oyqs\\scs.rbxm","rootClasses":["LocalScript","LocalScript"],"instanceCount":2,"instance_names":["__RSMCP_ImportA","__RSMCP_ImportB"],"instance_paths":["game.StarterPlayer.StarterCharacterScripts.__RSMCP_ImportA","game.StarterPlayer.StarterCharacterScripts.__RSMCP_ImportB"],"unwrappedServiceRoots":["StarterCharacterScripts"],"instance_count":2,"rootNames":["__RSMCP_ImportA","__RSMCP_ImportB"],"unwrappedServiceRoot":"StarterCharacterScripts","parent_path":"game.StarterPlayer.StarterCharacterScripts"},"isError":false}
  ✓ result reports unwrappedServiceRoot: "StarterCharacterScripts"
  ✓ instanceCount equals 2
  ✓ rootClasses are LocalScript
[2026-09-15T08:29:12.530Z] verify: {"returnValue":"{\"classes\":[\"LocalScript\",\"LocalScript\"],\"service\":false,\"count\":2,\"names\":[\"__RSMCP_ImportA\",\"__RSMCP_ImportB\"]}","message":"Code executed successfully","success":true,"output":[]}
  ✓ StarterCharacterScripts has 2 children after import
  ✓ every child is a LocalScript
  ✓ child names match the exported scripts
  ✓ no nested StarterCharacterScripts instance was left behind
  ✓ regression: ScreenGui with 2 descendants created in StarterGui
[2026-09-15T08:29:12.580Z] export_rbxm(StarterGui child): {"bytes_written":5693,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo03-g2Oyqs\\gui.rbxm","bytes":5693,"instanceCount":3,"rootClass":"ScreenGui","rootName":"__RSMCP_ImportRegression","rootClasses":["ScreenGui"],"rootNames":["__RSMCP_ImportRegression"]}
[2026-09-15T08:29:12.614Z] import_rbxm(parent_path=StarterGui): {"instance_paths":["game.StarterGui.__RSMCP_ImportRegression"],"rootClasses":["ScreenGui"],"source":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo03-g2Oyqs\\gui.rbxm","instance_count":1,"rootNames":["__RSMCP_ImportRegression"],"parent_path":"game.StarterGui","instanceCount":3,"instance_names":["__RSMCP_ImportRegression"]}
  ✓ regression: non-service import still parents 1 root
  ✓ regression: no unwrappedServiceRoot for a ScreenGui root
  ✓ regression: ScreenGui round-trips into StarterGui with its 2 descendants

✅ TODO#3 import_rbxm with a service-rooted rbxm PASSED
Closed managed Studio instance instance:a91-5s4

========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/03-import-service-root.mjs

1/1 passed.
##### EXIT=0 2026-09-15T11:29:16+03:00
```

## Regresyon (2026-09-15, worktree `mcp/wt/C`, dal `todo/C`)

- `npm run typecheck`: yeşil (exit 0)
- `npm run lint`: 47 problem = 7 hata + 40 uyarı — hataların tamamı baştan var olan 7 (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2); yeni hata yok
- `npm test -w packages/core`: Test Suites 37/37, Tests 643/643 yeşil
- Eklenti derlemesi `npm run build:plugin:artifact`: 39 modül (PropertyAccess.ts eklendi; önce 38)


<!-- 04-streaming-props.md -->

# TODO#4 — set_properties / get_instance_properties: Workspace.StreamingMinRadius, StreamingTargetRadius

Test: `tests/todo-2026-09-15/04-streaming-props.mjs`
Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/04-streaming-props.mjs`

## Güvenlik düzeyi doğrulaması

- `get_roblox_docs`'un kaynağı olan `https://create.roblox.com/docs/reference/engine/classes/Workspace.md` (canlı MCP'ye dokunmamak için doğrudan indirildi, 72 260 B): `StreamingMinRadius` ve `StreamingTargetRadius` için `security.read = None`, `security.write = None` — yani sorun bir PluginSecurity/RobloxScriptSecurity meselesi DEĞİL.
- API dump (`MaximumADHD/Roblox-Client-Tracker` Full-API-Dump.json, 8 069 340 B): her iki özellik `Tags: ["NotScriptable"]` (ayrıca `StreamingIntegrityMode`, `ModelStreamingBehavior`, `PredictiveStreamingMode`, `MeshStreamingAndImprovedLods`, `StreamingPauseMode` de NotScriptable; `StreamingEnabled` write=PluginSecurity, eklentiden yazılabilir).
- Studio'da ham pcall (managed baseplate, eklenti bağlamı, `execute_luau`): okuma ve yazma aynı hatayı verir: `StreamingMinRadius is not a valid member of Workspace "Workspace"`. Eklentiden YAZILAMIYOR — TODO önermesi doğrulandı (test, yazılabilseydi kasıtlı olarak başarısız olurdu).

## Belirti / yeniden üretme (kırmızı, düzeltmesiz, 2026-09-15 11:19)

`set_properties instancePath="game.Workspace" properties={StreamingMinRadius:128, StreamingTargetRadius:2048}` → yalnız ham metin, açıklama ve sebep yok; `get_instance_properties` bu özellikleri hiç raporlamıyor.

```
##### RED 04-streaming-props 2026-09-15T11:19:13+03:00
Test process using port 54668 (automatically assigned)
Full integration suite using port 54668 (from ROBLOX_STUDIO_PORT)
Installing worktree plugin C:\Users\hasan\Desktop\mcp\wt\C\studio-plugin\MCPPlugin.rbxmx
Installed MCPPlugin.rbxmx to C:\Users\hasan\AppData\Local\Temp\robloxstudio-mcp-workers\run-all-81fmco\RsmcpIsolatedPlugins\MCPPlugin.rbxmx
Launched managed Studio instance instance:s0n-hk5

=== TODO#4 NotScriptable Workspace streaming properties ===
  ✓ managed instance id is set
[2026-09-15T08:19:28.625Z] raw plugin pcall (execute_luau): {"returnValue":"{\"StreamingTargetRadius_read\":\"StreamingTargetRadius is not a valid member of Workspace \\\"Workspace\\\"\",\"StreamingMinRadius_write\":\"StreamingMinRadius is not a valid member of Workspace \\\"Workspace\\\"\",\"StreamingTargetRadius_write\":\"StreamingTargetRadius is not a valid member of Workspace \\\"Workspace\\\"\",\"StreamingMinRadius_read\":\"StreamingMinRadius is not a valid member of Workspace \\\"Workspace\\\"\"}","message":"Code executed successfully","success":true,"output":[]}

❌ TODO#4 NotScriptable Workspace streaming properties FAILED: Tool set_properties returned isError: {"instancePath":"game.Workspace","summary":{"total":2,"failed":2,"succeeded":0},"success":false,"results":[{"property":"StreamingTargetRadius","success":false,"error":"StreamingTargetRadius is not a valid member of Workspace \"Workspace\""},{"property":"StreamingMinRadius","success":false,"error":"StreamingMinRadius is not a valid member of Workspace \"Workspace\""}]}

--- todo-04-streaming-props stderr tail ---
responseMode: 'json' drops mid-call notifications. subscriptions/listen streams are always served over SSE regardless; other notifications emitted before a result are dropped.
Port 54668 in use, trying next...
Port 54668 in use - entering proxy mode (forwarding to localhost:54668)
robloxstudio-mcp v3.1.4 running on stdio
MCP server active in proxy mode - forwarding requests to primary
Waiting for Studio plugin to connect...
Closed managed Studio instance instance:s0n-hk5

========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/04-streaming-props.mjs

0/1 passed.
##### EXIT=1 2026-09-15T11:19:32+03:00
```

## Düzeltme

- `studio-plugin/src/modules/PropertyAccess.ts` (yeni, bağımlılıksız): `NOT_SCRIPTABLE_PROPERTIES` tablosu (Workspace: 7 özellik, API dump'tan) + `listInaccessibleProperties(instance)` (IsA ile sınıf kapsamlı) + `classifyPropertyFailure(instance, prop, rawMessage)`: tabloda ⇒ `not_scriptable`; mesajda "lacking capability"/"cannot access"/"current identity" ⇒ `security`; "is not a valid member" ⇒ `not_a_member` ("erişilemez ya da yok"); diğerleri ham mesaj.
- `studio-plugin/src/modules/handlers/PropertyHandlers.ts`: başarısız yazımlarda `error` açıklayıcı metin (özellik adı + "cannot be … from a plugin (plugin security); set it from Studio's Properties panel. Roblox: <ham mesaj>") ve `reason` alanı.
- `studio-plugin/src/modules/handlers/QueryHandlers.ts` (getInstanceProperties dönüşü): `inaccessible: [...]` (boşsa alan yok).
- `packages/core/src/__tests__/studio-handler-failures.test.ts`: PropertyHandlers'ı Node VM'de çalıştıran mevcut harness yeni `../PropertyAccess` bağımlılığını ve Luau `string.lower/find` shim'ini alacak şekilde genişletildi (aksi halde "Unexpected dependency" ile kırılıyordu).
- `packages/core/src/tools/definitions.ts`: `set_properties` açıklaması.

## Yeşil (aynı komut, 2026-09-15 11:29)

- `set_properties`: 2/2 başarısız, her biri `reason: "not_scriptable"`, error = `Workspace.StreamingMinRadius is tagged NotScriptable: it cannot be read or written from a plugin (plugin security); set it from Studio's Properties panel. Roblox: StreamingMinRadius is not a valid member of Workspace "Workspace"`.
- Tablo dışı `__RSMCP_NoSuchProperty` ⇒ `reason: "not_a_member"`, ham mesaj korunur.
- `get_instance_properties game.Workspace` ⇒ `inaccessible: ["StreamingMinRadius","StreamingTargetRadius","StreamingIntegrityMode","ModelStreamingBehavior","PredictiveStreamingMode","MeshStreamingAndImprovedLods","StreamingPauseMode"]`; `game.Workspace.Terrain` ⇒ alan yok.

```
##### GREEN 04-streaming-props 2026-09-15T11:29:16+03:00
Test process using port 50684 (automatically assigned)
Full integration suite using port 50684 (from ROBLOX_STUDIO_PORT)
Installing worktree plugin C:\Users\hasan\Desktop\mcp\wt\C\studio-plugin\MCPPlugin.rbxmx
Installed MCPPlugin.rbxmx to C:\Users\hasan\AppData\Local\Temp\robloxstudio-mcp-workers\run-all-7vB754\RsmcpIsolatedPlugins\MCPPlugin.rbxmx
Launched managed Studio instance instance:8j5-bl9

=== TODO#4 NotScriptable Workspace streaming properties ===
  ✓ managed instance id is set
[2026-09-15T08:29:33.363Z] raw plugin pcall (execute_luau): {"returnValue":"{\"StreamingTargetRadius_read\":\"StreamingTargetRadius is not a valid member of Workspace \\\"Workspace\\\"\",\"StreamingMinRadius_write\":\"StreamingMinRadius is not a valid member of Workspace \\\"Workspace\\\"\",\"StreamingTargetRadius_write\":\"StreamingTargetRadius is not a valid member of Workspace \\\"Workspace\\\"\",\"StreamingMinRadius_read\":\"StreamingMinRadius is not a valid member of Workspace \\\"Workspace\\\"\"}","message":"Code executed successfully","success":true,"output":[]}
[2026-09-15T08:29:33.377Z] set_properties(Workspace streaming): {"instancePath":"game.Workspace","summary":{"total":2,"failed":2,"succeeded":0},"success":false,"results":[{"error":"Workspace.StreamingTargetRadius is tagged NotScriptable: it cannot be read or written from a plugin (plugin security); set it from Studio's Properties panel. Roblox: StreamingTargetRadius is not a valid member of Workspace \"Workspace\"","property":"StreamingTargetRadius","success":false,"reason":"not_scriptable"},{"error":"Workspace.StreamingMinRadius is tagged NotScriptable: it cannot be read or written from a plugin (plugin security); set it from Studio's Properties panel. Roblox: StreamingMinRadius is not a valid member of Workspace \"Workspace\"","property":"StreamingMinRadius","success":false,"reason":"not_scriptable"}]}
  ✓ set_properties reports both writes as failed
  ✓ StreamingMinRadius: result entry present and failed
  ✓ StreamingMinRadius: error names the property
  ✓ StreamingMinRadius: error tells the caller to use the Properties panel
  ✓ StreamingMinRadius: error explains the plugin cannot access it
  ✓ StreamingMinRadius: error contains Roblox's raw pcall message
  ✓ StreamingMinRadius: reason is not_scriptable
  ✓ StreamingTargetRadius: result entry present and failed
  ✓ StreamingTargetRadius: error names the property
  ✓ StreamingTargetRadius: error tells the caller to use the Properties panel
  ✓ StreamingTargetRadius: error explains the plugin cannot access it
  ✓ StreamingTargetRadius: error contains Roblox's raw pcall message
  ✓ StreamingTargetRadius: reason is not_scriptable
[2026-09-15T08:29:33.394Z] set_properties(unknown property): {"instancePath":"game.Workspace","summary":{"total":1,"failed":1,"succeeded":0},"success":false,"results":[{"error":"Workspace.__RSMCP_NoSuchProperty is inaccessible from a plugin or does not exist (NotScriptable properties and unknown names raise the same error; if it shows in the Properties panel, set it there). Roblox: __RSMCP_NoSuchProperty is not a valid member of Workspace \"Workspace\"","property":"__RSMCP_NoSuchProperty","success":false,"reason":"not_a_member"}]}
  ✓ property outside the table is classified from the pcall message (not_a_member)
  ✓ unknown property error keeps the raw Roblox message
[2026-09-15T08:29:33.411Z] get_instance_properties(Workspace): {"inaccessible":["StreamingMinRadius","StreamingTargetRadius","StreamingIntegrityMode","ModelStreamingBehavior","PredictiveStreamingMode","MeshStreamingAndImprovedLods","StreamingPauseMode"],"className":"Workspace"}
  ✓ get_instance_properties returns inaccessible: [...]
  ✓ inaccessible lists StreamingMinRadius
  ✓ inaccessible lists StreamingTargetRadius
  ✓ Terrain has no inaccessible list (table is class-scoped)

✅ TODO#4 NotScriptable Workspace streaming properties PASSED
Closed managed Studio instance instance:8j5-bl9

========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/04-streaming-props.mjs

1/1 passed.
##### EXIT=0 2026-09-15T11:29:59+03:00
```

## Regresyon (2026-09-15, worktree `mcp/wt/C`, dal `todo/C`)

- `npm run typecheck`: yeşil (exit 0)
- `npm run lint`: 47 problem = 7 hata + 40 uyarı — hataların tamamı baştan var olan 7 (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2); yeni hata yok
- `npm test -w packages/core`: Test Suites 37/37, Tests 643/643 yeşil
- Eklenti derlemesi `npm run build:plugin:artifact`: 39 modül (PropertyAccess.ts eklendi; önce 38)


<!-- 05-execute-luau-truncation.md -->

# TODO#5 — `execute_luau` büyük dönüşler: ölçüm, `truncated`/`totalBytes`/`returnedBytes`, `max_output_bytes`

Ajan D, dal `todo/D`, 2026-09-15. Studio kanıtı managed runner'ın açtığı ayrı baseplate'ten (`instance:gok-t2v` kırmızı, `instance:5h3-jkx` yeşil); kullanıcının Studio'larına dokunulmadı.

## Belirti / yeniden üretme

Komut (worktree'de):

```
npm run build:plugin:artifact && node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/05-execute-luau-truncation.mjs
```

### Ölçüm (düzeltme ÖNCESİ, HEAD 55577fa) — kesme hangi katmanda?

Aynı testin ölçüm bölümü, `execute_luau target=edit` ile `return string.rep("x", N)` ve `table.concat` (30 000):

| İstek | returnValue uzunluğu | bayt | MCP sonuç gövdesi (bayt) | `truncated` alanı |
|---|---|---|---|---|
| `string.rep("x", 30000)` | 30 000 | 30 000 | 30 084 | yok |
| `string.rep("x", 200000)` | 200 000 | 200 000 | 200 084 | yok |
| `string.rep("x", 2000000)` | 2 000 000 | 2 000 000 | 2 000 084 | yok |
| `table.concat` 30 000 × "y" | 30 000 | 30 000 | 30 084 | yok |

Sonuç: **eklenti (LuauExec) → WebSocket (64 MiB çerçeve) → birincil sunucu → proxy HTTP (50 MiB gövde) → stdio** zincirinin hiçbir katmanı 2 MB'a kadar kesmiyor; test istemcisi proxy modunda çalıştığı için HTTP proxy katmanı da ölçüme dahil. Sahada görülen "30 k+ karakterde sonu kırpık" davranışı bu depodaki katmanlardan gelmiyor; tek aday MCP istemcisinin (Claude Code) araç sonucu bütçesi (varsayılan `MAX_MCP_OUTPUT_TOKENS` = 25 000 token — aşınca sonucun tamamı hata metniyle değiştirilir ya da görüntüde kırpılır). Bu depo tarafında "kesildi" işareti olmadığı için ajan farkı göremiyordu. Düzeltme bu yüzden **sunucu tarafında açık bir bütçe + muhasebe** olarak yapıldı: eklenti tam sonucu üretir, sunucu `max_output_bytes` (varsayılan 65 536 = 64 KiB; ≈ 25 000 token bütçesinin altında kalacak şekilde seçildi, ~3 bayt/token varsayımıyla 75 kB sınırının altında) ile keser ve `totalBytes`'ı raporlar. Üst sınır `EXECUTE_LUAU_MAX_OUTPUT_BYTES = HTTP_BODY_LIMIT_BYTES` (52 428 800) — proxy HTTP gövde limitiyle aynı.

### Kırmızı ham çıktı (düzeltme öncesi)

```
=== TODO#5 execute_luau large return truncation contract ===
--- ölçüm: katman katman ham uzunluklar (düzeltme öncesi/sonrası aynı komut) ---
{"label":"string.rep 30000","timestamp":"2026-09-15T08:21:47.009Z","tool":"execute_luau","args":{"code":"return string.rep(\"x\", 30000)"},"isError":false,"success":true,"returnValueLength":30000,"returnValueBytes":30000,"responseBytes":30084}
{"label":"string.rep 200000","timestamp":"2026-09-15T08:21:47.046Z","tool":"execute_luau","args":{"code":"return string.rep(\"x\", 200000)"},"isError":false,"success":true,"returnValueLength":200000,"returnValueBytes":200000,"responseBytes":200084}
{"label":"string.rep 2000000","timestamp":"2026-09-15T08:21:47.119Z","tool":"execute_luau","args":{"code":"return string.rep(\"x\", 2000000)"},"isError":false,"success":true,"returnValueLength":2000000,"returnValueBytes":2000000,"responseBytes":2000084}
{"label":"table.concat 30000","timestamp":"2026-09-15T08:21:47.140Z","tool":"execute_luau","args":{"code":"local t = {} for i = 1, 30000 do t[i] = \"y\" end return table.concat(t)"},"isError":false,"success":true,"returnValueLength":30000,"returnValueBytes":30000,"responseBytes":30084}
--- sözleşme ---
❌ TODO#5 execute_luau large return truncation contract FAILED: küçük dönüşte truncated:false alanı olmalı
+ actual - expected
+ undefined
- false
Closed managed Studio instance instance:gok-t2v
========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/05-execute-luau-truncation.mjs
0/1 passed.
=== 05 exit=1
```

## Düzeltme

- `packages/core/src/http-body-limits.ts`: `EXECUTE_LUAU_DEFAULT_OUTPUT_BYTES` (65 536), `EXECUTE_LUAU_MAX_OUTPUT_BYTES` (= `HTTP_BODY_LIMIT_BYTES`), `resolveExecuteLuauOutputLimit` (doğrulama: pozitif tam sayı, üst sınır), `truncateUtf8` (çok baytlı karakteri bölmez), `applyExecuteLuauOutputLimit` (returnValue → `truncated`, `totalBytes`, `returnedBytes`, `maxOutputBytes`; `print` çıktısı aynı bütçeyle tam satır bazında → `outputTruncated`, `outputTotalBytes`, `outputReturnedBytes`).
- `packages/core/src/tools/index.ts` `executeLuau`: yeni `max_output_bytes` parametresi; eklenti yanıtı `_textResult`'a bu muhasebeyle sarılır (satır ~1968–1980).
- `packages/core/src/tools/definitions.ts` `execute_luau` şeması: `max_output_bytes` (integer, 1..52428800).
- `packages/core/src/http-server.ts` satır 217: `body.max_output_bytes` geçirilir (tek satır; dosya paylaşılan).
- Eklenti tarafı (LuauExec) değişmedi: ölçüm eklentinin kesmediğini gösterdi; tam sonucu sunucuya taşımak yerel ağda ucuz (2 MB → 73 ms) ve `totalBytes` için tam boyut gerekli.

## Yeşil

Aynı komut, düzeltme sonrası (managed `instance:5h3-jkx`, 2026-09-15 08:34 UTC):

```
=== TODO#5 execute_luau large return truncation contract ===
--- ölçüm: katman katman ham uzunluklar (düzeltme öncesi/sonrası aynı komut) ---
{"label":"string.rep 30000","timestamp":"2026-09-15T08:34:06.605Z","tool":"execute_luau","args":{"code":"return string.rep(\"x\", 30000)"},"isError":false,"success":true,"returnValueLength":30000,"returnValueBytes":30000,"truncated":false,"totalBytes":30000,"returnedBytes":30000,"maxOutputBytes":65536,"responseBytes":30298}
{"label":"string.rep 200000","timestamp":"2026-09-15T08:34:06.821Z","tool":"execute_luau","args":{"code":"return string.rep(\"x\", 200000)"},"isError":false,"success":true,"returnValueLength":65536,"returnValueBytes":65536,"truncated":true,"totalBytes":200000,"returnedBytes":65536,"maxOutputBytes":65536,"responseBytes":65835}
{"label":"string.rep 2000000","timestamp":"2026-09-15T08:34:07.128Z","tool":"execute_luau","args":{"code":"return string.rep(\"x\", 2000000)"},"isError":false,"success":true,"returnValueLength":65536,"returnValueBytes":65536,"truncated":true,"totalBytes":2000000,"returnedBytes":65536,"maxOutputBytes":65536,"responseBytes":65835}
{"label":"table.concat 30000","timestamp":"2026-09-15T08:34:07.226Z","tool":"execute_luau","args":{"code":"local t = {} for i = 1, 30000 do t[i] = \"y\" end return table.concat(t)"},"isError":false,"success":true,"returnValueLength":30000,"returnValueBytes":30000,"truncated":false,"totalBytes":30000,"returnedBytes":30000,"maxOutputBytes":65536,"responseBytes":30299}
--- sözleşme ---
{"label":"200 kB, max_output_bytes=1000","timestamp":"2026-09-15T08:34:07.291Z","tool":"execute_luau","args":{"code":"string.rep 200000","max_output_bytes":1000},"isError":false,"success":true,"returnValueLength":1000,"returnValueBytes":1000,"truncated":true,"totalBytes":200000,"returnedBytes":1000,"maxOutputBytes":1000,"responseBytes":1388}
{"label":"200 kB, max_output_bytes=300000","timestamp":"2026-09-15T08:34:07.326Z","tool":"execute_luau","args":{"code":"string.rep 200000","max_output_bytes":300000},"isError":false,"success":true,"returnValueLength":200000,"returnValueBytes":200000,"truncated":false,"totalBytes":200000,"returnedBytes":200000,"maxOutputBytes":300000,"responseBytes":200393}
{"label":"2 MB, max_output_bytes=2100000","timestamp":"2026-09-15T08:34:07.614Z","tool":"execute_luau","args":{"code":"string.rep 2000000","max_output_bytes":2100000},"isError":false,"success":true,"returnValueLength":2000000,"returnValueBytes":2000000,"truncated":false,"totalBytes":2000000,"returnedBytes":2000000,"maxOutputBytes":2100000,"responseBytes":2000395}
{"label":"max_output_bytes üst sınır","timestamp":"2026-09-15T08:34:07.666Z","tool":"execute_luau","args":{"code":"return 1","max_output_bytes":1000000000000},"isError":true,"responseBytes":108}
{"label":"print çıktısı 50×1000 B, max_output_bytes=5000","timestamp":"2026-09-15T08:34:07.766Z","tool":"execute_luau","args":{"code":"print loop","max_output_bytes":5000},"isError":false,"success":true,"returnValueLength":4,"returnValueBytes":4,"truncated":false,"totalBytes":4,"returnedBytes":4,"maxOutputBytes":5000,"responseBytes":4380}
--- regresyon: HttpService:GetAsync http://127.0.0.1 (edit bağlamı) ---
{"label":"HttpEnabled before","returnValue":"false"}
{"label":"HttpEnabled set attempt","returnValue":"false:The current thread cannot write 'HttpEnabled' (lacking capability LocalUser)"}
{"label":"HttpService:GetAsync 127.0.0.1","timestamp":"2026-09-15T08:34:08.178Z","tool":"execute_luau","args":{"code":"GetAsync http://127.0.0.1:59600/todo05"},"isError":false,"success":true,"returnValueLength":17,"returnValueBytes":17,"truncated":false,"totalBytes":17,"returnedBytes":17,"maxOutputBytes":65536,"responseBytes":309}
  ✓ execute_luau edit bağlamında localhost HTTP çalışıyor
✅ TODO#5 execute_luau large return truncation contract PASSED
Closed managed Studio instance instance:5h3-jkx
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/05-execute-luau-truncation.mjs
1/1 passed.
=== 05 exit=0
```

Özet: varsayılan limitte 200 kB → `returnedBytes 65536`, `truncated:true`, `totalBytes 200000`; `max_output_bytes: 300000` ile 200 kB tam; `max_output_bytes: 2100000` ile 2 MB tam; `10^12` → hata (`max_output_bytes must be at most 52428800`); `print` 50 × 1000 B, limit 5000 → `output` 4 satır, `outputTotalBytes 50049`.

### Regresyon: `execute_luau` edit bağlamında `HttpService:GetAsync("http://127.0.0.1:<port>/…")`

Test yerel bir Node HTTP sunucusu açar. Baseplate'te `HttpService.HttpEnabled` **false** ve eklentiden yazılamıyor (`The current thread cannot write 'HttpEnabled' (lacking capability LocalUser)`); buna rağmen eklenti bağlamından `GetAsync` **çalıştı**: `returnValue = "true|pong:/todo05"`. Yani devserver köprüsü (8765) `HttpEnabled` ayarından bağımsız; davranış korunuyor.

## Regresyon (birim/sabit)

- `npm run typecheck`: yeşil.
- `npm run lint`: 7 eski hata (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2), 40 uyarı — yeni hata yok.
- `npm test -w packages/core`: 37 suite / 657 test yeşil (başlangıç 643; +5 `http-body-limits.test.ts` "TODO#5 execute_luau output budget", geri kalanı #7).


<!-- 06-runtime-log-merge.md -->

# TODO #6 + #15 — `get_runtime_logs`: hata + kaynak satırı + stack birleştirme, dedupe, level/since_ts/exclude

Ajan E, dal `todo/E`. Ham çıktılar: `raw-06-jest-red.txt`, `raw-06-studio-red.txt`, `raw-06-studio-red2-clientbroker.txt`, `raw-06-studio-launch-timeout.txt`, `raw-06-studio-green.txt`, `raw-jest-green.txt`.

## Belirti / yeniden üretme

Testler:
- `packages/core/src/__tests__/todo-06-runtime-log-merge.test.ts` — `studio-plugin/src/modules/RuntimeLogBuffer.ts` esbuild + `vm` ile Node'da yüklenir (`@rbxts/services` external, `LogService.MessageOut` stub'ı); `MessageError` + `Stack Begin` + `Script '…', Line N` + `Stack End` sırası beslenir.
- `runtime-log-context.test.ts` "TODO #15" describe'ları — core `getRuntimeLogs`'un `level/sinceTs/exclude/dedupe`'u Peer isteğine aktardığı, hatalı değerleri Studio'ya gitmeden reddettiği, `ClientBroker`'ın `LogHandlers` üzerinden geçtiği.
- `tests/todo-2026-09-15/06-runtime-log-merge.mjs` (managed) — edit DM'de `StarterGui.TODO6Gui` altına iki kapalı LocalScript (`TODO6Once`: `error("TODO6 boom once")`; `TODO6Five`: 5× `task.spawn(function() error("TODO6 boom five") end)`), play'de `eval_client_runtime` ile `Enabled=true`.

Komutlar: `npm test -w packages/core -- todo-06 runtime-log-context`, `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/06-runtime-log-merge.mjs`

Jest kırmızı:

```
    src/__tests__/runtime-log-context.test.ts:288:7 - error TS2554: Expected 0-7 arguments, but got 8.
  ● TODO #6 runtime log merge › one runtime error becomes one entry with script, line, and stack
      Array [
        "before",
        "Players.Player1.PlayerGui.TODO6Gui.TODO6Once:5: TODO6 boom",
    +   "Stack Begin",
    +   "Script 'Players.Player1.PlayerGui.TODO6Gui.TODO6Once', Line 5",
    +   "Stack End",
Tests:       6 failed, 1 passed, 7 total
```

Studio kırmızı 1 (2026-09-15 11:28, `instance:bp2-96w`, düzeltmesiz eklenti) — bir hata iki kayıt:

```
  [raw filter=TODO6] [{"message":"Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once:1: TODO6 boom once","ts":1789460877.879,"level":"ERR","data":[]},{"message":"Script 'Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once', Line 1","ts":1789460877.879,"level":"INFO","data":[]}]
❌ ... FAILED: ASSERT FAIL: one error yields exactly one entry mentioning TODO6Once (got 2)
```

Studio kırmızı 2 (11:40, `instance:mzm-lcc`, birleştirme eklendikten sonra) — `level:"INFO"` istendiği hâlde ERR kaydı döndü; neden: client Peer istekleri `ClientBroker.handleGetRuntimeLogs` üzerinden geçiyor ve o yalnız `since/tail/filter` aktarıyordu:

```
  [level=INFO filter=TODO6] [{"message":"...TODO6Once:1: TODO6 boom once","level":"ERR","script":"Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once","line":1,"stack":["Script '...TODO6Once', Line 1"],...}]
❌ ... FAILED: ASSERT FAIL: no separate INFO "Script ..., Line N" entry remains (got 1)
```

(`raw-06-studio-launch-timeout.txt`: 11:41 koşusu managed Studio'nun edit bağlantısı `manage_instance` timeout'una takıldı — altyapı; kod değişmeden tekrar koşuldu.)

## Düzeltme

- `studio-plugin/src/modules/RuntimeLogBuffer.ts`: birleştirme **okuma anında** (`query` içinde `mergeStackFrames`): `ERR` kaydını hemen ardındaki `INFO "Stack Begin"` … `INFO "Stack End"` dizisiyle tek kayda çevirir; `stack[]` = aradaki satırlar, `script`/`line` = `^Script '(.-)', Line (%d+)` eşleşen ilk kare. Gerekçe: LogService hata + iz satırlarını aynı motor çağrısında ardışık üretir ve eklenti isteği bu emisyonla iç içe giremez; bu yüzden zamanlayıcı (250 ms bekleme) gecikme ekler ama doğruluk katmaz, okuma anı birleştirme ise deterministik ve tampon (`seq`/`since`) sözleşmesini değiştirmez. Kapanmamış ya da `ERR` ile başlamayan iz satırları olduğu gibi kalır. Sonra sırayla `level`, `sinceTs` (>1e11 ise ms kabul edilip /1000), `filter`, `exclude` (literal alt dize; eklentide regex yok), `dedupe` (anahtar `level|script|line|message` → ilk kayıt + `count`; tekrarlarda `firstTs/lastTs`), en son `tail`.
- `studio-plugin/src/modules/handlers/LogHandlers.ts`: yeni parametrelerin doğrulanması (`level must be one of ERR, WARN, INFO, OUT` vb.).
- `studio-plugin/src/modules/ClientBroker.ts`: `handleGetRuntimeLogs` → `LogHandlers.getRuntimeLogs(data ?? {})` (client Peer'da filtreler kaybolmasın).
- `packages/core/src/tools/index.ts`: `getRuntimeLogs(..., signal, options)` — `level` (ERR|WARN|INFO|OUT), `since_ts` (≥0), `exclude` (string), `dedupe` (boolean) doğrulanır ve her Peer isteğine `level/sinceTs/exclude/dedupe` olarak eklenir. `http-server.ts` handler'ı, `definitions.ts` şeması (`level` enum, `since_ts`, `exclude`, `dedupe`), `tool-schema.test.ts` özellik listesi.

Dedupe Peer başına yapılır; core birden çok Peer'ı birleştirirken tekrar dedupe etmez (edit+server+client'ta aynı mesaj ayrı kayıt kalır).

## Yeşil

Jest: `todo-06-runtime-log-merge.test.ts` 7/7, `runtime-log-context.test.ts` 7/7 (`raw-jest-green.txt`: 40 suite / 661 test).

Studio (aynı komut, `raw-06-studio-green.txt`):

Aynı komut, 2026-09-15 11:47, `instance:5o0-txf` (client-1 Peer hataları; 4. koşu — 2. koşu ClientBroker düzeltmesi, 3. koşu MCP şema enum hatası metni "allowed values" için assert gevşetildi, `raw-06-studio-red3-level-message.txt`):

```
Launched managed Studio instance instance:5o0-txf
  [raw filter=TODO6] [{"message":"Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once:1: TODO6 boom once","ts":1789462029.286,"script":"Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once","data":[],"level":"ERR","stack":["Script 'Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once', Line 1"],"line":1}]
  [level=INFO filter=TODO6] []
  [level=error] "Input validation error: Invalid arguments for tool get_runtime_logs: data/level must be equal to one of the allowed values"
  ✓ five identical errors are five merged entries without dedupe (got 5)
  [dedupe=true] [{"lastTs":1789462030.294,"ts":1789462030.294,"script":"Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five","data":[],"message":"Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five:3: TODO6 boom five","firstTs":1789462030.294,"count":5,"stack":["Script 'Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five', Line 3"],"level":"ERR","line":3}]
  [since_ts seconds] ["Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five:3: TODO6 boom five","Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five:3: TODO6 boom five","Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five:3: TODO6 boom five","Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five:3: TODO6 boom five","Players.hsangrento.PlayerGui.TODO6Gui.TODO6Five:3: TODO6 boom five"]
  ✓ since_ts (milliseconds) is accepted too (got 5)
  [exclude=five] ["Players.hsangrento.PlayerGui.TODO6Gui.TODO6Once:1: TODO6 boom once"]
✅ TODO #6/#15: runtime error merge, level/since_ts/exclude, dedupe PASSED
Failed to close managed Studio instance instance:5o0-txf: MCP HTTP tool manage_instance failed (HTTP 500): Cannot verify the managed Studio process because process observation failed: Malformed Roblox Studio process enumeration result.
1/1 passed.
```

Runner çıkış kodu 1: test 1/1 geçti; `manage_instance close` "Malformed Roblox Studio process enumeration result" (HTTP 500) verdi — eş zamanlı ajan Studio süreçleriyle çakışan süreç sayımı, kod dışı; instance ve worker dizini yine de kapandı.

## Regresyon

- `npm run typecheck` yeşil.
- `npm run lint`: 7 hata / 40 uyarı (başlangıçtaki 7 eski hata; yeni yok).
- `npm test -w packages/core`: 40 suite / 661 test yeşil (başlangıç 37 / 643).


<!-- 07-queue-dedupe.md -->

# TODO#7 — eş zamanlı çok ajan: `queued_ahead`/`waitedMs`, otomatik dedupe, timeout yönergesi

Ajan D, dal `todo/D`, 2026-09-15. Studio kanıtı managed baseplate'ten (`instance:4pi-p7x` kırmızı, `instance:y6m-758` yeşil); test istemcisi proxy modunda (run-all birincil sunucunun portuna sahip) — yani proxy → birincil → eklenti zinciri de doğrulandı.

## Belirti / yeniden üretme

```
node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/07-queue-dedupe.mjs
```

Kırmızı (HEAD 55577fa): `operation_id` verilmeden aynı `Instance.new("Folder")` kodu iki kez gönderildi, ikisi de çalıştı (sonuçta `operationId`/`deduplicatedFrom`/`queued_ahead` alanı yok):

```
=== TODO#7 queue metrics, automatic dedupe, timeout guidance ===
--- (b) aynı kod, operation_id yok → tek dispatch ---
{"label":"first","timestamp":"2026-09-15T08:22:08.006Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[]}}
{"label":"second","timestamp":"2026-09-15T08:22:08.006Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[]}}
❌ TODO#7 queue metrics, automatic dedupe, timeout guidance FAILED: sonuçta operationId olmalı
+ actual - expected
+ 'undefined'
- 'string'
Closed managed Studio instance instance:4pi-p7x
========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/07-queue-dedupe.mjs
0/1 passed.
=== 07 exit=1
```

## Tasarım ve gerekçe

**(b) Otomatik dedupe.** `operation_id` verilmezse sunucu kimliği `auto-<sha256(JSON{targetPeerId, endpoint, data})>` olarak türetir (`bridge-service.ts` `autoOperationId`, satır 411–418). Ölçütte `instance_id + target + code` yazıyordu; bunun yerine **çözülmüş peer kimliği** kullanıldı: peer kimliği instance+rol'ü zaten kodlar, ayrıca play modu yeniden başlayınca client peer değişir — instance+target hash'i aynı kalıp fingerprint değişseydi bridge `operation_id_collision` verirdi. Aynı peer + aynı endpoint + aynı `data` (kod) ⇒ aynı kimlik ⇒ bridge'in mevcut yeniden oynatma koruması devreye girer.

Karar tablosu (`tools/index.ts` `_resolveAutoOperation`, satır 2029–2050; her deneme `getRequestStatusEverywhere` ile — proxy modunda birincile HTTP):

| Önceki `auto-…` kaydı | Davranış | Sonuç alanı |
|---|---|---|
| yok (ya da 5 dk retention dolmuş) | kod çalışır | `dedupe:"auto"`, `operationId` |
| `pending` (queued/dispatched/executing) | aynı promise paylaşılır, **ikinci dispatch yok** | `deduplicatedFrom:<id>` |
| `settled`, sonuç retained | retained outcome döner, kod çalışmaz | `deduplicatedFrom:<id>` |
| `executionOutcome: not_executed` (kuyrukta timeout, hiç dispatch edilmedi) | güvenli: `auto-<hash>-2`, `-3`… (en fazla 16) ile çalışır | `dedupe:"auto"` |
| timed_out/aborted ama dispatch edilmiş (sonuç bilinmiyor) ya da sonuç evict edilmiş | **çalıştırılmaz**; `operation_not_replayed` hatası: "…call get_request_status with operation_id <id>; do not resend; pass dedupe:false or a new operation_id to run it again" | — |

Neden bilinmeyen sonuçta yeniden çalıştırılmıyor: sahadaki asıl zarar tam bu durumda oluştu (60 s timeout → ajan aynı kodu tekrar gönderdi → dekor iki kez yerleşti). Bilinmeyen sonuç "çalışmadı" demek değildir; ajan önce `get_request_status`'a bakmalı. Bilerek yeniden çalıştırmak isteyen kullanıcı için iki açık kapı: `dedupe:false` (rastgele UUID kimlik) ya da yeni `operation_id`. Otomatik dedupe yalnız `operation_id` verilmediğinde ve `dedupe` `false` değilken devrededir; sonuçta her zaman `dedupe:"auto"` işareti vardır, böylece "neden ikinci kez çalışmadı" görünür.

Eş zamanlı iki özdeş istek (aynı milisaniye) birincil modda ikinci istekte `getRequestStatus` senkron kontrolüyle `deduplicatedFrom` alır; proxy modunda iki farklı proxy aynı anda gönderirse bridge yine tek dispatch yapar ama ikinci sonuçta `deduplicatedFrom` işareti eksik kalabilir (yalnız işaret; çalıştırma sayısı korunur).

**(a) `queued_ahead` / `waitedMs`.** `bridge.sendRequest` kuyruğa alırken aynı transport peer'ına (aynı Studio bağlantısı; edit+server aynı transport) ait henüz settle olmamış istek sayısını `status.queuedAhead` olarak kaydeder (`countQueuedAhead`, satır 1196–1204). `waitedMs = (executionStartedAt ?? dispatchedAt ?? settledAt) − queuedAt` (eklentinin "executing" ilerleme olayı sunucuya ulaştığında). `execute_luau` ve `export_rbxm` sonuçları `operationId`, `queued_ahead`, `waitedMs` taşır; `get_request_status` çıktısında da `queuedAhead` görünür (proxy `parseRequestStatus` bir satır: `proxy-bridge-service.ts` satır 32).

**(c) Timeout metni.** `endRequestWaiter` mesajının sonuna `; call get_request_status with operation_id <id>; do not resend` eklendi (satır 1229); hata gövdesinde `requestId` zaten var.

## Düzeltme (dosyalar)

- `packages/core/src/bridge-service.ts`: `RequestStatus.queuedAhead` (186), `operationFingerprint`/`autoOperationId` (411–418), `countQueuedAhead` (1196–1204), sendRequest'te kayıt (1166, 1185), timeout metni (1229).
- `packages/core/src/tools/index.ts`: `executeLuau` yeni `dedupe` parametresi (1948–1970); `_dispatchOperation` (1973–2018), `_queueMetrics` (2020–2027), `_resolveAutoOperation` (2029–2050); `exportRbxm` aynı yoldan (4974–4981, metrics 5007).
- `packages/core/src/tools/definitions.ts`: `execute_luau` şeması `dedupe` (`"auto"` | `false`), `operation_id` açıklaması.
- `packages/core/src/http-server.ts` satır 217: `body.dedupe` geçirilir.
- `packages/core/src/proxy-bridge-service.ts` satır 32: `queuedAhead` parse (proxy modunda görünmesi için; tek satır).
- `managed-instance-registry.ts`'e dokunulmadı: dosya managed Studio başlatma kayıt defteri, istek kuyruğuyla ilgisi yok.
- Eklenti (`CooperativeJobRunner.ts`) değişmedi: dedupe/kuyruk sayımı sunucuda tek yerde tutulur; eklenti zaten aynı requestId'yi ikinci kez almaz (`terminalResponseIds`).

## Yeşil

Aynı komut (managed `instance:y6m-758`, 2026-09-15 08:34–08:35 UTC):

```
=== TODO#7 queue metrics, automatic dedupe, timeout guidance ===
--- (b) aynı kod, operation_id yok → tek dispatch ---
{"label":"first","timestamp":"2026-09-15T08:34:50.816Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"auto-93562545cc62086feaa8bb7ad28e99a117ed974cd613467a3e20072316d07717","queued_ahead":0,"waitedMs":6,"dedupe":"auto"}}
{"label":"second","timestamp":"2026-09-15T08:34:50.817Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"auto-93562545cc62086feaa8bb7ad28e99a117ed974cd613467a3e20072316d07717","queued_ahead":0,"waitedMs":6,"dedupe":"auto","deduplicatedFrom":"auto-93562545cc62086feaa8bb7ad28e99a117ed974cd613467a3e20072316d07717"}}
--- (b) dedupe:false → yeniden çalışır ---
{"label":"forced","timestamp":"2026-09-15T08:34:50.846Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"08e22bc5-ac90-46e9-af08-09c6cc937eb0","queued_ahead":0,"waitedMs":14}}
--- (b) yeni operation_id → yeniden çalışır ---
{"label":"explicit","timestamp":"2026-09-15T08:34:50.878Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"todo07-1789461290862","queued_ahead":0,"waitedMs":12}}
--- (a) 5 paralel execute_luau → queued_ahead 0..4, waitedMs ---
{"label":"parallel","timestamp":"2026-09-15T08:34:54.960Z","elapsedMs":4065,"queuedAhead":[0,1,2,3,4],"waited":[8,7,8,7,2039],"operationIds":["86632a77-747b-4e4d-a6b2-84c9106ca496","0e374fd6-d804-487b-b342-7a2e688962ce","ff9c9a7c-0221-45f4-9e9e-7ba0a637c295","587d40ac-e6d2-4310-ba24-c86985f56180","ef184dc6-21fe-4486-b70f-1f8da54ee89c"]}
--- (a) export_rbxm sonucunda queued_ahead + waitedMs ---
{"label":"export","timestamp":"2026-09-15T08:34:54.994Z","body":{"bytes_written":587,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\todo07-37132.rbxm","operationId":"df87e378-e860-47e0-a56e-69ff7932d398","queued_ahead":0,"waitedMs":11}}
--- (c) timeout hata metni: get_request_status yönergesi + operation_id ---
{"label":"timeout","timestamp":"2026-09-15T08:35:25.001Z","body":{"error":"request_timeout","message":"Request timeout: todo07-timeout-1789461294995; executing; unknown; waiter ended, execution is not cancelled or rolled back; call get_request_status with operation_id todo07-timeout-1789461294995; do not resend","requestId":"todo07-timeout-1789461294995","targetPeerId":"peer:2zq-8or","stage":"executing","outcome":"unknown","executionOutcome":"unknown","executionStartedAt":1789461295010}}
{"label":"status after timeout","timestamp":"2026-09-15T08:35:25.003Z","body":{"requestId":"todo07-timeout-1789461294995","targetPeerId":"peer:2zq-8or","queuedAt":1789461294997,"stage":"executing","state":"timed_out","outcome":"unknown","executionOutcome":"unknown","executionStartedAt":1789461295010,"queuedAhead":0,"dispatchedAt":1789461294997,"waiterEndedAt":1789461325000}}
✅ TODO#7 queue metrics, automatic dedupe, timeout guidance PASSED
Closed managed Studio instance instance:y6m-758
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/07-queue-dedupe.mjs
1/1 passed.
=== 07 exit=0
```

Sayılar: aynı kod ×2 → Workspace'te **1** Folder, ikinci sonuçta `deduplicatedFrom = auto-93562545…`; `dedupe:false` → **2**; yeni `operation_id` → **3**. 5 paralel `task.wait(2)` → `queued_ahead = [0,1,2,3,4]`, `waitedMs = [8,7,8,7,2039]` (4 outstanding sınırı: 5. istek ~2 s bekledi), toplam 4 065 ms. `export_rbxm` → `queued_ahead:0, waitedMs:11`. `task.wait(40)` → 30 s'de `request_timeout`, mesaj: `…; call get_request_status with operation_id todo07-timeout-…; do not resend`; ardından `get_request_status` → `state:timed_out, stage:executing, queuedAhead:0`.

## Regresyon

- Jest: `request-recovery-tools.test.ts` "TODO#7 automatic execute_luau dedupe without operation_id" (7 test: aynı kod ×2 → tek dispatch; farklı kod → iki dispatch, `queued_ahead` 0/1; `dedupe:false` ve yeni `operation_id` → yeniden dispatch; 5 dk sonra (fake timers) → yeniden dispatch; dispatch edilmiş timeout → `operation_not_replayed`; hiç dispatch edilmemiş timeout → `auto-…-2`; `max_output_bytes` muhasebesi), `bridge-service.test.ts` "TODO#7 queue position and timeout guidance" (2 test), `payload-timeout-diagnostics.test.ts` (timeout mesajı iddiası). Sahip olunan iki eski test `toEqual` → `toMatchObject` (yeni alanlar).
- `npm run typecheck`: yeşil. `npm run lint`: 7 eski hata, yeni yok. `npm test -w packages/core`: 37 suite / 657 test yeşil.


<!-- 08-tags.md -->

# TODO #8 — CollectionService tag araması (`search_tags` + `get_instance_properties.tags`)

Ajan E, dal `todo/E`. Ham çıktılar: `raw-08-studio-red.txt`, `raw-08-studio-green.txt`, `raw-08-jest-red.txt`, `raw-jest-green.txt`.

## Belirti / yeniden üretme

Test: `tests/todo-2026-09-15/08-tags.mjs` (managed). Edit DM'de `workspace.TODO8.TODO8Part` (tag `TODO8`), `TODO8DynPart` (tag `TODO8Dyn`), `ServerScriptService.TODO8Static` (`CS:GetTagged("TODO8")` literal) ve `TODO8Dynamic` (tag adı `script:GetAttribute("Tag")`'ten geliyor) kuruluyor.

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/08-tags.mjs`

Kırmızı (2026-09-15 11:28, instance `instance:p7b-le2`, düzeltmesiz eklenti):

```
  [grep_scripts TODO8Dyn] {"scriptsMatched":0,"scriptsSearched":2}
  ✓ symptom: grep_scripts cannot see the attribute-driven tag use
  [get_instance_properties] {"properties":["ChildCount","Parent","CFrame","Material","Size","BottomSurface","CanCollide","Position","Anchored","Rotation","Transparency","Name","ClassName","Color","BrickColor","Shape","TopSurface"]}
❌ TODO #8: tags on get_instance_properties and search_tags FAILED: ASSERT FAIL: get_instance_properties lists tags (got undefined)
```

Jest kırmızı (`todo-08-tags.test.ts`, `studio-script-search.test.ts` eklemeleri):

```
  ● TODO #8 search_tags › is a read-only catalog tool with tag, maxResults, and instance_id
    expect(received).toBeDefined()   Received: undefined
  ● TODO #8 search_tags › forwards tag and maxResults to /api/search-tags ...  TypeError: http_server_js_1.TOOL_HANDLERS.search_tags is not a function
  ● TODO #8 tag literal search helpers › tagLiteralPattern ...  TypeError: module.tagLiteralPattern is not a function
```

## Düzeltme

- `studio-plugin/src/modules/handlers/QueryHandlers.ts`: `getInstanceProperties` dönüşüne `tags` (pcall `CollectionService:GetTags`; `game.GetService` ile, çünkü `studio-grep-responsiveness.test.ts` bu dosyayı esbuild'le Node'da yüklüyor ve `@rbxts/services` import'u `.lua` yükleyici hatası veriyor).
- `studio-plugin/src/modules/ScriptSearch.ts`: `tagLiteralPattern(tag)` (Lua magic karakterleri kaçırılmış `["']<tag>["']` deseni) ve `classifyTagUsage(line)` (`GetTagged|HasTag|AddTag|RemoveTag|GetInstanceAddedSignal|GetInstanceRemovedSignal|literal`).
- `studio-plugin/src/modules/handlers/TagHandlers.ts` (yeni): `/api/search-tags`. `tag` verilince `CollectionService:GetTagged` yolları (`maxResults`, varsayılan 100, en çok 1000; `instanceCount`, `truncated`) + `QueryHandlers.grepScripts` üzerinden `usePattern` statik arama (`scripts[]: instancePath, className, line, text, api`; `scriptsSearched`, `scriptsTruncated`) + hiç literal yoksa `dynamicHint`. `tag` verilmezse `GetAllTags` + sayım (`tags[]`, `totalTags`; `GetAllTags` yoksa `GetDescendants` taraması).
- `studio-plugin/src/modules/Communication.ts`: import + `"/api/search-tags"` satırı.
- `packages/core/src/tools/definitions.ts`: `search_tags` (category `read`; `tag`, `maxResults`, `instance_id`). `packages/core/src/http-server.ts`: `TOOL_PROXY_ENDPOINTS.search_tags`, `TOOL_HANDLERS.search_tags`. `packages/core/src/tools/index.ts`: `searchTags()` (doğrulama + `/api/search-tags`, grep zaman aşımı).
- Paylaşılan testler: `tool-schema.test.ts` `methodNameOf.search_tags`; `mcp-runtime.test.ts` katalog sayıları 48→49, outputSchema 47→48, inspector 25→26 ve bütçe 44 000→45 000 / 20 000→21 000 (yeni araç eklenmeden önce boş pay katalogda ~600, inspector'da ~20 karakterdi; `docs/token-efficiency.md` güncellendi). README: araç satırı + inspector sayısı 24→25.

## Yeşil

Aynı komut, 2026-09-15 11:38, instance `instance:ugh-0m6`:

```
  [get_instance_properties] {"tags":["TODO8"],"properties":[...]}
  ✓ get_instance_properties lists tags (got ["TODO8"])
  [search_tags TODO8] {"instances":["game.Workspace.TODO8.TODO8Part"],"truncated":false,"scripts":[{"line":2,"instancePath":"game.ServerScriptService.TODO8Static","className":"Script","text":"for _, inst in ipairs(CS:GetTagged(\"TODO8\")) do","api":"GetTagged"}],"scriptsSearched":2,"scriptsTruncated":false,"instanceCount":1,"tag":"TODO8"}
  [search_tags TODO8Dyn] {"dynamicHint":"No script contains this tag as a string literal. The tag name may come from a Config or data table, an attribute, or a StringValue; search those sources or the code that calls GetTagged with a variable.","instances":["game.Workspace.TODO8.TODO8DynPart"],"truncated":false,"scripts":[],"scriptsSearched":2,"scriptsTruncated":false,"instanceCount":1,"tag":"TODO8Dyn"}
  [search_tags (all)] {"totalTags":6,"tags":[{"count":1,"tag":"TODO8"},{"count":1,"tag":"TODO8Dyn"},{"count":0,"tag":"TagEditorTagContainer"},{"count":1,"tag":"data-testid=--studio-foundation--stylesheet-wrapper"},{"count":1,"tag":"gui-object-defaults"},{"count":1,"tag":"size-full"}]}
  [search_tags missing] {"dynamicHint":"...","instances":[],"truncated":false,"scripts":[],"scriptsSearched":2,"scriptsTruncated":false,"instanceCount":0,"tag":"TODO8Missing"}
✅ TODO #8: tags on get_instance_properties and search_tags PASSED
EXIT=0
```

Not: `GetAllTags` Studio'nun kendi CoreGui tag'lerini de listeliyor (`gui-object-defaults` vb.); sayım `GetTagged` ile yapıldığı için CoreGui nesneleri de sayılıyor. Filtrelenmedi (bilgi değeri var, CoreGui erişimi eklentide sorunsuz).

Jest yeşil: `todo-08-tags.test.ts` 4/4, `studio-script-search.test.ts` +3 test.

## Regresyon

- `npm run typecheck` yeşil.
- `npm run lint`: 7 hata / 40 uyarı (başlangıçtaki 7 eski hata; yeni yok).
- `npm test -w packages/core`: 40 suite / 660 test yeşil (başlangıç 37 / 643).


<!-- 09-minimized-window-capture.md -->

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


<!-- 10-capture-target-peer.md -->

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


<!-- 11-connected-instances-playtest.md -->

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


<!-- 12-16-tool-guides.md -->

# TODO #12 + #16 — `robloxstudio://tool-guides`: sunucu tarafı ışınlama notu + eş zamanlı ajan protokolü

Ajan E, dal `todo/E`. Ham çıktılar: `raw-16-jest-red.txt`, `raw-16-jest-green.txt`, `raw-jest-green.txt`.

## Belirti / yeniden üretme

Test: `packages/core/src/__tests__/todo-16-tool-guides.test.ts` — `registerResourceHandlers` ile InMemory MCP çifti kurar (`mcp-compat.test.ts` kalıbı), `resources/list` içinde `robloxstudio://tool-guides` olduğunu, `resources/read` metninde `## Server-side teleportation` (HumanoidRootPart.CFrame, Humanoid:MoveTo) ve `## Concurrent agent protocol` başlıklarını ve altı kuralın anahtar sözcüklerini (`one playtest lock`, `disjoint DataModel subtree`, `operation_id`, `solo_playtest action=restart`, `max_output_bytes`, `target=edit`) arar; `—` karakteri yasak (mevcut sözleşme).

Komut: `npm test -w packages/core -- todo-16`

Kırmızı (mcp-compat.ts düzeltmesiz):

```
  ● TODO #12/#16 tool guide sections › lists the tool guide resource and serves both new sections
    Expected substring: "## Server-side teleportation"
    Received string:    "# Roblox Studio MCP tool guide·
Tests:       1 failed, 1 total
```

## Düzeltme

`packages/core/src/mcp-compat.ts` (`TOOL_GUIDE_MARKDOWN`):
- "Playtests and runtime Luau" bölümüne `get_runtime_logs` birleştirme/filtre cümlesi (script, line, stack; level, since_ts, exclude, dedupe).
- Yeni `## Server-side teleportation`: hızlı `HumanoidRootPart.CFrame` yazımlarının oyunun anti-cheat'ine takılabileceği; oyunun hız sınırının tavan sayılması; `Humanoid:MoveTo` döngüsü, oyunun kendi teleport/checkpoint API'si ya da tek CFrame yazımı + kısa bekleme + konum doğrulama.
- Yeni `## Concurrent agent protocol`: 6 kural — tek playtest kilidi (orkestratör), ajan başına disjoint DataModel alt ağacı, her `execute_luau`/`set_properties` için `operation_id` + timeout'ta `get_request_status`, edit DM'e yazınca `solo_playtest action=restart` (Ajan B), büyük çıktıları parçala / `max_output_bytes` (Ajan D) / log cursor'ları, referans instance salt-okunur (`target=edit`).

Kaynak İngilizce; mevcut testler (`mcp-compat.test.ts`, `tool-schema.test.ts`) aynı metni okuduğu için orada da geçti.

## Yeşil

```
Tests:       1 passed, 1 total
```

## Regresyon

- `npm run typecheck` yeşil; `npm run lint` 7 eski hata / 40 uyarı; `npm test -w packages/core` 40 suite / 660 test yeşil.


<!-- 13-export-report.md -->

# TODO#13 + TODO#14 — export_rbxm / import_rbxm boyut ve sayı raporu

Test: `tests/todo-2026-09-15/13-export-report.mjs` (iki madde birleşik)
Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/13-export-report.mjs`

## Belirti / yeniden üretme (kırmızı, düzeltmesiz, 2026-09-15 11:19)

1 Folder + 5 Part (6 nesne) `export_rbxm` → yalnız `{"bytes_written":3292,"instance_count":1,"output_path":…}` (instance_count = kök sayısı; alt nesne sayısı, kök sınıfı/adı yok). `import_rbxm` de yalnız kök adları/yolları döndürüyordu.

```
##### RED 13-export-report 2026-09-15T11:19:32+03:00
Test process using port 53919 (automatically assigned)
Full integration suite using port 53919 (from ROBLOX_STUDIO_PORT)
Installing worktree plugin C:\Users\hasan\Desktop\mcp\wt\C\studio-plugin\MCPPlugin.rbxmx
Installed MCPPlugin.rbxmx to C:\Users\hasan\AppData\Local\Temp\robloxstudio-mcp-workers\run-all-iRuY11\RsmcpIsolatedPlugins\MCPPlugin.rbxmx
Launched managed Studio instance instance:v2a-x7f

=== TODO#13/#14 export_rbxm and import_rbxm size/count reports ===
  ✓ managed instance id is set
[2026-09-15T08:19:47.826Z] setup: {"returnValue":"6","message":"Code executed successfully","success":true,"output":[]}
  ✓ tree has 6 instances including the root
[2026-09-15T08:19:47.858Z] export_rbxm: {"bytes_written":3292,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo13-k5lTrR\\tree.rbxm"}

❌ TODO#13/#14 export_rbxm and import_rbxm size/count reports FAILED: ASSERT FAIL: bytes (undefined) equals the file size on disk (3292)

--- todo-13-export-report stderr tail ---
responseMode: 'json' drops mid-call notifications. subscriptions/listen streams are always served over SSE regardless; other notifications emitted before a result are dropped.
Port 53919 in use, trying next...
Port 53919 in use - entering proxy mode (forwarding to localhost:53919)
robloxstudio-mcp v3.1.4 running on stdio
MCP server active in proxy mode - forwarding requests to primary
Waiting for Studio plugin to connect...
Closed managed Studio instance instance:v2a-x7f

========== SUMMARY ==========
  ❌ FAIL  todo-2026-09-15/13-export-report.mjs

0/1 passed.
##### EXIT=1 2026-09-15T11:19:51+03:00
```

## Düzeltme

- `studio-plugin/src/modules/handlers/SerializationHandlers.ts`: exportRbxm sonucu `bytes` (`buffer.len`), `instanceCount` (Σ GetDescendants+1), `rootClass`/`rootName` (ilk kök), `rootClasses`/`rootNames`; importRbxm sonucu `instanceCount`, `rootNames`, `rootClasses`. Mevcut `bytes_written`, `instance_count`, `instance_names`, `instance_paths` aynen korunur.
- `packages/core/src/tools/index.ts` (exportRbxm): eklenti alanları JSON sonuca geçirilir; `bytes` diske yazılan uzunluk.
- `export_rbxm` şema açıklaması DEĞİŞTİRİLMEDİ: `mcp-runtime.test.ts` inspector katalog bütçesi 20 000 karakter, mevcut 19 986 — 15 karakterlik ek bile kırmızıya düşürüyor (denendi: 20 001). Sonuç alanları kendini açıklıyor.
- Not: aynı çağrıda iç içe iki kök (Folder + Folder.P1) verilirse `instanceCount` P1'i iki kez sayar (7); `bytes` 3292 (SerializeInstancesAsync tekilleştiriyor). Sayım kök listesine göre, dosya içeriğine göre değil.

## Yeşil (aynı komut, 2026-09-15 11:30)

- export: `bytes: 3292` = disk boyutu, `instanceCount: 6`, `rootClass: "Folder"`, `rootName: "__RSMCP_ExportReport"`; 2 kök: `rootClasses: ["Folder","Part"]`, `rootNames: ["__RSMCP_ExportReport","P1"]`.
- import (ReplicatedStorage'a): `instanceCount: 6`, `rootNames: ["__RSMCP_ExportReport"]`, `rootClasses: ["Folder"]`; `execute_luau` sayımı 6.

```
##### GREEN 13-export-report 2026-09-15T11:30:00+03:00
Test process using port 56621 (automatically assigned)
Full integration suite using port 56621 (from ROBLOX_STUDIO_PORT)
Installing worktree plugin C:\Users\hasan\Desktop\mcp\wt\C\studio-plugin\MCPPlugin.rbxmx
Installed MCPPlugin.rbxmx to C:\Users\hasan\AppData\Local\Temp\robloxstudio-mcp-workers\run-all-wDnBRg\RsmcpIsolatedPlugins\MCPPlugin.rbxmx
Launched managed Studio instance instance:065-22c

=== TODO#13/#14 export_rbxm and import_rbxm size/count reports ===
  ✓ managed instance id is set
[2026-09-15T08:30:59.535Z] setup: {"returnValue":"6","message":"Code executed successfully","success":true,"output":[]}
  ✓ tree has 6 instances including the root
[2026-09-15T08:30:59.566Z] export_rbxm: {"bytes_written":3292,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo13-081rca\\tree.rbxm","bytes":3292,"instanceCount":6,"rootClass":"Folder","rootName":"__RSMCP_ExportReport","rootClasses":["Folder"],"rootNames":["__RSMCP_ExportReport"]}
  ✓ bytes (3292) equals the file size on disk (3292)
  ✓ instanceCount is 6 (root + descendants)
  ✓ rootClass is Folder
  ✓ rootName is __RSMCP_ExportReport
  ✓ existing bytes_written/instance_count fields are unchanged
[2026-09-15T08:30:59.600Z] export_rbxm(2 roots): {"bytes_written":3292,"instance_count":2,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo13-081rca\\multi.rbxm","bytes":3292,"instanceCount":7,"rootClass":"Folder","rootName":"__RSMCP_ExportReport","rootClasses":["Folder","Part"],"rootNames":["__RSMCP_ExportReport","P1"]}
  ✓ two roots: instanceCount counts every root subtree
  ✓ rootClasses lists every root class in order
  ✓ rootNames lists every root name in order
[2026-09-15T08:30:59.616Z] import_rbxm: {"instance_paths":["game.ReplicatedStorage.__RSMCP_ExportReport"],"rootClasses":["Folder"],"source":"C:\\Users\\hasan\\AppData\\Local\\Temp\\rsmcp-todo13-081rca\\tree.rbxm","instance_count":1,"rootNames":["__RSMCP_ExportReport"],"parent_path":"game.ReplicatedStorage","instanceCount":6,"instance_names":["__RSMCP_ExportReport"]}
  ✓ import instanceCount is 6
  ✓ import rootNames lists the Folder
  ✓ import rootClasses lists Folder
  ✓ existing import fields are unchanged
  ✓ imported tree has the reported instance count in the DataModel

✅ TODO#13/#14 export_rbxm and import_rbxm size/count reports PASSED
Closed managed Studio instance instance:065-22c

========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/13-export-report.mjs

1/1 passed.
##### EXIT=0 2026-09-15T11:31:03+03:00
```

## Regresyon (2026-09-15, worktree `mcp/wt/C`, dal `todo/C`)

- `npm run typecheck`: yeşil (exit 0)
- `npm run lint`: 47 problem = 7 hata + 40 uyarı — hataların tamamı baştan var olan 7 (install-plugin-helpers.ts:254–257, opencloud-client.ts:445, install-plugin.ts `_chunk` ×2); yeni hata yok
- `npm test -w packages/core`: Test Suites 37/37, Tests 643/643 yeşil
- Eklenti derlemesi `npm run build:plugin:artifact`: 39 modül (PropertyAccess.ts eklendi; önce 38)
