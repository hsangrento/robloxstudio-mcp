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
