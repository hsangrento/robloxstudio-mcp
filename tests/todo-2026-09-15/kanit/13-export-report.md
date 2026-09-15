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
