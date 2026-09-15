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
