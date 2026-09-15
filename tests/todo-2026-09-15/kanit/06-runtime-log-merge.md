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
