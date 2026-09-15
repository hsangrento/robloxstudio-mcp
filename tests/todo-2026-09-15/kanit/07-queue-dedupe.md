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
| `settled`, bekleyene **teslim edilmiş** (`waiterEndedAt` yok) | bilinçli yeniden çalıştırma: `auto-<hash>-2`, `-3`… ile **çalışır** | `dedupe:"auto"` |
| `settled`, **teslim edilmemiş** (`waiterEndedAt` var: bekleyen timeout/abort/disconnect ile ayrılmış, sonuç sonradan gelmiş), sonuç retained | retained outcome döner, kod çalışmaz | `deduplicatedFrom:<id>` |
| `executionOutcome: not_executed` (kuyrukta timeout, hiç dispatch edilmedi) | güvenli: sonraki attempt kimliğiyle çalışır (en fazla 16, sonra rastgele UUID) | `dedupe:"auto"` |
| timed_out/aborted ama dispatch edilmiş ve henüz settle olmamış (sonuç bilinmiyor) ya da teslim edilmemiş sonuç evict edilmiş | **çalıştırılmaz**; `operation_not_replayed` hatası: "…call get_request_status with operation_id <id>; do not resend; pass dedupe:false or a new operation_id to run it again" | — |

**Revizyon (2026-09-15, commit sonrası):** ilk sürüm teslim edilmiş retained sonucu da dedupe ediyordu; bu `tests/runtime-bridge-lifecycle.mjs`'yi kırdı (test aynı `task.spawn(function() StudioTestService:ExecutePlayModeAsync({}) end) return true` kodunu operation_id'siz iki ayrı aşamada gönderiyor, ikincisi retained sonucu alıp play'i hiç başlatmadı → "Timed out waiting for roles edit, server, client-1"). Orkestratör kararı: **teslim edilmiş sonuç yeniden çalıştırmayı engellemez** — sonucu eline almış bir çağıranın aynı kodu tekrar göndermesi bilinçli yeniden çalıştırmadır. Otomatik dedupe yalnız sahadaki gerçek zarar senaryosunu hedefler: bekleyen timeout'la ayrılmış (`waiterEndedAt`), sonuç kimseye ulaşmamış istek. Ölçüt `bridge-service.ts` `endRequestWaiter`'ın set ettiği `waiterEndedAt` (recordResponse sonrası da kalır).

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

## Yeşil (revize kural, HEAD 660cba2 + bu düzeltme; managed `instance:x91-or4`, 2026-09-15 09:25–09:26 UTC)

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/07-queue-dedupe.mjs`

```
=== TODO#7 queue metrics, automatic dedupe, timeout guidance ===
--- (b) teslim edilmiş sonuç: aynı kod, operation_id yok → bilinçli yeniden çalıştırma (2 dispatch) ---
{"label":"first","timestamp":"2026-09-15T09:25:34.677Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"auto-6c640e0d09711b372f0e63373bd216ad65444103aacd1f72fc0b7e5141717d61","queued_ahead":0,"waitedMs":7,"dedupe":"auto"}}
{"label":"second","timestamp":"2026-09-15T09:25:34.678Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"auto-6c640e0d09711b372f0e63373bd216ad65444103aacd1f72fc0b7e5141717d61-2","queued_ahead":0,"waitedMs":9,"dedupe":"auto"}}
--- (b) dedupe:false → yeniden çalışır ---
{"label":"forced","timestamp":"2026-09-15T09:25:34.711Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"2b60af92-7581-4534-8633-c6240da4d66e","queued_ahead":0,"waitedMs":11}}
--- (b) yeni operation_id → yeniden çalışır ---
{"label":"explicit","timestamp":"2026-09-15T09:25:34.743Z","body":{"returnValue":"Dedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":6,"returnedBytes":6,"maxOutputBytes":65536,"operationId":"todo07-1789464334727","queued_ahead":0,"waitedMs":11}}
--- (b) teslim EDİLMEMİŞ sonuç: kısa waiter timeout → aynı kod tekrar → kod bir kez çalışır ---
{"label":"slow via /proxy timeoutMs=1000","timestamp":"2026-09-15T09:25:35.795Z","status":500,"body":{"error":"Request timeout: auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25; executing; unknown; waiter ended, execution is not cancelled or rolled back; call get_request_status with operation_id auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25; do not resend","code":"request_timeout","details":{"requestId":"auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25","targetPeerId":"peer:150-4ww","stage":"executing","outcome":"unknown","executionStartedAt":1789464334791,"executionOutcome":"unknown"}}}
{"label":"immediate resend (still executing)","timestamp":"2026-09-15T09:25:35.798Z","body":{"error":"operation_not_replayed","message":"Request auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25 already exists: timed_out; executing; unknown; identical code was sent to this peer within the retention window, its waiter ended and its outcome is unknown; call get_request_status with operation_id auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25; do not resend; pass dedupe:false or a new operation_id to run it again","requestId":"auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25","targetPeerId":"peer:150-4ww","stage":"executing","outcome":"unknown"}}
{"label":"status after late settle","timestamp":"2026-09-15T09:25:45.810Z","body":{"requestId":"auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25","targetPeerId":"peer:150-4ww","queuedAt":1789464334788,"stage":"response_delivery","state":"settled","outcome":"success","executionOutcome":"success","executionStartedAt":1789464334791,"executionCompletedAt":1789464342807,"queuedAhead":0,"dispatchedAt":1789464334788,"settledAt":1789464342807,"waiterEndedAt":1789464335793,"response":{"returnValue":"SlowDedupe","message":"Code executed successfully","success":true,"output":[]}}}
{"label":"resend after undelivered settle","timestamp":"2026-09-15T09:25:45.814Z","body":{"returnValue":"SlowDedupe","message":"Code executed successfully","success":true,"output":[],"truncated":false,"totalBytes":10,"returnedBytes":10,"maxOutputBytes":65536,"operationId":"auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25","queued_ahead":0,"waitedMs":3,"dedupe":"auto","deduplicatedFrom":"auto-f579e4dce8bc3021176986384447b01eb4f202adba69bd1c6962a2ae31605e25"}}
--- (a) 5 paralel execute_luau → queued_ahead 0..4, waitedMs ---
{"label":"parallel","timestamp":"2026-09-15T09:25:49.875Z","elapsedMs":4050,"queuedAhead":[0,2,1,3,4],"waited":[10,10,10,10,2026],"operationIds":["d06260ee-f1ee-441b-81b0-2479545afa82","49d2af85-2252-41a2-97d7-fc3803543a90","9730f83e-7637-4c4e-9c80-bf427bb7554c","36267038-3241-40cb-849c-a321a2076b6a","e51ff911-a44a-4db6-b546-6b01e618449d"]}
--- (a) export_rbxm sonucunda queued_ahead + waitedMs ---
{"label":"export","timestamp":"2026-09-15T09:25:49.910Z","body":{"bytes_written":601,"instance_count":1,"output_path":"C:\\Users\\hasan\\AppData\\Local\\Temp\\todo07-63900.rbxm","bytes":601,"instanceCount":6,"rootClass":"Folder","rootName":"__RSMCP_Todo07","rootClasses":["Folder"],"rootNames":["__RSMCP_Todo07"],"operationId":"73d06813-feaa-4527-b7ef-4f7fa8e078fa","queued_ahead":0,"waitedMs":11}}
--- (c) timeout hata metni: get_request_status yönergesi + operation_id ---
{"label":"timeout","timestamp":"2026-09-15T09:26:19.928Z","body":{"error":"request_timeout","message":"Request timeout: todo07-timeout-1789464349910; executing; unknown; waiter ended, execution is not cancelled or rolled back; call get_request_status with operation_id todo07-timeout-1789464349910; do not resend","requestId":"todo07-timeout-1789464349910","targetPeerId":"peer:150-4ww","stage":"executing","outcome":"unknown","executionOutcome":"unknown","executionStartedAt":1789464349923}}
{"label":"status after timeout","timestamp":"2026-09-15T09:26:19.929Z","body":{"requestId":"todo07-timeout-1789464349910","targetPeerId":"peer:150-4ww","queuedAt":1789464349912,"stage":"executing","state":"timed_out","outcome":"unknown","executionOutcome":"unknown","executionStartedAt":1789464349923,"queuedAhead":0,"dispatchedAt":1789464349913,"waiterEndedAt":1789464379926}}
✅ TODO#7 queue metrics, automatic dedupe, timeout guidance PASSED
Closed managed Studio instance instance:x91-or4
========== SUMMARY ==========
  ✅ PASS  todo-2026-09-15/07-queue-dedupe.mjs
1/1 passed.
=== todo-2026-09-15/07-queue-dedupe.mjs exit=0
```

Sayılar: aynı kod ×2 (teslim edilmiş) → **2** Folder, ikinci `operationId = auto-6c64…-2`, `deduplicatedFrom` yok; `dedupe:false` → 3; yeni `operation_id` → 4. Teslim edilmemiş senaryo: `task.wait(8)` kodu birincilin `/proxy` ucuna `timeoutMs:1000` ile → 1 s'de `request_timeout` (yönerge cümlesiyle); hemen aynı kod → `operation_not_replayed` (çalışması sürüyor); 10 s sonra `SlowDedupe` sayısı **1**, `get_request_status` → `state:settled, waiterEndedAt:1789464335793`; aynı kod tekrar → `deduplicatedFrom: auto-f579…`, sayı hâlâ **1**. 5 paralel `task.wait(2)` → `queued_ahead` kümesi {0,1,2,3,4}, `waitedMs=[10,10,10,10,2026]`. `export_rbxm` → `queued_ahead:0, waitedMs:11`. `task.wait(40)` → 30 s'de `request_timeout` + yönerge.

Regresyon koşuları aynı oturumda (ayrı managed Studio'lar): `runtime-bridge-lifecycle.mjs` ✅ PASS (ilk sürümde ❌ "Timed out waiting for roles edit, server, client-1"), `todo-2026-09-15/00-saha-regresyon.mjs` ✅ PASS.

İlk sürümün (teslim edilmiş sonucu da dedupe eden) yeşil çıktısı git geçmişinde: commit 0fb1d19'daki bu dosya.

## Regresyon

- Jest: `request-recovery-tools.test.ts` "TODO#7 automatic execute_luau dedupe without operation_id" (9 test: pending sırasında özdeş kod → tek dispatch + `deduplicatedFrom`; teslim edilmiş sonuçtan sonra özdeş kod → iki dispatch (`-2`, `-3`), `deduplicatedFrom` yok; waiter timeout sonrası geç settle olmuş (`waiterEndedAt`) istekten sonra özdeş kod → dedupe; farklı kod → iki dispatch, `queued_ahead` 0/1; `dedupe:false` ve yeni `operation_id` → yeniden dispatch; 5 dk sonra (fake timers) → yeniden dispatch; dispatch edilmiş timeout → `operation_not_replayed`; hiç dispatch edilmemiş timeout → `auto-…-2`; `max_output_bytes` muhasebesi), `bridge-service.test.ts` "TODO#7 queue position and timeout guidance" (2 test), `payload-timeout-diagnostics.test.ts` (timeout mesajı iddiası). Sahip olunan iki eski test `toEqual` → `toMatchObject` (yeni alanlar).
- `npm run typecheck`: yeşil. `npm run lint`: 7 eski hata, yeni yok. `npm test -w packages/core`: birleşik HEAD'de 41 suite / 704 test yeşil (Studio koşusuyla eş zamanlı bir koşuda `smoke.test.ts` › "identity-required launch retains ownership" bir kez zaman aşımına düştü; tek başına ve tekrar koşuda yeşil — managed launch zamanlaması, bu değişiklikle ilgisiz).
