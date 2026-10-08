# AutomationBench official leaderboard (Zapier), 2026-10-07

Batch: `data/batches/evaluator-automationbench-2026-10-07.json`, built by
`build_batch.py <local replay database>`.

## Sources

- https://zapier.com/benchmarks shows ten rows and loads the full 1.0.6 table
  (121 rows) from a content-hashed page module; `leaderboard-module.mjs` is that
  module, fetched 2026-10-07. `archive.txt` is a byte-identical Wayback copy of
  the module; `page-archive.txt` is the page's Wayback snapshot (the primary
  source's archive).
- The page says leaderboard scores "run against a held-out private evaluation
  set"; Zapier, the maintainer, runs every model. Rows are `independent`,
  evaluator `automationbench-authors`. The board has no per-row date, so
  `reported_at` is the archive date (owner decision D4).

## Result: 77 rows included

Skipped (26): runs the Registry already holds from a developer report quoting
this board (OpenAI's GPT-6 and GPT-5.6 rows, Gemini 4 Argon).

Held (18):
- Rows whose score includes a fallback model: "Claude Sonnet/Opus 5.5 (default
  fallbacks, …)" and "Claude Fable 5.1 (with Opus 5 Fallback)", per the page's
  own notes.
- "Gemini 3.5 Flash (Minimal)" and "Between tools" (off the fixed vocabulary).
- Models not in the Registry (Gemini 3.5 Flash Lite, Kimi K2.7 Code), and
  GLM 5.2, see below.

## Needs review (existing data, not changed here)

- The Registry's GLM-5.2 row in version `1.0.6` (26.17,
  github.com/zapier/AutomationBench) is the README's **public** 600-task score,
  while this board and the other `1.0.6` rows are the **private** held-out set.
  The board's GLM 5.2 private score (7.76) is held until that row is corrected
  or moved to a public-set version.
- The Registry's Claude Sonnet 5.5 (44.7) and Opus 5.5 (40) rows, from
  Anthropic's system cards citing this benchmark, may include fallback-model
  tasks the board now marks; worth checking against the cards.

## Checks

Local replay database: dry-run 77 VALID, commit 77 VALID, second commit 77
SKIPPED.
