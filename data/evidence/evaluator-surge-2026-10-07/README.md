# Surge AI leaderboards, 2026-10-07

> Update (same day): the batch was rebuilt after `evaluator-new-models-2026-10-07` added 14 models (GPT-4.1 mini/nano, GPT-5, GPT-5 mini/nano, GPT-5.4 mini/nano, Claude Opus 4.1, Grok 4, DeepSeek-V3.2, MiniMax M2, GLM-4.5, GLM-4.5-Air, GLM-4.6). It now holds 74 result rows instead of 73; only rows were added. `mapping.json` has the current status of every entry.

Batch: `data/batches/evaluator-surge-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `riemann-bench.html` and
`chartography.html` (surgehq.ai/benchmarks/<name>, fetched 2026-10-07; the
Wayback snapshots in `archives.json` show the same rows). Uses migration 0020
labels (`Adaptive/Max`, `Medium`, `Thinking on` are new).

Surge writes "We evaluate AI models" on these pages; rows are `independent`,
evaluator `surge-ai`. The boards have no per-row date, so each board becomes a
dated snapshot version, `October 2026 leaderboard`, released on the archive
date, as the existing September versions were (owner decision D4). Reasoning
labels are the board's bracketed setting without the word "reasoning".

## Result: 73 rows included

Riemann-bench 38, Chartography 35 (see `mapping.json`).

Skipped: Gemini 4 Argon on Chartography (71.6), already held from Google's
report of this board. Held: models not in the Registry or experimental/preview
builds (DeepSeek V4.1 Flash, V4 Flash Vision, V4 Pro preview, Hy4 Preview,
Gemini 3.5 Flash-Lite, Qwen 3.8 Flash, Qwen 3.5 Plus, Grok 4.3, DeepSeek V3.2)
and the "Minimal" setting.

## Checks

Local replay database: dry-run 75 VALID, commit 75 VALID, second commit 75
SKIPPED.
