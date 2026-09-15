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
