# Gemini 4 Argon ingestion handover

Published Gemini 4 Argon as Registry No. 30011 with all 19 scores from the supplied screenshot, verified against Google DeepMind’s official five-page evaluation report. The model is marked preview because the official September 30 launch describes restricted early availability.

The batch passed staging before production and used the controlled Python ingestor, atomic rollback probes, and incremental materialization. No frontend, Worker, route, schema, or full rebuild changes were made. The user explicitly authorized the selected-metric exception recorded in [AUTHORIZATION.md](AUTHORIZATION.md).

| Environment | Results before → after | Argon results | Sitemap before → after | Public checks |
| --- | --- | --- | --- | --- |
| staging | 927 → 946 | 0 → 19 | 949 → 997 | PASS; zero D1 reads |
| production | 926 → 945 | 0 → 19 | 946 → 994 | PASS; zero D1 reads |

| Registry No. | Model | Release date | Before | Official source | Visible | Added | Existing | Unresolved | After |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 30011 | Gemini 4 Argon | 2026-09-30 | 0 | [Google evaluation methodology](https://deepmind.google/models/evals-methodology/gemini-4-argon) | 19 | 19 | 0 | 0 | 19 |

Official source exhaustively inspected: YES. All 19 screenshot/official-table results processed: YES. Visible 19 = new 19 + existing 0 + conflicts 0 + unresolved 0. Models with unexplained source-visible results: 0. Competitor scores were excluded.

Added 12 benchmark families, 16 versions, 12 metrics and 6 evaluator organizations. Exact score formatting, reasoning labels, official sources, model/benchmark/company reverse views, search, pagination, exact-result eligibility and sitemap inventory passed public verification. Six local ingestion tests and both disposable remote atomicity probes passed. Replay skipped all 35 records in both environments with zero writes/callbacks; repeated materialization performed zero KV writes and rebuilt zero objects.

| Environment | Previous generation | Published generation | Affected objects rebuilt |
| --- | --- | --- | --- |
| staging | `c09f1b48e3094904b68c4ec31f409ab4` | `cd69fd62423b4d2e8253aacd7e1d2720` | 142 |
| production | `fdcf2a35a6f147498d661e19c07b9ad6` | `04f3ee3fb16243629c1628a82f7c3c9a` | 142 |

Evidence: `argon-evidence.json` records every displayed value, evaluator, mapping, configuration, date basis and outcome. `argon-pending-batch.json` is the immutable committed batch; `argon-validated-batch.json` has identical parsed contents. Public checks and canonical before/after counts are retained per environment.

Known metadata limits: Google omits dataset commits for some evaluations. New source-defined evaluation snapshots preserve the September 2026 scope rather than guessing original dataset release dates. The scores retain Google’s displayed rounding rather than substituting different precision from evaluator leaderboards. The selected-metric override is limited to this batch. No corrections to existing records or global contract changes were made.

Live model: https://benchmarkregistry.org/models/30011

The repository commit includes this handover, the immutable batch, source evidence, and staging/production verification. The final response supplies its commit hash.
