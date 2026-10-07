# Mercor APEX leaderboards, 2026-10-07

Batch: `data/batches/evaluator-mercor-2026-10-07.json`, built by
`build_batch.py <local replay database>`.

## Sources

- `pages/<board>.json`: the leaderboard data embedded in 14 mercor.com/apex
  pages (13 open-source benchmark boards plus APEX-Agents), fetched
  2026-10-07, with each page's sha256.
- `methodology.json`: Mercor's "How Mercor runs benchmarks" table, which
  gives each board's harness, number of runs, metric and task count.
- `archives.json`: a Wayback snapshot saved for each page; each shows the same
  rows and scores, except Terminal-Bench 2.1, whose snapshot holds 17 of the
  42 rows (`archived_model_ids`); the other 25 are held.
- Mercor runs every model itself: `independent`, evaluator `mercor`. Only the
  Pass@1 score is recorded (APEX-Agents also shows a mean score; its canonical
  "loop truncated tools" harness value is used). No per-row date:
  `reported_at` is the archive date (owner decision D4).

## Versions (owner decision D5)

One version per board for Mercor's own setup, released with each dataset:
`Diamond — Mercor single-shot`, `Text only — Mercor single-shot` (HLE,
2,158 public text questions), `Verified — Mercor mini-swe-agent, 1000 steps`,
`Multilingual — Mercor mini-swe-agent, 1000 steps`, `2.1 — Mercor Terminus 2`,
`4.0 — Mercor mini-swe-agent`, `1,730 questions — Mercor single-shot`
(MMMU-Pro), `Original — Mercor single-shot` (MMLU-Pro),
`Descriptive and reasoning — Mercor single-shot` (CharXiv, all 5,000
questions), `1.1 — Mercor mini-swe-agent, 500 steps` (DeepSWE),
`130-question subset — Mercor web research agent` (BrowseComp),
`MM — Mercor single-shot` (MedXpertQA), `Codebase QnA — Mercor
mini-swe-agent, 250 steps` (SWE Atlas). APEX-Agents is Mercor's own benchmark:
its rows use the existing `Original` version.

## Result: 486 rows included

HLE 46, DeepSWE 46, APEX-Agents 45, MMLU-Pro 39, GPQA 38, CharXiv 36,
BrowseComp 35, MedXpertQA 35, SWE-bench Verified 34, MMMU-Pro 34,
Multilingual 33, SWE Atlas 33, Terminal-Bench 4.0 19, 2.1 13.

Held (96): models not in the Registry or dated builds (DeepSeek V4 Pro 0813,
V4.1 Flash, GPT-5.6 Sol "Pro", Kimi K2.7 Code, ...), 25 Terminal-Bench 2.1
rows missing from the archive, and two rows with effort "auto".

Not used: GDPval and SciCode (Mercor reports a mean score, not the Registry's
metric), τ³-Banking (the τ² grading version is not stated), FrontierSWE v2
(taken from Proximal directly), Harvey LAB (the page does not say who ran it),
AA-LCR (an Artificial Analysis benchmark), and Mercor's held-out "extended"
sets (new datasets).

## Checks

Local replay database: dry-run 510 VALID, commit 510 VALID, second commit 510
SKIPPED.
