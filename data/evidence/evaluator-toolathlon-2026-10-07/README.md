# Toolathlon leaderboard, 2026-10-07

> Update (same day): the batch was rebuilt after `evaluator-new-models-2026-10-07` added 14 models (GPT-4.1 mini/nano, GPT-5, GPT-5 mini/nano, GPT-5.4 mini/nano, Claude Opus 4.1, Grok 4, DeepSeek-V3.2, MiniMax M2, GLM-4.5, GLM-4.5-Air, GLM-4.6). It now holds 37 result rows instead of 33; only rows were added. `mapping.json` has the current status of every entry.

Batch: `data/batches/evaluator-toolathlon-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `leaderboard.md`.

## Sources

- `leaderboard.md`: https://toolathlon.xyz/docs/leaderboard.md, fetched
  2026-10-07. The Wayback snapshot in `archive.txt` is byte-identical.
- The board marks rows "independently evaluated by us" with a badge. Only those
  rows are used (`independent`, evaluator `toolathlon-authors`). Rows without
  the badge link to the developer's own report and are skipped (owner decision
  D3: the developer's report is the better source for those).

## Mapping

- The current table is Toolathlon-Verified (the Registry's `Verified` version);
  the archived table below it is the Registry's `Original` version. Both are
  run by the maintainers with the default harness, so the existing versions are
  used rather than new harness versions.
- Score is Pass@1, the board's headline score and the Registry's existing
  Toolathlon metric. Pass@3, Pass^3, turns and tool calls are not recorded.
- `reported_at` is each row's date. Reasoning labels are the bracketed or
  suffixed text on the board ("Max" is new, migration 0020).
- † marks a single evaluation (Claude Opus 4.7, 52.8; kept in `score_raw`).

## Result: 33 rows included

Skipped (5): the same score is already in the Registry from the developer's
report quoting this board (GLM-5.3-Flash, Muse Spark 1.1, Inkling, Inkling-Small,
Gemini 3.5 Flash on Original). 14 more rows are submitted, not maintainer-run.

Held (24): models not in the Registry or dated builds not shown to be the
Registry model (DeepSeek V4 Pro 0813, V4 Flash 0731), and Claude Opus 4.6 on
Original, which ran with the Claude Agent SDK instead of the default harness.
`mapping.json` has every row.

## Checks

Local replay database plus migration 0020: dry-run 33 VALID, commit 33 VALID,
second commit 33 SKIPPED.
