# Epoch AI benchmark runs, 2026-10-07

Batch: `data/batches/evaluator-epoch-ai-2026-10-07.json`, built by
`build_batch.py <local replay database>`.

## Sources

- `gpqa_diamond.csv`, `swe_bench_verified.csv`, `simpleqa_verified.csv`,
  `benchmark_metadata.csv`, `README.md`: from https://epoch.ai/data/benchmark_data.zip
  (CC BY 4.0), fetched 2026-10-07 (zip sha256 in `benchmark_data.zip.sha256`).
  The Wayback copy in `archive.txt` is byte-identical.
- Epoch splits its data into "Epoch AI internal runs" and "External runs"
  (epoch.ai/benchmarks/use-this-data). Only internal-run files are used; the
  `_external` files collect other people's numbers and are not primary.
- Rows are `independent`, evaluator `epoch-ai` (new evaluator organization).
  Epoch is not Artificial Analysis and relays no Hugging Face scores.

## Mapping

- Versions (owner decision D5): `Diamond — Epoch AI harness`,
  `Verified — Epoch AI harness`, `Original — Epoch AI harness` (SimpleQA
  Verified), released with each dataset.
- Score: the file's designated score column ("Best score (across scorers)",
  per `benchmark_metadata.csv`), a fraction from 0 to 1. `score_raw` keeps it
  as published; `score_value` is the same value times 100 (exact decimal
  shift) to match the Registry's percent metrics.
- `run_ref` is Epoch's run id. `evaluated_at` is the run's "Started at" time
  where given. `reported_at` is the data's "Updated" date, 2026-10-07 (owner
  decision D4).
- Reasoning label is the model-version suffix when it is on the fixed effort
  vocabulary (max, xhigh, high, medium, low, none); otherwise empty.

## Result: 188 rows included

GPQA Diamond 107, SimpleQA Verified 57, SWE-bench Verified 24.

Held (252): models not in the Registry or dated builds not shown to be the
Registry model, and 30 rows whose setting is a token budget (`_16K`, `_32K`)
or `minimal`, which are not on the fixed effort vocabulary. A model is also
held when Epoch's release date is more than a month from the Registry's; none
were. `mapping.json` has every row.

## Checks

Local replay database: dry-run 194 VALID, commit 194 VALID, second commit 194
SKIPPED.
