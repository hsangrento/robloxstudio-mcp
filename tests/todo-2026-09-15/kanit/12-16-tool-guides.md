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
