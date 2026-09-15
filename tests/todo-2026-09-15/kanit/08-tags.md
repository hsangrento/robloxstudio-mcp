# TODO #8 — CollectionService tag araması (`search_tags` + `get_instance_properties.tags`)

Ajan E, dal `todo/E`. Ham çıktılar: `raw-08-studio-red.txt`, `raw-08-studio-green.txt`, `raw-08-jest-red.txt`, `raw-jest-green.txt`.

## Belirti / yeniden üretme

Test: `tests/todo-2026-09-15/08-tags.mjs` (managed). Edit DM'de `workspace.TODO8.TODO8Part` (tag `TODO8`), `TODO8DynPart` (tag `TODO8Dyn`), `ServerScriptService.TODO8Static` (`CS:GetTagged("TODO8")` literal) ve `TODO8Dynamic` (tag adı `script:GetAttribute("Tag")`'ten geliyor) kuruluyor.

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/08-tags.mjs`

Kırmızı (2026-09-15 11:28, instance `instance:p7b-le2`, düzeltmesiz eklenti):

```
  [grep_scripts TODO8Dyn] {"scriptsMatched":0,"scriptsSearched":2}
  ✓ symptom: grep_scripts cannot see the attribute-driven tag use
  [get_instance_properties] {"properties":["ChildCount","Parent","CFrame","Material","Size","BottomSurface","CanCollide","Position","Anchored","Rotation","Transparency","Name","ClassName","Color","BrickColor","Shape","TopSurface"]}
❌ TODO #8: tags on get_instance_properties and search_tags FAILED: ASSERT FAIL: get_instance_properties lists tags (got undefined)
```

Jest kırmızı (`todo-08-tags.test.ts`, `studio-script-search.test.ts` eklemeleri):

```
  ● TODO #8 search_tags › is a read-only catalog tool with tag, maxResults, and instance_id
    expect(received).toBeDefined()   Received: undefined
  ● TODO #8 search_tags › forwards tag and maxResults to /api/search-tags ...  TypeError: http_server_js_1.TOOL_HANDLERS.search_tags is not a function
  ● TODO #8 tag literal search helpers › tagLiteralPattern ...  TypeError: module.tagLiteralPattern is not a function
```

## Düzeltme

- `studio-plugin/src/modules/handlers/QueryHandlers.ts`: `getInstanceProperties` dönüşüne `tags` (pcall `CollectionService:GetTags`; `game.GetService` ile, çünkü `studio-grep-responsiveness.test.ts` bu dosyayı esbuild'le Node'da yüklüyor ve `@rbxts/services` import'u `.lua` yükleyici hatası veriyor).
- `studio-plugin/src/modules/ScriptSearch.ts`: `tagLiteralPattern(tag)` (Lua magic karakterleri kaçırılmış `["']<tag>["']` deseni) ve `classifyTagUsage(line)` (`GetTagged|HasTag|AddTag|RemoveTag|GetInstanceAddedSignal|GetInstanceRemovedSignal|literal`).
- `studio-plugin/src/modules/handlers/TagHandlers.ts` (yeni): `/api/search-tags`. `tag` verilince `CollectionService:GetTagged` yolları (`maxResults`, varsayılan 100, en çok 1000; `instanceCount`, `truncated`) + `QueryHandlers.grepScripts` üzerinden `usePattern` statik arama (`scripts[]: instancePath, className, line, text, api`; `scriptsSearched`, `scriptsTruncated`) + hiç literal yoksa `dynamicHint`. `tag` verilmezse `GetAllTags` + sayım (`tags[]`, `totalTags`; `GetAllTags` yoksa `GetDescendants` taraması).
- `studio-plugin/src/modules/Communication.ts`: import + `"/api/search-tags"` satırı.
- `packages/core/src/tools/definitions.ts`: `search_tags` (category `read`; `tag`, `maxResults`, `instance_id`). `packages/core/src/http-server.ts`: `TOOL_PROXY_ENDPOINTS.search_tags`, `TOOL_HANDLERS.search_tags`. `packages/core/src/tools/index.ts`: `searchTags()` (doğrulama + `/api/search-tags`, grep zaman aşımı).
- Paylaşılan testler: `tool-schema.test.ts` `methodNameOf.search_tags`; `mcp-runtime.test.ts` katalog sayıları 48→49, outputSchema 47→48, inspector 25→26 ve bütçe 44 000→45 000 / 20 000→21 000 (yeni araç eklenmeden önce boş pay katalogda ~600, inspector'da ~20 karakterdi; `docs/token-efficiency.md` güncellendi). README: araç satırı + inspector sayısı 24→25.

## Yeşil

Aynı komut, 2026-09-15 11:38, instance `instance:ugh-0m6`:

```
  [get_instance_properties] {"tags":["TODO8"],"properties":[...]}
  ✓ get_instance_properties lists tags (got ["TODO8"])
  [search_tags TODO8] {"instances":["game.Workspace.TODO8.TODO8Part"],"truncated":false,"scripts":[{"line":2,"instancePath":"game.ServerScriptService.TODO8Static","className":"Script","text":"for _, inst in ipairs(CS:GetTagged(\"TODO8\")) do","api":"GetTagged"}],"scriptsSearched":2,"scriptsTruncated":false,"instanceCount":1,"tag":"TODO8"}
  [search_tags TODO8Dyn] {"dynamicHint":"No script contains this tag as a string literal. The tag name may come from a Config or data table, an attribute, or a StringValue; search those sources or the code that calls GetTagged with a variable.","instances":["game.Workspace.TODO8.TODO8DynPart"],"truncated":false,"scripts":[],"scriptsSearched":2,"scriptsTruncated":false,"instanceCount":1,"tag":"TODO8Dyn"}
  [search_tags (all)] {"totalTags":6,"tags":[{"count":1,"tag":"TODO8"},{"count":1,"tag":"TODO8Dyn"},{"count":0,"tag":"TagEditorTagContainer"},{"count":1,"tag":"data-testid=--studio-foundation--stylesheet-wrapper"},{"count":1,"tag":"gui-object-defaults"},{"count":1,"tag":"size-full"}]}
  [search_tags missing] {"dynamicHint":"...","instances":[],"truncated":false,"scripts":[],"scriptsSearched":2,"scriptsTruncated":false,"instanceCount":0,"tag":"TODO8Missing"}
✅ TODO #8: tags on get_instance_properties and search_tags PASSED
EXIT=0
```

Not: `GetAllTags` Studio'nun kendi CoreGui tag'lerini de listeliyor (`gui-object-defaults` vb.); sayım `GetTagged` ile yapıldığı için CoreGui nesneleri de sayılıyor. Filtrelenmedi (bilgi değeri var, CoreGui erişimi eklentide sorunsuz).

Jest yeşil: `todo-08-tags.test.ts` 4/4, `studio-script-search.test.ts` +3 test.

## Regresyon

- `npm run typecheck` yeşil.
- `npm run lint`: 7 hata / 40 uyarı (başlangıçtaki 7 eski hata; yeni yok).
- `npm test -w packages/core`: 40 suite / 660 test yeşil (başlangıç 37 / 643).
