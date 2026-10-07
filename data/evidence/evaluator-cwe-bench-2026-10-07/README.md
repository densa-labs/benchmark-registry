# CWE-bench v1 (Collinear AI), 2026-10-07

Batch: `data/batches/evaluator-cwe-bench-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `page.html`
(https://cwe-bench.com/, fetched 2026-10-07; the Wayback snapshot in
`archive.txt` shows the same v1 table; the pages differ only in a countdown).

- The held-out set "is private to Collinear and is not available to any
  external organization", so Collinear runs every model: `independent`,
  evaluator `collinear-ai`. Each model runs "at high reasoning" (label `high`),
  four rollouts per task.
- Score: deterministic programmatic pass@1, the Registry's CWE-bench metric.
  Pass@4 and the judge-panel scores are not recorded.
- One version per harness (owner decision D5): `1 — OpenCode`, `1 — Codex`,
  `1 — Claude Code`, released with v1 on 2026-09-25. No per-row date:
  `reported_at` is the archive date (owner decision D4). The v0 table is not used.

Result: 8 rows. Skipped: Gemini 4 Argon (68, already held from Google's report
of this board). Held: DeepSeek-V4.1-Flash, Hy4 Preview (not in the Registry).

Checks: local replay database, dry-run 12 VALID, commit 12 VALID, second
commit 12 SKIPPED.
