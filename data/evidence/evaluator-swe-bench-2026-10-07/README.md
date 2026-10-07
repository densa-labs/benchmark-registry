# SWE-bench maintainer runs (mini-SWE-agent), 2026-10-07

Batch: `data/batches/evaluator-swe-bench-2026-10-07.json`, built by
`build_batch.py` from the pinned inputs in this folder. First batch of the
evaluator-source intake round (owner decisions of 2026-10-07).

## Sources

- `leaderboards.json`: the mini-SWE-agent entries of the Verified and
  Multilingual boards from
  `SWE-bench/swe-bench.github.io@193160a463a435d05cf44a1fa9dc5eac832113c3:data/leaderboards.json`
  (full file sha256 `83cd949a9582f4dd68b0a07148cd86ff0eae6a05b0f2d2298a8f3717baf89d2d`;
  `per_instance_details` removed here).
- `meta/`: each entry's `metadata.yaml` from
  `SWE-bench/experiments@40f164d5b8f1d249bf95a6df8b74b577fd8e519d`. The batch
  checks every board score against its metadata score.
- Who ran it: swebench.com/verified.html says the maintainers "evaluate all LMs
  using mini-SWE-agent" in a bash-only setting; the experiments README says the
  verified folder "includes the mini-SWE-agent bash-only runs". So these rows
  are `independent`, evaluator `swe-bench-team`.

## Mapping

- Versions: `Verified — mini-swe-agent` (board added 2025-07-12, commit
  2212eb9e) and `Multilingual — mini-swe-agent` (tab made public 2026-02-24,
  commit f28b73fd). One version per board, as the maintainers present it; the
  mini-SWE-agent release is part of `run_ref` (the submission folder).
  Not merged with `Verified — bash-only harness`, which is Thinking Machines'
  own setup and not shown to be the same.
- `run_ref`: `swe-bench-experiments:evaluation/<split>/<folder>`.
- `reported_at`: the board's per-entry date. `reasoning_level`: the board's
  `reasoning_effort`, or empty when not stated.
- Primary source: the submission folder; additional citation: the board page
  (same run). Archive: the folder at the pinned experiments commit.
- `mapping.json` lists every mini-SWE-agent entry and whether it is included.

## Result: 37 rows included, 23 held

Held because the model is not in the Registry yet (owner decision D1: add new
models; they go in one model batch after all evaluator sources are read):
GPT-4o (2024-11-20), GPT-4.1 mini, GPT-5, GPT-5 mini, GPT-5 nano, GPT-5.1,
GPT-5.1 Codex, GPT-5.2 Codex, Llama 4 Maverick, Llama 4 Scout,
Qwen3-Coder 480B-A35B, Qwen2.5-Coder 32B, Kimi K2 Instruct, Kimi K2 Thinking,
GLM-4.5, GLM-4.6, MiniMax M2, DeepSeek V3.2 (three entries, one tagged
`deepseek-v3.2-reasoner`).

Not included:

- `20260901_mini-v2.4.2_gemini-3-5-flash` is in the experiments repository but
  not on the published board yet.
- Developer-submitted entries on the full board (decision D3) for Registry
  models do not match the developer's own published number, so they cannot be
  attached as a citation, and they are not proven to be different runs. Held for
  review, not ingested:
  Claude Opus 4 `20250522_tools_claude-4-opus` 73.2 vs 72.5 (anthropic.com/news/claude-4);
  Claude Sonnet 4 `20250522_tools_claude-4-sonnet` 72.4 vs 72.7;
  Claude 3.7 Sonnet `20250224_tools_claude-3-7-sonnet` 63.2 vs 62.3.
- Third-party agent products (OpenHands, Warp, TRAE, Refact and similar) and
  "Multiple"/"Undisclosed" model entries: out of scope for this batch.

## Checks

Local replay database plus this batch: dry-run 40 VALID, commit 40 VALID,
second commit 40 SKIPPED. `validate_data.py` 0 errors. `check_replay.py`
reports the expected +2 versions and +37 results until production is applied
and `expected-counts.json` is updated.
