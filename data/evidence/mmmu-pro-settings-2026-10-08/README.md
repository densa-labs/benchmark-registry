# MMMU-Pro score settings (2026-10-08)

MMMU-Pro reports three settings. The paper (arXiv 2409.02813, Section 3.1 and
the Table 1 caption) defines the overall score as the average of the Standard
setting with augmented options (usually 10) and the Vision-only setting. The
Standard setting with 4 options is reported only for comparison. An MMMU-Pro
author advised Ivan by email that a bare "MMMU-Pro" usually means the overall
score, but that the registry should keep confirmed overall scores apart from
scores whose setting is not stated. The email is advice, not a source: every
label below rests on the result's own source or the developer's methodology
document for the same evaluation.

The batch `data/batches/mmmu-pro-settings-2026-10-08.json` defines five
settings (`score_setting`) and labels each of the 121 live MMMU-Pro results
(`result_score_setting`). Labels are result metadata outside `result_key`, so
no key, URL or Registry No. changes. The retracted Muse Glimmer 30B row is not
labelled.

Rebuild: `python3 build_batch.py <replay database>` (the database must not yet
hold the labels). All sources were read on 2026-10-08.

## Overall (Standard 10 options + Vision): 5

| Results | Setting source | What it says |
| --- | --- | --- |
| Claude Sonnet 4.6, no tools | System card, Section 2.17.2 (the result's primary source) | Scores are averaged across Standard (10 options) and Vision, each over five runs. |
| Gemini 3 Pro | `deepmind.google/models/evals-methodology/gemini-3-pro`, linked from the launch post | MMMU-Pro averages the Standard (10 options) and Vision settings. |
| Gemini 3 Flash | `deepmind.google/models/evals-methodology/gemini-3-flash` | Same statement, and the scores use no tools. |
| Gemini 3.1 Pro | `deepmind.google/models/evals-methodology/gemini-3-1-pro`, linked from the model card | Same statement. |
| Gemini 3.5 Flash | `deepmind.google/models/evals-methodology/gemini-3-5-flash`, linked from the model card | Same statement. |

The Google methodology links redirect to PDFs on `storage.googleapis.com/deepmind-media/gemini/`.
The Gemini 3 Flash launch post does not link its methodology document; the
document is Google's own evaluation write-up for that model at the same
official path as the others.

## Standard (10 options) only: 2

Muse Spark, no tools and with Python. Meta's evaluation methodology (the
results' primary source) says it evaluates on the MMMU Pro standard set with
10 options.

## Standard (4 options): 60

Every Vals AI row. The Vals page says the benchmark is based on the standard
4-option multiple-choice format, about 1,700 questions from the official
dataset. This is the paper's setting (1), which is not part of the overall
score, so these rows are not comparable with overall scores.

## Not stated: 54

The source gives one MMMU-Pro number and does not say which setting it covers.

- OpenAI: GPT-5.2, GPT-5.4, GPT-5.5 and GPT-5.6 Luna, Sol and Terra (12 rows;
  the pages say only "no tools", "with tools" or "w/ Python").
- Moonshot AI: Kimi K2.5, K2.6 and K3 (5 rows). The model cards say MMMU-Pro
  "follows the official protocol"; that names a protocol, not a setting.
- Qwen3.6-35B-A3B (1 row) and Mistral Small 4 (2 rows, read from the model
  card's chart).
- Mercor (34 rows). Mercor lists 1,730 tasks with up to 10 options. That
  matches the size of one setting, but the page does not say which, so no
  setting is inferred.

## Not used

The Vision setting is defined for completeness; no result is labelled with it.
