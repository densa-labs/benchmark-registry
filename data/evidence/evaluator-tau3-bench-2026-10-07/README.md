# τ³-bench (Sierra) submissions, 2026-10-07

Batch: `data/batches/evaluator-tau3-bench-2026-10-07.json`, built by
`build_batch.py <local replay database>`. Uses migration 0020 (`enabled` label).

## Sources

- `manifest.json` and `submissions/<dir>.json`: the files behind
  https://taubench.com/leaderboard, from
  `sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/`, fetched
  2026-10-07. `archives.json` maps each used file to a Wayback snapshot saved
  for this batch; every snapshot parses to the same JSON.
- Each file names the submitting organization, the τ² harness version, the
  evaluation date, the reasoning effort and a verification block. Only current
  (non-legacy) `standard` submissions run by Sierra on tau2-bench 1.0.1, with
  unmodified prompts and no omitted questions, are used: `independent`,
  evaluator `sierra-research`.

## Mapping

- `run_ref` is `tau-bench-submissions:<submission directory>`.
- `reported_at` is the later of the submission and evaluation dates (results
  were re-graded after some submissions); `evaluated_at` is the evaluation date.
- Airline, Retail and Telecom use the existing `τ³ — <domain>` versions.
- Banking: the files say banking scores were re-graded under tau2-bench 1.0.1
  and "scores prior to v1.0.1 are not comparable", and runs differ in retrieval
  setting. So banking rows use new versions per retrieval setting,
  `τ³ — Banking, <setting> retrieval, v1.0.1 grading` (released with v1.0.1 on
  2026-07-22), each with a tools configuration.
- Score is pass^1 (`pass_1`), the Registry's existing τ³ metric; pass^2–4 and
  cost are not recorded.

## Result: 46 rows included

Banking 22, Airline 8, Retail 8, Telecom 8.

Held: domains a submission did not run (39), and models not in the Registry or
whose release date in the file differs from the Registry's (Qwen 3.8 Max, file
2026-07-19 vs Registry 2026-08-02; Gemini 2.5 Pro GA; Grok 4 Fast, 4.1 Fast,
4.2). Skipped: two submissions not run by Sierra (Distyl, Northeastern).
Legacy τ²-bench submissions are not used: the Registry has no τ² family.

## Checks

Local replay database: dry-run 51 VALID, commit 51 VALID, second commit 51
SKIPPED.
