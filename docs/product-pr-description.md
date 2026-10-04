# Trust, robustness and sharing features

The registry now makes individual results easier to trace, report and cite, and
shows where its recorded coverage is incomplete. Existing scores, immutable
record keys and public URLs are preserved. This branch starts from `main` at
`11cc716`, which already contains `seo/site-wide` and `ui/clarity-pass`; it reuses
their metadata, sitemap, source links, tables, breadcrumbs and static compare URLs.

## Shipped by task

1. **Provenance:** recorded source type, publisher/evaluator, report date and
   explicitly classified reporting basis; archived-copy links when present.
   Nullable `source_type`, `source_archive_url`, `publisher`, `reporting_basis`,
   `evaluated_at` and `evaluated_precision` columns support future curated evidence.
   No inferred classifications or backfills. Missing fields are counted by the validator.
2. **Corrections:** quiet prefilled GitHub issue links on records and entity pages;
   two short issue forms; typed `data/corrections.json`, initialized empty, and
   server-rendered `/corrections` with newest-first entries and a neutral empty state.
3. **Coverage:** `/coverage` computes a provider-balanced matrix (25 models total,
   15 most-recorded benchmark families), provider counts and stale results relative
   to the latest source-check timestamp (90 days). GET controls and optional
   `COVERAGE_MODELS`, `COVERAGE_BENCHMARKS`, `COVERAGE_STALE_DAYS` configure bounded values.
4. **Validation:** manual Python 3.12 validator checks nested schema/field types,
   undefined references, dates, source URLs, numeric scores/bounds, fraction-versus-percent
   warnings and normalized-source duplicate identities. Exact cross-batch replays
   are informational; differing reasoning/run/evaluator contexts are warnings, not
   merged records. Supports read-only `--db`, severity-grouped text and `--json`,
   with nonzero error exits. Invocation appears in its own `--help`.
5. **Health:** uncached `/healthz` checks D1 directly (200/503), no authentication,
   noindex. Structured server-error lines use safe messages and route templates;
   zero-result search lines contain only query text. Manual SQLite backup script
   uses an explicit local path, consistent read snapshot and timestamped SQL dump.
6. **Performance:** reversible query indexes, 60-second coverage cache (bounded,
   coalesced, failures evicted), short HTML freshness with stale-while-revalidate,
   immutable caching only for fingerprinted assets, and model bootstrap deduplication.
   Existing immutable published reads/cache serve counts and other public pages.
   D1 diagnostics now measure the requested direct reads. Cloudflare owns compression;
   system fonts need no external request or preload. New design sizes are centralized
   beside the existing tokens, including responsive footer spacing.
7. **Governance:** separate `LICENSE-DATA` with CC BY 4.0; one code configuration
   for license name, URL and attribution. Apache-2.0 code license untouched. Minimal
   About/Contact, revised Terms/Privacy drafts and footer links. Hidden funding TODO.
8. **Citations:** selectable plain text/BibTeX in native `<details>` on models,
   benchmark versions and records; optional clipboard buttons. Existing registry
   numbers/result keys, canonical production origin, access-date placeholder and
   license are included. Record citations/permalinks retain history/query state so
   older observations remain reachable; stable `#BR-{result_key}` anchors highlight targets.
9. **Charts:** server-generated SVG plus accessible data table, best recorded score
   per model and a running-best line. Nullable metric direction is reversible and
   remains unpopulated. Unknown direction or fewer than five valid dated models
   suppress the chart; no comparison direction is guessed.
10. **Compare:** stable URL state and existing static pair pages; shared benchmarks
    by default, explicit Show all, provider and model-release date-range controls.
    Existing selections remain visible if excluded from the model-choice filter.
11. **Search:** quiet operator hint and an SSR `/search` destination with a compact
    inline operator list. The baseline did not implement the requested operators;
    `brand:`, `benchmark:`, `record:`, `model:`, `metric:`, `date:`, `org:` now work
    while retaining natural-language search. Brand matches recorded names/aliases;
    no new brand taxonomy. GET forms and mobile navigation remain usable without scripts.
12. **Badges:** SVG `/badge/{registry-no}/{benchmark-slug}.svg`, latest reported
    family observation, accessible title, escaped content, unknown-pair 404 and
    copyable Markdown/HTML snippets. Registry numbers follow existing model URLs.
    Mutable badge URLs use short caching; only fingerprinted assets are immutable.
13. **Feed:** valid Atom `/feed.xml` with 50 recent additions/updates, specific record
    links and source summaries, homepage head discovery and footer link. Source-check
    timestamps provide real update evidence; they are not described as first-added dates.
14. **Analytics:** off by default. Both `ANALYTICS_SCRIPT_URL` (HTTPS) and
    `ANALYTICS_SITE_ID` must be set before a deferred script is rendered. Generic
    `data-site-id` and common domain/website-id attributes support owner-selected scripts.
    No vendor chosen, no application cookies, no default request. Privacy reflects
    the deployment config; protected staging suppresses external analytics.
    Render caches distinguish analytics configuration changes.

All new indexable pages use the existing SEO helper and sitemap. Search, health,
badges and feed remain excluded; non-HTML routes have noindex headers. No new public
API/export/mirror/MCP endpoints, user documentation, runtime dependencies, workflows,
schedules or ingestion automation were added. No deployment or production data mutation.

## Performance measurements

Before/after used the same checked-in 56-record producer fixture, local Worker
rendering, Vite production client assets and gzip byte estimates. Asset inventory
counts HTML + JS + CSS + all three declared favicon variants (six requests);
a browser can choose fewer icons. These are comparable declared-resource counts,
not a network waterfall or Lighthouse score. The unreferenced social-preview PNG
is excluded from navigation weight.

| Page | HTML bytes before → after | Total bytes before → after | Gzip estimate before → after | Declared requests | Cold render ms before → after |
| --- | --- | --- | --- | --- | --- |
| Home | 33,230 → 51,495 | 413,163 → 446,310 | 112,116 → 117,609 | 6 → 6 | 65 → 79 |
| Model `/models/10001` | 26,869 → 39,439 | 406,802 → 434,254 | 111,470 → 116,789 | 6 → 6 | 25 → 30 |
| Benchmark `/benchmarks/gpqa/diamond` | 41,656 → 89,356 | 421,589 → 484,171 | 112,558 → 119,625 | 6 → 6 | 26 → 37 |

The new selectable citations, badge snippets and provenance increase cold HTML
and total weight; this pass does **not** claim a smaller or faster cold page.
Timing is a single local sample, not a production latency estimate. Improvements
are repeat-visit freshness, immutable asset reuse, avoiding duplicate bootstrap
records and avoiding repeated coverage queries for 60 seconds. Coverage cache tests
confirm an immediate repeat adds zero D1 statements, and TTL expiry refreshes reads.
No offline Lighthouse runner was installed, so no Lighthouse/LCP/CLS score is claimed.

Index justification (`EXPLAIN QUERY PLAN` verified locally):

- `idx_models_provider_recent`: provider lookup/recent-model partition and ordering
  on `(company_id, release date, normalized_name, registry_no)`; representative recent
  provider-model query uses this index.
- `idx_results_version_recent`: version-scoped observations ordered by report date
  and stable result key, with model ID available for joins; representative newest
  version-results query uses this index.
- `idx_results_checked_recent`: recent updates ordered by the real source-check
  timestamp and insertion ID; representative feed-update query uses this index.
- Existing model/company/series/evaluator indexes already serve entity and compare
  producer queries; duplicate leading-key indexes were avoided. Public model,
  benchmark, organization and compare reads retain the existing published-KV path.

## Data gaps and conservative choices

Tracked `data/batches` validation: **0 errors, 205 warnings** (all potentially
repeated model/version/metric/source identities with differing contexts), plus
informational provenance/gap summaries. Counts below cover **927 batch observations,
including replays**, not 927 unique production records. Optional database validation
was exercised on a disposable 56-record SQLite fixture, with zero errors; production
unique-row backfill size should be measured with an explicit database input.

| Missing field | Batch observations |
| --- | ---: |
| Source type | 927 |
| Archived source link | 927 |
| Publisher | 927 |
| Self-reported/independent classification | 927 |
| Evaluation date and its precision | 927 each |
| Metric direction | 927 |
| Weights openness | 927 |
| Benchmark category | 927 |
| Reported date | 0 |
| Evaluator | 0 |

Charts are implemented and tested but hidden on the existing data because direction
is unrecorded. Open/closed-weights filtering was skipped because no such facts exist;
no taxonomy/category was inferred. No fabricated archive links, publisher labels or
evaluation dates. The backup tool covers local SQLite dumps only; it neither discovers
credentials nor attempts a remote D1 export. Feed updates use source-check evidence
because a result first-added/updated-at field does not exist.

## Verification and release preparation

- App typecheck, ESLint, production build and full tests: 464 passed; one optional integration test skipped.
- Python ingestion tests: 90 passed; one disposable-remote-D1 test skipped without credentials.
- Manual-script tests: 20 passed (validation rules, migration round trips/EXPLAIN, backup restore).
- Existing app link-script tests: 8 passed. Ruff passed for ingestion and new scripts.
  The checked-in local Ruff executable was killed by the OS; a temporary development
  Ruff install was used without changing repository dependencies.
- SEO check: 42 sitemap URLs, unique metadata, one canonical/H1, valid structured data,
  new page membership and search/health/feed exclusions. Atom parsed with its XML namespace.
- Browser checked new pages at 1440px and 390px; no whole-page overflow, matrix/table
  scrolling stays contained. Fixed the footer overlap found at 390px. Verified citation
  expansion, record target highlight, provider filtering, operator search and coverage GET controls.
  Server-only rendering/tests cover forms, selectable citations and chart/table fallbacks;
  the available browser controller has no JavaScript-disable control.
- Migrations 0009/0010/0011: up, down and up succeeded locally. Existing result keys/scores
  remained byte-for-byte unchanged. No backfill. Existing workflows unchanged.

Before release, apply the three additive migrations to the correct database and
use the existing manual materializer once to publish projection version 5 before
deploying this application. It refreshes provenance, search facets, optional charts
and complete feed updates; old projections remain readable during the transition.
Review the live D1 binding and hosting-level analytics separately. No jobs were added.

## Owner must review before release

- **License choice is the owner's decision; confirm before release.** Review CC BY 4.0,
  `LICENSE-DATA`, attribution and whether the registry can grant the intended rights.
- About page text: project attribution, what is tracked and primary-source policy.
- Hidden About **Neutrality and funding** TODO: supply a verified statement. The placeholder
  sentence is a source comment and is absent from public HTML.
- Terms draft (`app/src/terms-page.tsx`): requires owner/legal review before relying on it.
- Privacy draft (`app/src/privacy-page.tsx`): requires owner/legal review, including actual
  hosting-level settings, logging/retention and optional vendor behavior.
- Analytics vendor choice: none selected. Keep both environment variables unset until
  the owner reviews a cookie-free script/provider and its data handling. A vendor-agnostic
  loader cannot establish what an arbitrary third-party script collects.
