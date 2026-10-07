# Scale AI SEAL leaderboards, 2026-10-07

Batch: `data/batches/evaluator-scale-2026-10-07.json`, built by
`build_batch.py` (pass the local replay database so MCP Atlas rows can be
compared with what the Registry holds). Needs migration 0020 (new reasoning
labels) first.

## Sources

`boards.json` holds the leaderboard entries embedded in each page, as fetched
live on 2026-10-07 and as archived in the Wayback Machine, with the sha256 of
each fetched page. A row is used only when the live page and the archive show
the same score.

| Board | Live page | Archive (reported_at) |
|---|---|---|
| SWE-bench Pro, public and private | labs.scale.com/leaderboard/swe_bench_pro | 2026-10-07 snapshot, saved for this batch |
| Humanity's Last Exam | labs.scale.com/leaderboard/humanitys_last_exam | 2026-10-03 snapshot |
| MCP Atlas | labs.scale.com/leaderboard/mcp_atlas | 2026-09-21 snapshot |

The boards have no per-entry date. Each entry's `createdAt` field is not used:
on MCP Atlas it predates some models' releases. `reported_at` is the archive
date (owner decision D4).

Who ran it: the SWE-bench Pro page says all models were run by Scale, with
uncapped cost and a 250-turn limit, and marks rows run with the mini-swe-agent
harness with `*`. The HLE page says each model is evaluated by Scale on all
public questions. All rows are `independent`, evaluator `scale-ai`.

## Versions (owner decision D5)

- SWE-bench Pro: `Public — Scale AI SWE-Agent`, `Public — Scale AI mini-swe-agent`,
  `Private — Scale AI SWE-Agent`, `Private — Scale AI mini-swe-agent`. Release
  date is the dataset's (2025-09-19), as other harness versions do.
- HLE: `Full set — Scale AI evaluation`, released 2025-04-03 (the page's
  "HLE has been finalized to 2,500 questions" update).
- Reasoning labels are the text the board shows in brackets or as a model-name
  suffix; five new ones are added by migration 0020.

## Result: 52 rows included

- SWE-bench Pro: 22 rows (public 13, private 9).
- HLE: 29 rows.
- MCP Atlas: 1 row, GPT-5.2 (xhigh) 67.6, which the Registry did not hold.
  The 28 Registry models already taken on 2026-09-24 show the same score and
  are skipped (decision D6).

Held (47): models not in the Registry or whose identity is not settled, for the
new-model batch. Examples: GPT-5, GPT-5 Pro, GPT-5.1, GPT-5.2 Codex,
GPT-5.4 Pro, Claude Opus 4.1, GLM-4.5, GLM-4.6, Kimi K2, Qwen3-Coder,
DeepSeek V3.2, o1, Llama 4 Maverick. Dated Gemini 2.5 previews (05-06, 06-05)
and "Gemini 2.5 Flash Preview (May 2025)" are held because they may be
separately released checkpoints (registry-numbering identity rule).
`Qwen3.8-2.4T-A95B` is held because it is not shown to be Qwen3.8-Max.
`mapping.json` has every row and its status.

## Checks

On the local replay database plus migration 0020: dry-run 58 VALID, commit 58
VALID, second commit 58 SKIPPED. `validate_data.py` 0 errors; its new
duplicate warnings are the same model at two reasoning settings on HLE.
