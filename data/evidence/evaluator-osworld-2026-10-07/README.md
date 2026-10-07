# OSWorld-Verified maintainer results, 2026-10-07

Batch: `data/batches/evaluator-osworld-2026-10-07.json`, built by
`build_batch.py <local replay database>` (xlsx read with the stdlib reader in
`xlsx.py`).

## Sources

- `osworld_verified_results.xlsx`: the data file behind the "OSWorld-Verified
  Results" table on https://os-world.github.io/, fetched 2026-10-07. The page
  says these are "official results evaluated by our team under unified
  settings"; self-reported results live in a separate file that is not used.
  The Wayback copy in `archive.txt` is byte-identical.
- Rows are `independent`, evaluator `xlang-lab`.

## Mapping

- Only "General model" rows that use screenshots alone, no extra coding
  actions and a single rollout. Agentic frameworks (a model inside someone
  else's agent) and specialized models are not used.
- One version per step limit, as the maintainers run each model at 15, 50 and
  100 steps: `Verified — 15 steps`, `Verified — 50 steps`,
  `Verified — 100 steps` (dataset released 2025-07-28). The existing `Verified`
  version (developer-reported rows) is unchanged.
- `reported_at` is the row's date (an Excel day number). No reasoning setting is
  stated, so the label is empty.

## Result: 16 rows included

Skipped (2): Kimi K2.6 (73.06) and Qwen3.7-Plus (73.3) match the developer's
own figure at the developer's precision, so they are the same run already held.

Held: models not in the Registry, and `claude-fable-5[1m]` / `claude-opus-5[1m]`,
whose 1M-context setting is not yet a Registry configuration.

## Checks

Local replay database: dry-run 20 VALID, commit 20 VALID, second commit 20
SKIPPED.
