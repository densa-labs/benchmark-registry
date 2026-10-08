# Terminal-Bench 4.0 leaderboard, 2026-10-07

Batch: `data/batches/evaluator-terminal-bench-2026-10-07.json`, built by
`build_batch.py` from `board.json`.

## Sources

- `board.json`: the 35 leaderboard entries embedded in https://www.tbench.ai/
  (the leaderboard URL redirects there), fetched live on 2026-10-07 and in the
  Wayback Machine snapshot saved for this batch
  (web.archive.org/web/20261007114328/https://www.tbench.ai/). Both copies have
  the same entry ids and scores.
- Who ran it: the Terminal-Bench 4.0 post (tbench.ai/news/terminal-bench-4-0)
  describes "our leaderboard runs", a model's "leaderboard run", the settings
  the team chose for it, and grants that fund "the leaderboard experiments". So
  the rows are `independent`, evaluator `terminal-bench-team`, even where the
  agent harness belongs to the model's developer.

## Mapping

- Each entry has a stable id: `run_ref` is `tbench-leaderboard:<id>`.
  `reported_at` is the entry's date; `reasoning_level` is its
  `reasoning_effort` (all labels already exist).
- One version per agent harness (owner decision D5), released with the 4.0
  dataset on 2026-08-28: `4.0 — Claude Code`, `4.0 — Codex`,
  `4.0 — Grok Build`, `4.0 — mini-swe-agent`, `4.0 — Muse Code`. The existing
  `4.0` version (developer-reported rows) is unchanged.
- `score_value` and `score_raw` are the accuracy in the page data (two
  decimals); the page displays it rounded to one decimal with a 95% interval.

## Result: 34 rows included, 1 held

Held: `Qwen3.8-Max-0902` (Claude Code, 26.97), because a dated `-0902` build is
not shown to be the Registry's Qwen3.8-Max (released 2026-08-02).

Only the 4.0 board is in the page data; older boards (2.0, 2.1) are not
published there and are not part of this batch. Terminal-Bench Science is not
touched (owner decision pending).

## Checks

Local replay database plus migration 0020 and the earlier batches: dry-run 40
VALID, commit 40 VALID, second commit 40 SKIPPED.
