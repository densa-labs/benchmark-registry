# UI clarity audit — 2026-10-04

## Existing UI and SEO work

- Model: `app/src/model-pages.tsx` (`ModelDetailPage`). Family/version: `app/src/benchmark-pages.tsx`. Organization: `app/src/company-pages.tsx`.
- Shared tables, metadata, page header, tabs, pagination, navigation and header search: `app/src/ui/components.tsx`; layout and tokens: `app/src/styles.css`. `app/src/navigation.ts` progressively enhances GET forms and links. `app/worker/document.tsx` renders complete HTML on the server and `app/src/main.tsx` hydrates it.
- Scores: `result-score-link.tsx` links evaluations with an exact result URL; other scores are plain text. `model-benchmark-score.tsx` renders directory scores. Benchmark display labels live in `benchmark-names.ts` and `benchmark-link.tsx`.
- `seo/site-wide` is already merged into `main` (4277a76); this branch starts at main 6ac1df6, retaining the SEO work and rollout documentation. Reuse `seo-content.tsx` family results and sentences, `seo-enrichment.ts` checked dates, and `breadcrumbs.tsx` / `breadcrumb-context.ts`. No head, canonical, JSON-LD or sitemap changes planned.

## Recorded facts and gaps

- Reasoning/effort is `results.reasoning_level`, nullable in `ResultRow`, an exact string on each result. It is not a separate model or model attribute. Claude Opus 5.5 is Registry No. 20015. Labels may be longer than low/medium/max and must retain their spelling.
- Harness variants are separate benchmark versions with immutable route slugs. No parent ID exists. Terminal-Bench consistently has exact base versions and `base — variant` labels (e.g. `2.1 — Claude Code`, `2.1 — Terminus-2`). Group only a single unambiguous separator with an existing exact base; preserve unmatched labels as flat entries and all links. Variant release dates can differ from the base; preserve each date.
- Terminal-Bench `Science 0.1` is a **version of terminal-bench**, not a separate family in the launch dataset. Do not relocate or rename it.
- Each result has a primary evidence URL, evaluator names, metric identity, exact score spelling/value, report date and precision. Additional citations and checked timestamps exist in canonical storage. Publisher names and document categories are not stored on result records; evaluators do not necessarily identify the publisher. Use the evidence hostname for descriptive labels. **Source type not stored**: neither self-reported nor independent is recorded, so omit those tags.
- Metric name/key/unit/storage kind/precision are exposed. **Metric direction is not stored**; retain SEO's five recently reported results without implying a score ranking. Each version has one metric, and version metrics may differ.
- `reported_at` / `reported_precision` describe reports, not Registry update dates or necessarily evaluation dates. Display them as Reported. SEO updated dates use real source-checked timestamps, not build time.
- Latest means latest run per model + reasoning + version + metric + evaluator set, by reported date then result key. Multiple evaluator series can occupy the same pivot cell: retain every observation and citation, never select or average one. History remains an unpivoted run list.

## URL state and pagination

- Rows per page is a GET form with `limit=50|100|500` (default 50), preserving `q`, `sort`, `order`, `view` and resetting page. Apply works without JS.
- Model table sort links create `sort=benchmark|source&order=asc|desc`, preserve other state and reset `page`; score is not sortable. Additional accepted result sort keys are model/company/registry_no/reported_at. Current default ordering is report date descending. This pass will use benchmark ascending for the model UI without changing explicit sort choices.
- Latest/History links set `view=latest|history`, preserving query/sort/limit and resetting page. Pagination sets the one-based `page` value and preserves active state.
- API pagination currently slices result records before rendering. A pivot must be built before model-page pagination to avoid splitting effort columns between pages. Distinct benchmark copy must use the full filtered set, counting family identities, not result rows or version rows. Keep the read API and stored results unchanged; obtain the complete set through its existing paginated endpoints for HTML rendering.

## Verification baseline

- `npm test`: 417 passed; one existing skipped test (38 files). Existing offline tooling includes Playwright Core, Chrome and axe-core.
- Existing `scripts/seo_check.mjs` can serve a locally materialized, read-only database snapshot with `--db=... --serve=...`; use the saved `/private/tmp/benchmark-seo-full.sqlite` snapshot for representative pages. No ingestion or canonical writes needed.
- Planned commits correspond to tasks 1–8: version grouping; compact model metadata/controls; effort pivot; table layout; provenance labels; link consistency/contrast; orientation; accessibility verification. This audit accompanies task 1.
