# CursorBench 4.0 refresh, 2026-10-07

Batch: `data/batches/evaluator-cursorbench-refresh-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `page.html`
(https://cursor.com/cursorbench, fetched 2026-10-07; the Wayback snapshot in
`archive.txt` shows the same 63 rows). The page says "Higher scores are
better" in words (relevant for the metric-direction pass).

Owner decision D6: the 13 rows already held with the same score are skipped.
The other effort settings and models on the board are added (49 rows), using
the effort labels the Registry already uses for this board (Max → max,
Extra High → xhigh, High, Medium, Low). Cursor runs every model;
other developers' models are `independent`, Cursor's own Composer would be
`self-reported` (it is already held). The board gives no per-row date, so new
rows use the archive date (owner decision D4). Cost, tokens and steps are run
details and are not recorded.

Held: "Muse Spark 1.3 Minimal" (minimal is not on the fixed effort vocabulary).

Checks: local replay database, dry-run 49 VALID, commit 49 VALID, second
commit 49 SKIPPED.
