# 00 — Saha regresyon listesi (TODO.md "dokunulmaması gerekenler")

Komut: `node tests/run-with-test-port.mjs tests/run-all.mjs --managed --test todo-2026-09-15/00-saha-regresyon.mjs` (2026-09-15, HEAD 55577fa + bu dosya; managed baseplate, kullanıcının 3 Studio'su açıkken)

Ham çıktı:
```
{"grepMs":16,"matches":50}
{"soloPlaytestStartMs":3107}
{"evalServerA":{"ok":true,"bridge":"ok","result":"1","output":[]},"evalServerB":{"ok":true,"bridge":"ok","result":"2","output":[]}}
{"evalClient":{"ok":true,"bridge":"ok","result":"hsangrento","output":[]}}
{"exported":{"bytes_written":7020,"instance_count":1,"output_path":"C:\Users\hasan\AppData\Local\Temp\todo0-sTltG5\saha.rbxm"}}
{"soloPlaytestStopMs":1415}
✅ saha regresyon listesi PASSED
```
Eşikler: grep_scripts < 5 s (ölçüm 16 ms, 50 script), solo_playtest start ≤ 15 s (3,1 s), stop 1,4 s, require önbelleği 1→2, export_rbxm play modunda edit DM'den 7 020 B.
Not (#13 için): export_rbxm zaten `bytes_written` ve `instance_count` döndürüyor; `instance_count` kök sayısı (1), alt nesne sayısı (56) değil.
Localhost HTTP (devserver köprüsü) kanıtı Ajan D'nin 07 testinde.
