# TODO — robloxstudio-mcp sahada bulunan sorunlar (2026-09-15, Salyangoz Kaçışı oturumu)

Kaynak: `C:\Users\hasan\Desktop\roblox-game` projesinde 15 Eylül'de 3 Studio instance'ı
(`instance:f4w-te1` salyangoz, `instance:v5b-wun` keyboard_escape referans, `instance:kqq-3vh`)
ve eş zamanlı 5–11 ajanla ~14 saatlik kullanım. Her madde: belirti → yeniden üretme → beklenen →
aday dosya → öncelik (P1 iş akışını kırıyor, P2 zaman kaybettiriyor, P3 iyileştirme).

Dosya adları bu depodaki ağaca göre: `packages/core/src/*.ts` (sunucu), `studio-plugin/src/modules/*.ts` (eklenti).

---

## P1 — iş akışını kıran

### 1. `capture_screenshot` play modunda (ve bazen edit'te) boş kare döndürüyor
- **Belirti:** `"Studio's CaptureService returned a blank (single-colour) frame and host window capture also failed (no viewport markers were visible in the Studio window capture)"`. Görüntü 1608×661 tamamen siyah. Aynı oturumda edit modunda kamera `Scriptable` + `CFrame` ile birkaç kez düzgün görüntü alındı; play modunda (client-1 peer varken) 4/4 deneme boş.
- **Yeniden üretme:** `solo_playtest start play` → karakter doğdu, `eval_client_runtime` ile `workspace.CurrentCamera.CFrame` normal, `PlayerGui` dolu → `capture_screenshot` (jpeg 60/70 ve png) → boş. Studio penceresi maksimize ve önde (`ShowWindow(h,3)` + `SetForegroundWindow`, `IsIconic=false`). Aynı anda PowerShell `Graphics.CopyFromScreen` ile pencere yakalandığında viewport tamamen görünür durumdaydı (bkz. `tools/cap.ps1` çözümü aşağıda).
- **Beklenen:** play modunda client peer'ın viewport'u döner; olmuyorsa neden (CaptureService hangi peer'da çağrıldı, marker'lar neden görünmedi: DPI ölçeği? "HD 720 1280×720" cihaz emülasyonu açıkken viewport ölçeklenip ortalanıyor — marker'lar emüle çerçevenin köşesinde mi, pane'in köşesinde mi?) hata mesajında yazar.
- **Aday dosyalar:** `packages/core/src/host-capture.ts` (marker arama: `no viewport markers…` satır ~108; `isBlank` eşiği satır ~66), `studio-plugin/src/modules/CaptureTransfer.ts`, `RenderMonitor.ts` (marker'ları çizen kısım — play modunda hangi DataModel'e/ScreenGui'ye çiziliyor? `CoreGui` mi `PlayerGui` mi; client peer'da `game:GetService("CoreGui")` erişimi var mı).
- **Şüphe:** Cihaz emülasyonu ("HD 720") açıkken pencere yakalamasındaki viewport 1608×661 rapor edilen boyuta göre ölçekli (gerçek pane 1326×662 ya da 1608×662, pane genişliği panel düzenine göre değişiyor). `host-capture.ts:128–134` aspect kontrolü (`does not match the reported viewport aspect`) marker bulsa da eleyebilir; log'da hangi dalın düştüğü belli değil.
- **Geçici çözüm (sahada):** `roblox-game/tools/cap.ps1` — GDI `CopyFromScreen` + sabit kırpma (edit: 293,195,1326×662; play: 12,195,1608×662). Kırpma dikdörtgeni pane düzenine bağlı; araç viewport rect'ini döndürse buna gerek kalmazdı.
- **İstek:** (a) hata mesajına marker sayısı/konumu ve emülasyon durumu; (b) `capture_screenshot` sonucuna `viewportRect` (ekran koordinatı) alanı; (c) marker bulunamazsa pencere yakalamasını **kırpmadan** döndüren `fallback: "window"` seçeneği.

### 2. Play modundaki edit DataModel değişiklikleri çalışan oturuma yansımıyor → her düzeltme için stop/sync/start ✅ (commit 247c1a5, test tests/todo-2026-09-15/02-playtest-restart.mjs + studio-playtest-control.test.ts; kanıt kanit/02-playtest-restart.md)
- **Belirti:** Kod düzeltmesi (`execute_luau` ile `Source` yazımı) ya da `Destroy` edit DM'de yapılınca çalışan play oturumu eski kalıyor (Roblox davranışı, doğru) ama araç seti bu döngüyü 3 çağrıya bölüyor: `solo_playtest stop` → `execute_luau` sync → `solo_playtest start` (start 5–10 s). Bu oturumda 6 kez.
- **İstek:** `solo_playtest action="restart"` (stop + bekle + start; `mode` korunur) ve isteğe bağlı `before_start` Luau (edit peer'da çalışır) parametresi. `StopPlayMonitor.ts` zaten stop'u izliyor.
- **Öncelik gerekçesi:** eş zamanlı ajan protokolünde playtest tek kilitli kaynak; her restart 20–30 s kuyruk.

### 3. `import_rbxm` `StarterPlayer.StarterCharacterScripts` altına parent alamadı
- **Belirti:** `ke-ui-StarterCharacterScripts.rbxm` (2 LocalScript, 1 706 B) `parent_path="StarterPlayer.StarterCharacterScripts"` ile import edilemedi (ajan raporu: "rbxm parent alamadı"); aynı dosya `StarterGui`/`ReplicatedStorage` hedefli diğer 4 import sorunsuz. Scriptler elle `Instance.new("LocalScript")` + `Source` ile yaratıldı.
- **Yeniden üretme:** `export_rbxm instance_paths=["StarterPlayer.StarterCharacterScripts"]` → sonra `import_rbxm path=… parent_path="StarterPlayer.StarterCharacterScripts"` (hedef Studio farklı instance).
- **Şüphe:** Kök nesne `StarterCharacterScripts` servisinin kendisi olarak serileşmiş (servis kökü import edilmeye çalışılınca "Parent locked"); import'ta kök bir servis ise **çocuklarını** parent'a taşımak gerekir. `studio-plugin/src/modules/handlers/SerializationHandlers.ts`.
- **İstek:** servis köklü rbxm'de çocukları aç; hata mesajına Roblox'un döndürdüğü metni ("The Parent property of X is locked…") ekle.

### 4. `set_properties` `Workspace.StreamingMinRadius` / `StreamingTargetRadius` yazamıyor
- **Belirti:** `"StreamingMinRadius is not a valid member of Workspace"` (önceki oturum, ROADMAP S-15). Eklenti bağlamında bu özellikler `Workspace` üzerinde okunamıyor da (`get_instance_properties` boş). Kullanıcı Properties panelinden elle ayarlamak zorunda.
- **Şüphe:** Bu özellikler plugin security'de `RobloxScriptSecurity`/`PluginSecurity` altında; `pcall` ile denenip düzgün mesaj ("bu özellik eklentiden yazılamaz, Properties panelinden ayarla") verilmeli.
- **Aday:** `studio-plugin/src/modules/handlers/PropertyHandlers.ts` — bilinen "eklentiden erişilemez" özellik listesi + açıklayıcı hata.

---

## P2 — zaman kaybettiren

### 5. `execute_luau` büyük dönüşleri sessizce kesiyor
- **Belirti:** 30 k+ karakterlik `return table.concat(...)` sonuçları sonu kırpılmış geliyor; kırpıldığına dair işaret yok ("truncated": true gibi). Envanter dökümlerinde ajanlar 3–4 parçaya bölmek zorunda kaldı.
- **İstek:** sonuçta `truncated: true` + `totalBytes`; `execute_luau` için `max_output_bytes` parametresi ya da büyük çıktıyı dosyaya yazıp yol döndüren `output_path`.
- **Aday:** `packages/core/src/http-body-limits.ts`, `studio-plugin/src/modules/LuauExec.ts`.

### 6. `get_runtime_logs`: hata metni ile "Script '…', Line N" kaynak satırı ayrı kayıtlar
- **Belirti:** Bir hata 2–3 ayrı `entries` satırı: `ERR` mesaj, `INFO "Script 'Players.x.PlayerGui…', Line 5"`, `INFO "Stack Begin/End"`. `filter="Script '"` ile hata metni gelmiyor; `filter=":"` ile hepsi ama asset-izin spam'i (aşağıda) araya giriyor.
- **İstek:** `MessageOutput` + `MessageError` + stack satırlarını tek kayıtta birleştir (`stack: [...]`), ya da en azından `level="ERR"` filtresi (`level` parametresi yok).
- **Ek:** aynı asset için "User is not authorized to access Asset" hatası 60+ kez tekrarlandı (`138528754708450`, `72885128103622`…); `dedupe: true` (aynı mesaj → `count`) çok yer açar.
- **Aday:** `studio-plugin/src/modules/RuntimeLogBuffer.ts`, `packages/core/src/tools/definitions.ts` (get_runtime_logs şeması).

### 7. Eş zamanlı çok ajan → kuyruk, timeout, tekrar deneme
- **Belirti:** 5 ajan aynı instance'a `execute_luau`/`export_rbxm` atınca 60 s timeout'lar; ajanlar `get_request_status` yerine aynı kodu tekrar gönderdi (operation_id vermedikleri için dedupe olmadı). Mutasyonlar (örn. dekor yerleştirme) iki kez çalışma riski.
- **İstek:** (a) `execute_luau` sonucu `queued_ahead: N` ve tahmini bekleme; (b) `operation_id` yoksa sunucu kodun hash'inden otomatik türetsin (aynı kod + aynı instance 5 dk içinde → retained outcome); (c) timeout'ta dönen hata metnine doğrudan "`get_request_status` çağır, tekrar gönderme" cümlesi.
- **Aday:** `packages/core/src/bridge-service.ts`, `managed-instance-registry.ts`, `studio-plugin/src/modules/CooperativeJobRunner.ts`.

### 8. `grep_scripts` etiket (CollectionService) tabanlı kullanımı görmüyor
- **Belirti:** `Tikfinity` düğmesini runtime'da `Visible=true` yapan kodu bulmak için `grep_scripts pattern="Tikfinity"` → 0 sonuç (303 script). Referans UIHandler nesneleri `CollectionService:GetTagged("…")` ile buluyor; tag adı script'te geçmiyor (Config tablosundan geliyor). Çözüm nesneyi silmek oldu.
- **İstek:** `search_objects`/yeni `get_tags` aracı: bir nesnenin tag'leri + o tag'i `GetTagged` ile arayan scriptler (statik: `GetTagged("<tag>")` literal eşleşme; dinamik ise "tag listesi Config'ten" uyarısı). En azından `get_instance_properties` çıktısına `tags: [...]` alanı.
- **Aday:** `studio-plugin/src/modules/ScriptSearch.ts`, `handlers/*` (instance properties).

### 9. Studio penceresi küçültülünce her şey siyah; pencere handle'ı oturumdan oturuma değişiyor — `get_connected_instances` `windowTitle`/`processId` kısmı ✅ (commit 6e1b841, Ajan B); küçültülmüş pencereyi geri getirme Ajan A
- **Belirti:** Kullanıcı Studio'yu küçültmüşse `capture_screenshot` siyah. Her oturumda `Get-Process RobloxStudioBeta | select MainWindowHandle` ile handle bulup `ShowWindow` gerekiyor (bu oturumda 132328; 3 Studio açıkken hangisinin hangi instance olduğu başlıkla eşleniyor).
- **İstek:** `capture_screenshot` (ya da yeni `focus_window`) küçültülmüşse geri getirip önplana alsın (`host-capture.ts` zaten pencereyi buluyor); `get_connected_instances` çıktısına `windowHandle`/`windowTitle` ekle.

### 10. Play modunda `capture_screenshot` referans instance'ta "client peer" nedeniyle hiç çalışmadı
- **Belirti:** `instance:v5b-wun` (play modunda: edit + server + client-1) için `capture_screenshot` her seferinde başarısız (önceki oturum: peer belirsizliği). Salt-okunur referans incelemesinde görsel alınamadı; kod okumayla idare edildi.
- **İstek:** `target` parametresi (`edit|client-1`) ya da play modunda otomatik client-1 seçimi; hata metninde hangi peer'ın denendiği.

---

## P3 — iyileştirme

### 11. `get_connected_instances` play durumunu göstermiyor ✅ (commit 6e1b841, test tests/todo-2026-09-15/11-connected-instances-playtest.mjs + studio-playtest-control.test.ts; kanıt kanit/11-connected-instances-playtest.md)
- `peers` içinde `server`/`client-1` olması play'i ima ediyor ama `mode` (play/run) ve süresi yok. Ajanlara "referans play modunda, edit target kullan" demek zorunda kaldım. `solo_playtest status` her instance için ayrı çağrı.
- **İstek:** `playtest: { active, mode, startedAt }` alanı.

### 12. `eval_server_runtime` ile hızlı `HumanoidRootPart.CFrame` atamaları oyunun anti-cheat'ine takılıyor
- Aracın hatası değil; ama "oyuncuyu X'e götür" testleri için `Humanoid:MoveTo` döngüsü yazmak gerekti. Tool-guides'a not: "sunucu tarafı ışınlamada oyunun hız sınırlarını (bu oyunda 20 stud/örnek) düşün; `MoveTo` ya da oyunun kendi teleport API'si".

### 13. `export_rbxm` boyut/sayı raporu
- Export sonucu yalnız yol döndürüyor; ajanlar dosya boyutunu `ls` ile, nesne sayısını ayrıca `GetDescendants` ile doğruladı. **İstek:** sonuçta `bytes`, `instanceCount`, `rootClass` (madde 3'ü de erken yakalar).

### 14. `import_rbxm` sonrası sayım/doğrulama
- Import başarılı dönse de kaç nesne geldiği bilinmiyor; her import'tan sonra `execute_luau` ile `GetDescendants` sayımı yapıldı. **İstek:** sonuçta `instanceCount`, `rootNames`.

### 15. `get_runtime_logs` `filter` yalnız alt dize; `level` ve `since` yok
- `level: "ERR"|"WARN"`, `since_ts`, `exclude` (asset-izin spam'ini dışlamak için) parametreleri.

### 16. Tool-guides: eş zamanlı ajan protokolü için kısa bir bölüm
- Sahada işe yarayan kurallar (`robloxstudio://tool-guides`'a eklenebilir): tek playtest kilidi (orkestratör), ajan başına disjoint DataModel alt ağacı, `operation_id` zorunlu, edit DM'e yazınca play'i yeniden başlat, büyük çıktıları parçala, referans instance salt-okunur (`target=edit`).

---

## Sahada çalışan ve dokunulmaması gerekenler (regresyon listesi)
- `execute_luau` edit bağlamında `HttpService:GetAsync("http://127.0.0.1:8765/...")` (devserver köprüsü) — disk→Studio sync'in omurgası.
- `eval_server_runtime` / `eval_client_runtime` require önbelleğiyle canlı modül erişimi (`require(SSS.StageService)`) — play doğrulamasının tamamı buna dayandı.
- `export_rbxm` edit DM'den play modundayken de okuyabildi (referans 34 dosya, 2,6 MB).
- `grep_scripts` 303 script / <1 s.
- `solo_playtest start` 60 s timeout'ta her seferinde 5–10 s'de döndü; `stop` anında.

## Ölçüm notu
- Bu oturumda araç çağrısı: ~700 (11 + 5 + 3 ajan + orkestratör). Kuyruk/timeout kaynaklı tekrar: tahminen 30–40 çağrı; ekran görüntüsü başarısızlığı: 5 çağrı + PowerShell çözümü ~15 dk.
