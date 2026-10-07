# Scale AI: SWE Atlas and HLE text only, 2026-10-07

Batch: `data/batches/evaluator-scale-atlas-hle-text-2026-10-07.json`, built by
`build_batch.py <local replay database>`. Uses migration 0020 labels.

## Sources

`boards.json` holds the entries embedded in each page, fetched live on
2026-10-07 and in the Wayback snapshot saved for this batch (same scores):

- labs.scale.com/leaderboard/sweatlas-qna (SWE Atlas Codebase QnA)
- labs.scale.com/leaderboard/sweatlas-refactoring (SWE Atlas Refactoring)
- labs.scale.com/leaderboard/humanitys_last_exam_text_only

The SWE Atlas pages say "We ran a suite of frontier closed and open coding
models", with mini-swe-agent and, for top models, their native scaffolds. The
HLE page says Scale evaluates each model. Rows are `independent`, evaluator
`scale-ai`. `reported_at` is the archive date (owner decision D4).

## Versions

- SWE Atlas: one version per harness named in each row (owner decision D5):
  `Codebase QnA — Public; <harness>` (the existing mini-swe-agent version plus
  Claude Code and Codex), released 2026-03-04 (scale.com/blog/swe-atlas), and
  `Refactoring — <harness>` (Claude Code, Codex, mini-swe-agent, Gemini CLI),
  released 2026-05-07 (scale.com/blog/swe-atlas-complete). The page notes that
  mini-swe-agent's step limit rose from 250 to 500 for newer models on
  2026-07-28; that is not split out.
- HLE: `Text only — Scale AI evaluation`, released with the finalized set on
  2025-04-03, as `Full set — Scale AI evaluation`.
- Rows marked `*` on SWE Atlas scored refusals as zero, per the page; the score
  is still the model's own and is kept.

## Result: 68 rows included

Codebase QnA 22, Refactoring 17, HLE text only 29.

Held: SWE Atlas Test Writing (its release date is not published), the
"Muse Spark" QnA row with no harness named, and HLE models not in the Registry
or with dated builds not shown to be the Registry model. SWE-Bench Pro V2 is not
included: its scores need a closer reading of the metric first.

## Checks

Local replay database: dry-run 76 VALID, commit 76 VALID, second commit 76
SKIPPED.
