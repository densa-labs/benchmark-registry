# FrontierSWE V2 leaderboard (Proximal), 2026-10-07

Batch: `data/batches/evaluator-frontierswe-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `board.json` (the entries
embedded in https://www.frontierswe.com/, fetched 2026-10-07, with the page's
sha256; the Wayback snapshot in `archive.txt` shows the same scores).

- Score: the board's default "mean@5" view (`abs.mean.overall` in the page
  data), the value the Registry already holds for Gemini 4 Argon (55.0 =
  54.96 rounded). The best@5 and worst@5 views and costs are not recorded.
- Proximal runs every model in its own "proximus" harness, 5 trials per task,
  20-hour budget: `independent`, evaluator `proximal`.
- No per-row date: a dated snapshot version `2 — October 2026 evaluation`,
  released on the archive date, as the existing September version (owner
  decision D4).

Result: 17 rows. Skipped: Gemini 4 Argon (already held from Google's report of
this board). Held: Qwen3.8-Max-0902 and DeepSeek V4 Flash Vision Exp (builds
not in the Registry).

Checks: local replay database, dry-run 19 VALID, commit 19 VALID, second
commit 19 SKIPPED.
