# KANIT — TODO.md maddeleri (2026-09-15)

## Başlangıç (HEAD 3847349 = df6e536 + TODO.md commit'i, Node v24.13.0, npm 11.6)

| Komut | Sonuç |
|---|---|
| `npm ci` / `npm ci --prefix studio-plugin` | tamam (55 paket eklenti) |
| `npm run build:all` | tamam; MCPPlugin.rbxmx + MCPInspectorPlugin.rbxmx üretildi, `%LOCALAPPDATA%\Roblox\Plugins`'e kuruldu |
| `npm run typecheck` | yeşil |
| `npm run lint` | **baştan kırmızı**: 7 hata (install-plugin-helpers.ts:254–257 mixed spaces/tabs; opencloud-client.ts:445 no-constant-condition; packages/robloxstudio-mcp{,-inspector}/src/install-plugin.ts `_chunk` unused), 40 uyarı — TODO kapsamı dışı, dokunulmadı |
| `npm test -w packages/core` | 37 suite / 643 test yeşil |
| `npm run test:asset-security` | 4/4 yeşil |
| `npm run test:package-contents` | **baştan kırmızı**: `spawnSync('npm.cmd', …)` Node 24'te `status: null` (EINVAL; shell olmadan .cmd) — ortam sorunu, TODO dışı |
| `npm run test:runner` | 6/6 yeşil (mcp-http-client, output-parser 134 MB/296 ms, managed-studio-session, instance-routing, auto-install-run-process, studio-directory-isolation) |
| `npm run test:port-isolation` | 3/3 yeşil |
| `npm run test:studio:smoke` (ayrı baseplate Studio, kullanıcının 3 Studio'su açıkken) | 3/3 yeşil: studio-tooling-smoke, eval-context-routing, micro-profiler-responsiveness |

Canlı MCP (port 58741) başlangıçta 3 instance görüyor: `instance:kqq-3vh`, `instance:v5b-wun` (edit+server+client-1), `instance:f4w-te1`.

Ajan düzeni: 5 worktree (`mcp/wt/A..E`, dallar `todo/A..E`), madde başına kanıt dosyası `tests/todo-2026-09-15/kanit/NN-*.md`; bu dosya sonda birleştirilir.

