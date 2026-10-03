# SEO audit — 2026-10-03

## Phase 0 (before changes)

- Stack: React 19, TypeScript, Vite 8, Cloudflare Worker custom domains, KV published read store. `app/worker/document.tsx` renders React into initial HTML and embeds the hydration payload. The public Worker never reads D1; `repository.ts` and the controlled materializer produce read-only projections.
- Routing: `app/src/registry.ts`; head: `app/worker/metadata.ts`, rewritten over `app/index.html`; robots/sitemap/redirects: `app/worker/index.ts`; shadow test adapter: `canonical-reference.ts`. Browser navigation transfers the server head through `src/document-cache.ts`.
- Canonical signal: existing `PRODUCTION_ORIGIN`, canonical tags, robots and sitemap all select **https://benchmarkregistry.org**. Both apex and www are bound in `app/wrangler.jsonc`. Code already redirects www and HTTP to HTTPS apex with 308. No Vercel, Netlify, nginx or external redirect configuration is required for these bound hosts.

| Route pattern | Type |
| --- | --- |
| `/` | Home, global search control, complete model directory |
| `/models` | Model index |
| `/models/{registry_no}` | Model; immutable stealth redirects return 308 |
| `/benchmarks` | Benchmark index |
| `/benchmarks/{slug}` | Benchmark family |
| `/benchmarks/{slug}/{version_slug}` | Benchmark version |
| `/companies` | Organizations index (label is Organizations) |
| `/companies/{slug}` | Organization |
| `/compare` | Compare builder; query-selected models |
| `/legal`, `/privacy`, `/terms` | Legal documents |
| `/api/...` | JSON read API, including `/api/search?q=`, stats, home panels and revision |
| `/robots.txt`, `/sitemap.xml`, `/assets/*`, `/favicon*` | Infrastructure/assets |
| Any other path, including `/search` | 404 |

Trailing slashes and escaped keys normalize to the immutable entity routes. No second root-level model route or `/benchmarks/{slug}/versions/{version}` route exists in this checkout. The reported `/incai-ringflash20` and `itbench-sre` identities do not occur in tracked curated batches; no entity equivalence can be asserted. The old extra `versions` path segment causes the reported 404. Legacy URLs must resolve only against real entity names/aliases/keys, otherwise redirect to the closest existing hub/family without inventing an entity mapping.

Parameters: list/result pages use `q`, `company`, `view=latest|history`, `sort`, `order`, `page`, `limit=50|100|500`; result selection uses `result`. Compare uses `models`, `reasoning`, legacy `model_a`, `model_b`, `reasoning_a`, `reasoning_b`, `q`, `benchmarks=all|shared`, `page`, `limit`. Home search is an interactive `/api/search` control, not a stable public search document. Existing SEO unusually indexes some exact `?view=history&result=` URLs and keeps compare selections in their canonicals; these will be retired under Task 3.

Available facts: global model/family/version/result counts; model provider, Registry No., aliases, status, release date/precision, immutable publication timestamp; organization establishment and latest-model facts; version metric, release date/precision, evaluators and immutable slug; all retained result scores, primary sources, report dates/precision, source-check timestamps and insertion IDs. Source checks are real persisted data timestamps, distinct from report/release/founding dates and materialization/build time. Additional citations have their own checked timestamps. No benchmark description, category taxonomy, flagship designation, or metric direction exists in the schema. Therefore use neutral count/name sentences, most recently reported results (never a leaderboard), and skip category hubs. Comparison generation can conservatively use consecutive explicitly numbered same-family model versions; flagship comparisons require recorded flagship designations and are skipped.

Current metadata uses short `X | Benchmarks` / `X | Results` titles and generic descriptions, with different index templates. It does not emit Twitter tags, a sharing image, JSON-LD or sitemap lastmod. HTML already has `lang=en`. Company establishment is visible in a metadata row; it is not a page modification date. The deployed Google examples may describe older deployments; this audit records the checkout rather than assuming deployed equivalence.

## Implementation plan

Follow Tasks 1–12 in order with a Conventional Commit for each. Centralize canonical policy and metadata; make all query documents noindex with clean canonicals; derive a compact read-only SEO projection from the persisted source-check timestamps and complete retained results, served through the same published generation. Keep scoring data and ingestion untouched. Use existing React tables/links for the permitted content. Add initial-HTML and metadata checks to CI and a complete local sitemap crawl.

## Hosting and deployment

Both production custom domains are configured in this repository. Deploy the Worker to activate its 301 www → apex rule, preserving path and query. No external host rule is necessary for those domains. If a separate CDN/proxy bypasses the Worker, configure: condition `http.host eq "www.benchmarkregistry.org" or (http.host eq "benchmarkregistry.org" and not ssl)`, dynamic destination `concat("https://benchmarkregistry.org", http.request.uri.path)`, preserve query string, status **301**. Verify this on the actual public edge after deployment.

## Post-deploy checklist

- Publish the read projections required by this branch before switching the public Worker; verify production and staging with their pinned generations.
- Submit `https://benchmarkregistry.org/sitemap.xml` in the apex Search Console property.
- Use URL Inspection and request indexing for `/`, one indexable benchmark page and one indexable model page.
- Verify www/HTTP and legacy path redirects, noindex parameter pages, source-check lastmod, JSON-LD and sharing logo on the deployed edge.
- Re-check `site:benchmarkregistry.org` and `site:www.benchmarkregistry.org` results in 1–2 weeks. Google chooses its own displayed snippets and dates; changes here do not guarantee their immediate replacement.

## Date audit (Task 6)

`source_checked_at` and result `primary_source_checked_at`/additional citation checks drive entity update dates. Model release and organization founding dates are not used as page dates. Organization founding metadata is retained for readers under `data-nosnippet`. The footer no longer treats its fixed data-date constant or build timestamp as a page update; its build toggle explicitly says “Application build” and is excluded from snippets. Model lists label release dates as “Released”. Legal policy effective dates remain explicit policy dates. No article publication-time tags are emitted. JSON-LD and sitemap consume the same page data timestamp in Tasks 7–8; missing timestamps are omitted, never filled with build time.
