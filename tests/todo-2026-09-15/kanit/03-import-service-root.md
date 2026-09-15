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
