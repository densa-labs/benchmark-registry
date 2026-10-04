# Product audit — 2026-10-04

Audit of `main` at `11cc716`, before product changes. Both `seo/site-wide`
(`c585c49`) and `ui/clarity-pass` (`1d6e22b`) are ancestors of main; their
metadata, sitemap, updated dates, compare URLs, and source/table components are
available. Existing untracked launch reports are outside this task.

- **Stack/storage:** React 19 + TypeScript + Vite, SSR in a Cloudflare Worker,
  hydrated for navigation. Cloudflare D1 (SQLite) is the canonical database;
  public reads currently use validated, versioned Cloudflare KV projections.
  Python 3.12 ingestor is the controlled write path. Batches in `data/batches`
  contain ordered `{operation, record}` entries. `registry-ingest batch FILE
  --dry-run` plans without mutation; `--commit` validates then writes atomically,
  with remote publication via the existing materializer. Batches include seed,
  expansion, replay and correction inputs, so their union is not a unique dataset.
- **Record fields:** immutable SHA-256 `result_key`, model, reasoning level,
  benchmark version, metric, run reference, canonical decimal score plus raw
  spelling, required `reported_at`/precision, evaluator set through join tables,
  exact primary source URL/checked timestamp, additional sources. Model release
  and Registry publication dates and lifecycle status exist. No separate eval
  date, publisher, source type, archive URL, or self-reported/independent flag.
  Evaluator is not automatically the publisher. There is no result-specific
  status column; lifecycle status belongs to models. Record IDs are internal; the
  public record identifier is `result_key` (do not assign invented sequential IDs).
- **Footer/pages/license:** footer credits Densa Labs, links Recent and Legal,
  GitHub and theme control; shows data update and build dates. `/legal`, `/terms`,
  `/privacy` exist. No standalone About or Contact. A support email is present in
  legal source; avoid requiring email and use the requested GitHub contact path.
  Code LICENSE is Apache-2.0; no separate data license. Terms explicitly do not
  license the dataset. Privacy makes vendor/security/retention claims whose live
  settings cannot be established from app code alone.
- **Search:** global search uses `/api/search?q=`; operators `brand:`,
  `benchmark:`, `record:`, `model:`, `metric:`, `date:`, `org:` are requested but absent from
  the existing parser in `worker/search.ts`. There is no `/search` page/operator list. Home search is
  enhanced; add a server-rendered search destination for graceful fallback.
- **Compare:** exists at `/compare?models=10001,20001&reasoning=high,max`,
  legacy A/B parameters work. Search, benchmark mode, page and limit are URL
  state. Clean static `/compare/{pair}` pages come from the SEO snapshot. All
  benchmarks currently show by default. No provider/release filters.
- **Performance:** revision/build-scoped edge HTML/API cache, 60-second browser
  max-age with must-revalidate, immutable KV objects, bounded in-memory reads and
  client search/document caches. Fingerprinted Vite assets exist; system fonts
  are used (Geist packages are unused). No external font request/preload is needed.
  Cloudflare owns delivery compression. Numerous indexes already support model,
  version, series, date-peer and alias lookup; avoid duplicate leading keys.
- **Health/errors/analytics:** no `/healthz`. Fixed-category server diagnostics
  and build ID exist, no structured zero-result search logging. Worker logging
  is enabled but persistence, invocation logs and traces are disabled. No
  analytics script in app code; existing privacy text says Cloudflare injects
  Web Analytics, which requires owner review outside this change. No issue
  templates; `.github/workflows` exists and must remain untouched.
- **Coverage gaps:** no weights-openness or benchmark-category fields; numeric
  metrics have units, precision and optional bounds, but no direction. Every
  canonical result requires reported date, source and evaluator; batches may
  contain malformed or undefined references, which the manual validator should
  report. Archive links and provenance classification are absent. Source check
  timestamps are real maintenance timestamps, distinct from reported dates and
  first-addition timestamps.

Implementation choices: preserve all IDs/scores and existing URLs; add nullable
provenance and direction readiness without inferred values; use explicit D1
bindings only for coverage and health as requested, retain existing published
reads elsewhere. New HTML pages use the shared metadata/SSR shell. Manual scripts
and tests only; no workflow, schedule, API or export additions. Atom uses recorded
source-check timestamps as update evidence and does not claim invented addition
timestamps. Data license, About, hidden funding TODO, Terms, Privacy and any
analytics vendor require owner review before release.
