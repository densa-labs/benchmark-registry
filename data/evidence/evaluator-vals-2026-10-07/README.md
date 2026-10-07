# Vals AI leaderboards, 2026-10-07

> Update (same day): the batch was rebuilt after `evaluator-new-models-2026-10-07` added 14 models (GPT-4.1 mini/nano, GPT-5, GPT-5 mini/nano, GPT-5.4 mini/nano, Claude Opus 4.1, Grok 4, DeepSeek-V3.2, MiniMax M2, GLM-4.5, GLM-4.5-Air, GLM-4.6). It now holds 589 result rows instead of 523; only rows were added. `mapping.json` has the current status of every entry.

Batch: `data/batches/evaluator-vals-2026-10-07.json`, built by
`build_batch.py <local replay database>`.

## Sources

- `views/<page>.json`: the "overall" table of 11 Vals AI benchmark pages
  (vals.ai/benchmarks/<page>), taken from the data file each page loads
  (`/_astro/benchmark_view_<page>.<hash>.json`, content-hashed; the hash and
  sha256 are kept). Fetched 2026-10-07.
- `archives.json`: a Wayback snapshot of each page saved for this batch. Each
  archived page loads the same content-hashed data file, so it shows the same
  scores.
- Vals runs every model itself: rows are `independent`, evaluator `vals-ai`.
- Only the score is recorded. Cost, latency and the other columns are details
  of the run (owner decision, 2026-10-07).
- `reported_at` is the page's "Updated" date.

## Versions

| Page | Registry version |
|---|---|
| vals_index | `2.1` (existing) |
| fabv2 | `2 — October 2026 evaluation` (new; the existing September version came from Google's report) |
| hlab | `October 2026 evaluation` (new) |
| vibe-code | `1.1 — <harness>, October 2026 evaluation` for OpenHands, Claude Code, Codex, Factory, Cursor CLI |
| gpqa | `Diamond — Vals AI harness` (mean of zero-shot and few-shot CoT, per the page) |
| mmlu_pro | `Original — Vals AI harness` |
| mmmu | `Vals AI harness` (MMMU-Pro) |
| swebench | `Verified — Vals AI mini-swe-agent` (the page's bash-only harness) |
| terminal-bench-2 / -2-1 | `2.0 — Vals AI Terminus 2`, `2.1 — Vals AI Terminus 2` |
| terminal-bench-4 | `4.0 — Vals AI mini-swe-agent` |

New versions follow owner decision D5. Release dates follow the existing
pattern: the dataset's release for harness versions, and the page's update date
for the October evaluations (as the Gemini 4 Argon batch did for September).
Terminal-Bench Science is not touched.

## Result: 523 rows included

Per page: vals_index 27, fabv2 48, hlab 48, vibe-code 66, gpqa 62, mmlu_pro 63,
mmmu 50, swebench 53, terminal-bench 2.0 35, 2.1 45, 4.0 26.

Held (420):

- Models not in the Registry, or dated builds not shown to be the Registry
  model (for example DeepSeek V4 Pro 0813, Muse Spark 1.3 Max, Qwen3-Max
  without a date, Gemini 2.5 Pro GA).
- 13 rows whose published score includes tasks another model answered after a
  refusal, as each page's own notes say (Claude Opus 5.5, Sonnet 5.5, Fable 5,
  Fable 5.1 and Opus 5 on some boards).
- 6 rows run inside a vendor agent (Claude Code, Codex, Factory) on boards whose
  stated harness is different.

Skipped (4): Gemini 4 Argon on Vals Index, Finance Agent, HLAB and Vibe Code
Bench, which the Registry already holds from Google's launch report quoting
these same Vals runs.

## Checks

Local replay database plus the earlier batches: all records VALID, second
commit all SKIPPED.
