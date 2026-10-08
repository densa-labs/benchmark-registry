# Claude Haiku 5.5, 2026-10-08

Batch: `data/batches/claude-haiku-5-5-2026-10-08.json`.

- **Model:** Claude Haiku 5.5, Registry No. 20018 (next Anthropic sequence; the
  newest release, so no exception), released 2026-10-07 per
  https://www.anthropic.com/claude-haiku-5-5 ("October 7, 2026"; model ID
  `claude-haiku-5-5`).
- **Developer rows** (9, `self-reported`, evaluator `anthropic`, label `max`)
  from the Claude Haiku 5.5 System Card (sha256 in `system-card.sha256`),
  Table 8.1.A and §8.4–8.13, whose standard configuration is "adaptive thinking
  at max effort": SWE-Bench Pro 64.8, SWE-bench Multilingual 83.7, HLE no tools
  45.9 and with tools 57.4, Terminal-Bench 4.0 39.2, Terminal-Bench-Science 0.1
  20.6, GMMLU 87.8, MILU 87.6, SpatialBench Verified 67.7. The launch page is
  added as a same-run citation where it shows the same number.
- **Evaluator rows** (6, `independent`): FrontierSWE V2 43.77 (mean@5, Proximal's
  board; the system card quotes it as 43.8, so it is not added twice) and
  CursorBench 4.0 at five effort levels (Cursor's board). Both boards were
  updated after the 2026-10-07 snapshots; the Wayback copies in
  `archives.txt` show these rows.
- **Not added:** GDPval-AA and AA-Briefcase (Artificial Analysis, never a
  source), OSWorld 2.1 offline subset (no OSWorld 2.1 version in the Registry
  yet), FrontierCode, ProgramBench, DRACO, WANDR, OfficeQA, PhysicianBench,
  HealthBench Professional, BenchCAD subset and the life-science tasks
  (benchmarks or versions the Registry does not hold), Chartography (Anthropic's
  internal grading run, not Surge's board). No other evaluator board listed
  Haiku 5.5 when checked.
