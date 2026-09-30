# Post-launch model and benchmark coverage — September 30, 2026

The user requested Claude Sonnet 5.5 and GPT-6.1 Sol with benchmark results, plus coverage for every existing model without results. The production audit found only Claude 3.7 Sonnet lacking results. All three now have source-backed benchmark rows in staging and production.

| Model | Registry No. | Results added | Benchmark coverage |
| --- | --- | ---: | --- |
| GPT-6.1 Sol | 10015 | 25 | DeepSWE 1.1, GDP.pdf, AutomationBench 1.0.6, OSWorld 2.0 offline v2026.08.08 partial, Terminal-Bench Science 0.1; low/medium/high/xhigh/max separately |
| Claude Sonnet 5.5 | 20016 | 14 | Terminal-Bench 4.0 and Science 0.1, DeepSWE 1.1, SWE-bench Pro Public and Multilingual, HLE with/without tools, CursorBench 4.0 at five efforts, Toolathlon Verified, AutomationBench 1.0.6 |
| Claude 3.7 Sonnet | 20001 | 3 | GPQA Diamond with/without extended thinking, SWE-bench Verified without extended thinking |

The new model numbers append to the verified OpenAI and Anthropic sequences. Claude 3.7 Sonnet retains its published number, deprecated status, release metadata and original publication date. No schema, numbering, API or ingestion feature changed.

## Sources and evaluation distinctions

- [OpenAI launch article](https://openai.com/index/introducing-gpt-6-1-sol/): the five charts' accessible SVG labels provide exact scores and efforts. Captions identify versions, including the OSWorld offline release and partial reward. OpenAI is the evaluator; results describe its research/API evaluations, which may differ from ChatGPT's production prompts and tools. [Dated system-card addendum](https://deploymentsafety.openai.com/gpt-6-1-sol/respecting-auto-review) establishes September 29 availability.
- [Anthropic launch](https://www.anthropic.com/claude-sonnet-5-5) and [September 28 system card](https://www.anthropic.com/claude-sonnet-5-5-system-card), capabilities sections 8.1–8.15: preserve explicit max effort and the named versions. Anthropic evaluates its internal results; Cursor and Zapier independently evaluate CursorBench and AutomationBench respectively. Terminal-Bench 4.0 uses Claude Code bare mode, cached resources without network egress and default safety fallbacks; Science 0.1 uses the same setup. Toolathlon uses Anthropic's documented setup patches and pinned dependencies. These details remain accessible through each result's source.
- [Cursor's evaluator leaderboard](https://cursor.com/evals): confirms all five Sonnet 5.5 CursorBench 4.0 efforts and scores. The system card identifies the same Cursor evaluation and supplies its dated publication; the batch explicitly confirms that both citations describe the same run.
- [Claude 3.7 Sonnet release](https://www.anthropic.com/news/claude-3-7-sonnet), its linked benchmark table and SWE-bench appendix: GPQA 68.0% without extended thinking and 78.2% at 64K extended thinking; SWE-bench 62.3% uses the full 500-task denominator, counting infrastructure failures as failures. The 70.3% high-compute score uses a 489-task subset and is not silently substituted. Parallel-test-time GPQA scores are likewise not conflated with single-attempt thinking.

Only results whose published identity and metric map to verified existing versions were added. This is coverage of the three uncovered models, not a claim to import every evaluation published about them. New families/variants such as FrontierCode, GDPval-AA, AA-Briefcase, OSWorld 2.1, Chartography, SWE-bench Multimodal and HealthBench Professional were not guessed into neighboring versions. Claude 3.7's MMMLU is not MMLU; original TAU-bench is not τ³-bench.

## Write and read verification

The controlled ingestor validated both tracked batches before mutation. Existing disposable-remote rollback verification passed before each canonical commit. Staging received the records first and published its affected KV objects; production then atomically ingested both models and all 42 results and published its read model. Production dry-run afterward returned 44 exact duplicates, all SKIPPED, with no mutation.

The local replay test migrates an empty database, ingests the existing seed and launch data, verifies dry-run does not write, preserves every previous model/result row, checks all three result counts, verifies no uncovered models remain and confirms exact duplicate replay.

Live production APIs expose 25, 14 and 3 sourced rows respectively with zero D1 queries/rows. Read-only database checks find zero uncovered models in either environment. See [live verification](post-launch-benchmark-verification.json), [production publication](post-launch-models-production.json), [staging publication](post-launch-models-staging.json) and the before/after empty-model JSON snapshots.

The sitemap is now 820 canonical URLs: launch 808, plus two model pages and ten approved exact-result URLs. Thirty-two additional result rows remain outside exact-result inventory under the frozen ambiguity rules; all remain visible on their model and benchmark pages. No ambiguity rule was weakened.

Data: `data/batches/post-launch-models-2026-09-30.json` and `data/batches/post-launch-benchmarks-2026-09-30.json`.
