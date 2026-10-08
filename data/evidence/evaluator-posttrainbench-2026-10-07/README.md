# PostTrainBench leaderboard, 2026-10-07

Batch: `data/batches/evaluator-posttrainbench-2026-10-07.json`, built by
`build_batch.py <local replay database>` from `extracted.json` (read with node
from `scores-v1.2.js`, `scores.js` (v1.1) and `config.js`, the data behind
https://posttrainbench.com/, fetched 2026-10-07; `archives.txt` lists
byte-identical Wayback copies of both score files and the page).

- Score: each agent's published weighted average (`aggregatedScores.avg`,
  averaged over `n` runs). Per-benchmark cells, standard deviations and times
  are not recorded.
- The PostTrainBench team runs the agents: `independent`, evaluator
  `posttrainbench-team`. The external Locus entry (run by Intology) is skipped.
- One version per results version and scaffold (owner decision D5):
  `1.2 — <scaffold>` (released 2026-09-30) and `1.1 — <scaffold>` (released
  2026-07-28, per the page changelog; the existing `1.1 — OpenCode` is reused).
- `reported_at` is the page's "Updated Oct 6" date (owner decision D4);
  reasoning labels are the agent table's `reasoningEffort` (Max, xHigh, High).

Result: 27 rows (v1.2 16, v1.1 11). Held: Claude Fable 5 and Fable 5.1 in both
versions, whose GPQA cells fell back to Opus 4.8 / Opus 5 per the page notes.

Checks: local replay database, dry-run 35 VALID, commit 35 VALID, second
commit 35 SKIPPED.
