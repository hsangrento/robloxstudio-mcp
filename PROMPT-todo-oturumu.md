# Görev: robloxstudio-mcp — TODO.md'deki 16 maddeyi uygula ve KESİN OLARAK test et

Çalışma dizini: `C:\Users\hasan\Desktop\mcp\robloxstudio-mcp` (git deposu; dal `fix/playtest-screenshot-host-capture`, HEAD `df6e536`; remote `origin` = Chrrxs/robloxstudio-mcp (upstream, PUSH YOK), `fork` = hsangrento/robloxstudio-mcp).
Yedek (dokunma, yalnız geri dönüş için): `C:\Users\hasan\Desktop\mcp\robloxstudio-mcp-yedek-2026-09-15\` (kaynak kopyası, node_modules hariç) + `repo-2026-09-15.bundle` (tüm git ref'leri). Geri dönüş: `git bundle verify` → `git fetch <bundle> --all` ya da klasörü kopyala.

## Bağlam
- Bu depo kullanıcının kendi Roblox Studio MCP sunucusu (monorepo v3.1.4: `packages/core` TypeScript sunucu, `packages/robloxstudio-mcp` CLI, `studio-plugin` Roblox eklentisi TS→Luau). Claude Code'daki `robloxstudio` MCP girdisi **bu deponun derlenmiş çıktısını** çalıştırıyor: `node C:\Users\hasan\Desktop\mcp\robloxstudio-mcp\packages\robloxstudio-mcp\dist\index.js --auto-install-plugin` (köprü 127.0.0.1:58741, token `~/.robloxstudio-mcp/auth-token`). Yani `npm run build:all` sonrası Claude Code'u/MCP'yi yeniden başlatınca yeni kod canlıya çıkar; eklenti `--auto-install-plugin` ile Studio'ya yeniden kurulur (Studio'nun yeniden açılması gerekebilir).
- `TODO.md` (depo kökü) 15 Eylül'de gerçek bir projede (`C:\Users\hasan\Desktop\roblox-game`, Studio'da açık "🐌 +1 Salyangoz Kaçışı") 700 araç çağrısıyla toplanmış 16 sorun. Her maddede belirti, yeniden üretme, beklenen davranış, aday dosya, öncelik var. **Bu belge iş listesidir; sırayla P1 → P2 → P3.**
- Test altyapısı zaten var: `packages/core/src/__tests__/*.test.ts` (jest, `npm test -w packages/core`), `tests/*.mjs` (Node betikleri; `npm run test:runner`, Studio gerektirenler `tests/run-all.mjs --managed`, port izolasyonu `tests/run-with-test-port.mjs`). `tests/README.md`'yi ve `docs/building-from-source.md`'yi ÖNCE oku. Node ≥ 22.

## Kesin kurallar
1. **Her madde için önce başarısız olan bir test yaz, sonra düzelt, sonra test geçsin.** Test yoksa madde "bitti" sayılmaz. Birim test `packages/core/src/__tests__/` ya da eklenti tarafı için `studio-plugin` derlemesi + `tests/` altında Node betiği. TODO.md'deki maddelere özel yeni klasör: **`tests/todo-2026-09-15/`** — her madde için `NN-<kisa-ad>.mjs` (ya da `.test.ts`), dosya başında maddenin numarası ve "neyi kanıtlıyor" cümlesi. Bu klasördeki tüm testleri tek komutla koşturan `tests/todo-2026-09-15/run-all.mjs` yaz ve `package.json`'a `"test:todo": "node tests/todo-2026-09-15/run-all.mjs"` ekle.
2. **Studio gerektiren maddeler (1, 2, 3, 4, 7, 9, 10, 11, 12) gerçek Studio ile de doğrulanır.** Yöntem: `npm run build:all` → MCP'yi yeniden başlat → Studio'da `C:\Users\hasan\Desktop\lib\rblx\keyboard_escape_sangrento_studio_full_rebrand.rbxl` ya da boş bir yer aç → `mcp__robloxstudio__*` araçlarıyla TODO'daki "yeniden üretme" adımlarını aynen uygula → önce/sonra çıktısını `tests/todo-2026-09-15/KANIT.md`'ye yapıştır (araç adı, parametre, ham sonuç, tarih). Mümkünse aynı senaryoyu `tests/run-all.mjs --managed` altyapısıyla otomatik test olarak da yaz (`tests/capture-regressions.mjs`, `tests/playtest-control-repro.mjs`, `tests/luau-payload-transfers.mjs` örnek). "Studio'da elle denedim, çalıştı" cümlesi kanıt değildir; ham çıktı ister.
3. **Regresyon:** her maddeden sonra `npm run typecheck && npm run lint && npm test` yeşil; en sonda `npm run test:studio:smoke` (Studio ile). TODO.md'nin "Sahada çalışan ve dokunulmaması gerekenler" listesindeki davranışlar için de test olsun (execute_luau + HttpService localhost, eval_*_runtime require önbelleği, export_rbxm play modunda edit DM, grep_scripts süresi, solo_playtest start ≤ 15 s).
4. **Kapsam disiplini:** TODO dışı özellik ekleme, yeniden düzenleme, sürüm numarası/yayın değişikliği yok. `origin`'e push YOK; commit'ler yerel dalda, madde başına bir commit: `fix(<alan>): TODO#N <kısa açıklama>`; commit gövdesinde test dosyası adı. En sonda `git log --oneline df6e536..HEAD`.
5. **Rapor:** `TODO.md`'de her maddenin başlığına durum ekle: `✅ (commit <hash>, test <dosya>)`, `⏭️ ertelendi (neden)`, `❌ yeniden üretilemedi (denenen adımlar)`. Bir madde yeniden üretilemiyorsa uydurma düzeltme yapma; nedenini ve denediklerini yaz.
6. **Kod yorumu yazma** (gerekçe commit mesajına ve TODO'ya); mevcut kod stiline uy (`.eslintrc.json`); TypeScript strict.
7. Paralel alt ajan kullanabilirsin ama **Studio'ya aynı anda tek ajan** erişir (playtest/capture tek kaynak); dosya sahipliğini başta yaz.

## Madde başına asgari kabul ölçütü (TODO.md ile birlikte oku)
- **#1 capture boş kare:** play modunda `capture_screenshot` → tek renk olmayan görüntü; sonuçta `viewportRect`; marker bulunamayınca hata metninde marker sayısı + emülasyon durumu; `fallback:"window"` ile kırpılmamış pencere. Birim test: `host-capture.test.ts`'e emülasyon ölçekli marker senaryosu (1608×661 rapor / 1326×662 pencere) + tek renk kare tespiti.
- **#2 restart:** `solo_playtest action="restart"` (mode korunur) tek çağrıda stop+start; ölçülen süre raporda.
- **#3 import servis kökü:** `StarterCharacterScripts` köklü rbxm → çocuklar hedefe; hata metni Roblox'un mesajını içerir. Test: export→import döngüsü aynı Studio'da.
- **#4 StreamingMinRadius:** eklentiden yazılamayan özellik için açıklayıcı hata (özellik adı + "Properties panelinden ayarla"); birim test PropertyHandlers için (Luau tarafı test edilemiyorsa `tests/property-value-conversion.mjs` örneğiyle Node'dan).
- **#5 execute_luau kırpma:** `truncated: true` + `totalBytes`; `max_output_bytes` parametresi; 200 kB dönüşle test.
- **#6 log birleştirme:** hata + "Script '…', Line N" + stack tek kayıt (`stack` alanı); `level` parametresi; `dedupe` (aynı mesaj → `count`). Test: `RuntimeLogBuffer` için birim + Studio'da bilerek hata üreten `eval_client_runtime`.
- **#7 kuyruk:** `operation_id` yoksa kod hash'inden türet (aynı kod 5 dk içinde → retained outcome, mutasyon iki kez çalışmaz — test: `Instance.new` yapan aynı kodu iki kez gönder, nesne 1 tane); timeout hata metninde `get_request_status` yönergesi; `queued_ahead`.
- **#8 tag arama:** `get_instance_properties` çıktısında `tags`; `grep_scripts` ya da yeni araç ile `GetTagged("<tag>")` literal araması.
- **#9 pencere:** küçültülmüş Studio'da `capture_screenshot` pencereyi geri getirir; `get_connected_instances`'ta `windowTitle`.
- **#10 client peer capture:** play modunda `target` parametresi ya da otomatik client-1; hata metninde denenen peer.
- **#11–#16:** TODO'daki "İstek" satırı aynen; #16 için `robloxstudio://tool-guides` kaynağına "Eş zamanlı ajan protokolü" bölümü ve o metni okuyan test (kaynak listesinde var mı, bölüm başlığı geçiyor mu).

## Başlangıç sırası
1. `git status` temiz mi (TODO.md untracked — ilk commit: `docs: TODO.md saha bulguları`), `npm ci`, `npm run build:all`, `npm test` — **başlangıç yeşil mi, kaydet** (`tests/todo-2026-09-15/KANIT.md` "Başlangıç" bölümü).
2. `TODO.md`, `tests/README.md`, `docs/building-from-source.md`, `packages/core/src/host-capture.ts`, `studio-plugin/src/modules/CaptureTransfer.ts`, `RenderMonitor.ts`, `handlers/SerializationHandlers.ts`, `handlers/PropertyHandlers.ts`, `RuntimeLogBuffer.ts`, `LuauExec.ts`, `CooperativeJobRunner.ts`, `packages/core/src/bridge-service.ts`, `tools/definitions.ts` oku.
3. P1'den başla (#1 → #2 → #3 → #4), her madde: test (kırmızı) → düzeltme → test (yeşil) → regresyon → commit → TODO durumu.
4. Bitişte: `npm run build:all`, MCP'yi yeniden başlat, `npm run test:todo`, `npm run test:studio:smoke`, KANIT.md tamam, `git log`. Kullanıcıya 15 satırlık özet: madde başına durum, commit, test dosyası; yeniden üretilemeyenler ayrı.

Soru varsa başlamadan sor; yoksa başla.
