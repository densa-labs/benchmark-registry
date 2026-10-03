# Site-wide SEO and factual landing pages

The public site exposed competing host/query URLs and generic metadata, while entity pages lacked factual summaries and page update dates. This change selects the existing apex canonical host, serves one metadata system and JSON-LD in the initial HTML, removes thin/query pages from indexing, and adds source-backed entity content, recent records, and eligible static comparisons.

The public Worker continues to read only the coherent published KV generation. A read-only producer helper adds an SEO projection; no batches, migrations, ingestor logic or scores change. All visible additions use existing tables, typography and links.

## Before / after

Old values below are from the checkout at `e1469ba`, rather than assuming it matches every older deployment Google indexed. The reported `X - Benchmark Registry` template is retired; the checkout also used `X | Benchmarks` / `X | Results`. New counts and dates come from a disposable replay of tracked batches plus the existing Argon evidence batch, not a production database snapshot. Values are generated from each published generation, never hardcoded.

| Page type | Example URL | Old title | New title | Old description | New description |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | Benchmark Registry | Benchmark Registry: AI Model Benchmark Results in One Place | AI model benchmark results in one place \| Benchmark Registry | AI model benchmark results from primary sources: 95 models, 85 benchmarks, 946 records. Updated 2026-10-03. |
| Models index | `/models` | Models \| Benchmark Registry | AI Models and Benchmark Results \| Benchmark Registry | AI models and their benchmark results | 95 AI models from 15 developers with reported benchmark scores, sourced from official publications. |
| Benchmarks index | `/benchmarks` | Benchmarks \| Benchmark Registry | AI Benchmarks: Results and Leaderboards \| Benchmark Registry | AI benchmarks and model evaluation results | 85 AI benchmarks with 946 reported results across 95 models, from primary sources. |
| Organizations index | `/companies` | Companies \| Benchmark Registry | AI Model Developers and Benchmark Results \| Benchmark Registry | AI companies, models, and benchmark results | 15 AI model developers with 95 models and 946 reported benchmark results, sourced from official publications. |
| Model | `/models/20015` | Claude Opus 5.5 \| Benchmarks | Claude Opus 5.5 Benchmark Results & Scores \| Benchmark Registry | Anthropic's Claude Opus 5.5 model evaluation and benchmark results \| Benchmark Registry | Claude Opus 5.5 benchmark results from primary sources: 21 records across 9 benchmarks. Developer: Anthropic. Released 2026-09-22. Registry No. 20015. |
| Benchmark family | `/benchmarks/mmmu-pro` | MMMU-Pro \| Benchmarks | MMMU-Pro Benchmark Results & Scores \| Benchmark Registry | Model results across versions of MMMU-Pro | MMMU-Pro results for 18 models across 3 versions, from primary sources. Latest version: MMMU-Pro With tools. |
| Benchmark version | `/benchmarks/mmmu-pro/with-tools` | MMMU-Pro With tools \| Results | MMMU-Pro With tools Results & Scores \| Benchmark Registry | MMMU-Pro Authors's MMMU-Pro With tools model results | MMMU-Pro With tools scores for 6 models. Metric: MMMU-Pro accuracy. Released 2026-03-05. 6 reported results from primary sources. |
| Organization | `/companies/anthropic` | Anthropic \| Benchmarks | Anthropic AI Models and Benchmark Results \| Benchmark Registry | Anthropic model evaluation and benchmark results \| Benchmark Registry | Benchmark results for 16 Anthropic models, including Claude Sonnet 5.5. Sourced from official publications. |
| Compare builder | `/compare` | Compare models \| Benchmark Registry | Compare AI Model Benchmark Results \| Benchmark Registry | Compare AI model information, reasoning levels, and source-backed benchmark results side by side. | Compare AI model information, reasoning levels, and reported benchmark results from primary sources. |
| Static comparison | `/compare/claude-opus-5-vs-claude-opus-5-5` | Absent | Claude Opus 5 vs 5.5: Benchmark Comparison \| Benchmark Registry | Absent | Claude Opus 5 vs Claude Opus 5.5: compare scores across 6 shared benchmarks, with reported results and primary source links. |
| Recently added | `/recent` | Absent | Recently Added AI Benchmark Results \| Benchmark Registry | Absent | 100 recently added benchmark records across 18 AI models, with reported scores and primary source links. Updated 2026-10-03. |

Legal, privacy and terms titles/descriptions retain their distinct factual wording and receive the same canonical, sharing and breadcrumb system. Query-selected comparisons are noindex with `/compare` as canonical. Long titles first reduce optional result wording; repeated family names in comparison titles are compacted before shortening entity labels. Descriptions have a 160-character cap and omit optional clauses instead of adding unsupported facts or filler.

## Canonical URL patterns and redirects

Canonical origin: **https://benchmarkregistry.org**, selected from the pre-existing canonicals, robots and sitemap. `app/src/seo-config.ts` is its single source.

| Pattern | Policy |
| --- | --- |
| `/`, `/models`, `/benchmarks`, `/companies` | Canonical index/hub routes |
| `/models/{registry_no}` | Canonical model identity; preserves existing stealth-model redirects |
| `/benchmarks/{slug}` | Canonical family |
| `/benchmarks/{slug}/{version_slug}` | Canonical version, subject to thin/placeholder noindex |
| `/companies/{slug}` | Canonical organization; no new `/organizations` aliases |
| `/compare` | Canonical empty builder; all query selections noindex |
| `/compare/{model-a}-vs-{model-b}` | New static comparison route, limited to eligible generated pairs |
| `/recent` | New recent-record landing page |
| `/legal`, `/privacy`, `/terms` | Canonical legal documents |
| `/api/...`, `/assets/*`, `/favicon*`, `/robots.txt`, `/sitemap.xml` | Infrastructure, not sitemap landing pages |
| Query variants (`q`, `sort`, `order`, `limit`, `page`, `view`, `company`, `result`, compare selection parameters) | Noindex,follow and clean canonical; controls and exact-result evidence links still work |
| Trailing/escaped canonical paths | Existing normalization redirects retained |
| www or HTTP on production domains | 301 to HTTPS apex, preserving path and query |
| `/benchmarks/{slug}/versions/{version}` | 301 to actual canonical version if it exists, otherwise its existing family or `/benchmarks` |
| `/models/{model-name}` or `/{model-name}` | 301 only when normalized name matches a real model, to `/models/{registry_no}` |
| `/benchmarks/itbench-sre/versions/default` | 301 to `/benchmarks`; neither that entity nor a replacement exists in tracked data |
| `/incai-ringflash20` | 301 to `/models`; no evidenced identity mapping exists |
| `/search` and unrelated unknown paths | 404, noindex; global search uses `/api/search?q=` |

No second entity pattern was implemented in the checkout. Legacy handling resolves known old shapes without asserting unsupported entity equivalence. Internal entity links use the canonical patterns. Models with fewer than three retained records and versions with fewer than three records or placeholder names remain reachable but noindex and absent from the sitemap; one threshold constant controls both.

## Content and deliberate skips

- Entity summaries, update dates, related/provider/model/benchmark links, family latest-version links and up to five recently reported results are server-rendered. Model coverage links include every recorded family/version so pagination cannot hide an indexable page from the three-click crawl.
- Metric direction is absent, so family tables list recently reported results and titles say Results & Scores. No ranked leaderboards or top-score claim is invented. The benchmarks hub retains the explicitly requested title template.
- Static comparisons reuse existing score/evaluation/source components, retain reasoning and evaluator distinctions, require at least three shared benchmark families with matching version/metric identities, and use one deterministic numbered-family generator capped at 100. The replay generates **29 pairs**. Flagship pairs are skipped because flagship designations do not exist.
- `/recent` contains the newest 100 records by persisted insertion ID. There is no immutable insertion timestamp; groups explicitly say Evidence checked and use real persisted citation-check dates.
- Category hubs are skipped because the schema has no categories. The audit proposes a separately reviewed, source-backed taxonomy contract; no categories are inferred from names.
- No benchmark description exists. Neutral names/counts supply the single descriptive sentence.
- No SearchAction is added because global search has no stable public search document URL. There are no runtime network calls or new dependencies.

## Dates and structured data

Real entity/result citation-check timestamps supply visible Updated lines, footer dates, JSON-LD dateModified and sitemap lastmod. Founding dates remain explicit metadata under data-nosnippet; model release dates are labeled as releases. Build time is labeled Application build and never becomes a page update date. Missing data dates are omitted, including legal documents and the empty compare builder.

Every non-home page receives BreadcrumbList and compact visible breadcrumbs. Home receives Organization and WebSite; model, benchmark and static comparison documents receive Dataset with the metadata description and primary source citations. The sitemap contains canonical 200 documents only; robots allows crawling and references its absolute apex URL.

## Verification

- App: **417 tests passed, one skipped**; TypeScript and ESLint passed.
- Existing ingestor: **90 tests passed, one skipped** (disposable remote D1 credentials absent); existing link-script tests: **8 passed**.
- Production build and `verify:production` passed, including isolated KV without D1, branding/favicons and hydration checks.
- `npm run test:seo`: **38** deterministic seed sitemap URLs passed. CI now runs this check without credentials.
- Full tracked-data replay: **95 models, 85 benchmark families, 15 developers, 946 retained results; 288 sitemap URLs, 29 static pairs**. This replay differs by one retained result from the previously recorded live snapshot; it is local verification, not a production inventory claim.
- The local crawler checks HTTP 200, exactly one self-canonical, host consistency, one H1, unique nonempty bounded title/description, noindex exclusions, JSON-LD parsing, real lastmod, no alternate-host links, query noindex and reachability within three clicks by ordinary anchors. It can also crawl a local server or use an explicit read-only SQLite database.
- Browser checks on desktop and 390px mobile: summaries, related links, organization release list, sorting/head transfer, recent records, family results/version links, comparison evaluation/source details, table scrolling and no hydration/browser errors.
- Older-generation upgrade regression: producer can load a pre-SEO manifest and publish the projection with no canonical data change; public validation remains strict.

## Deployment and hosting settings

**Not deployed by this task.** First publish the new projection with this branch's producer, separately per environment, then deploy the corresponding Worker. Existing publications use incremental mode, not bootstrap:

```sh
cd app
npm run materialize -- --environment staging
npm run materialize -- --environment staging --status
npm run deploy:staging
# Verify staging before the approved production rollout.
npm run materialize -- --environment production
npm run materialize -- --environment production --status
npm run deploy:production
```

Both apex and www custom domains are in `app/wrangler.jsonc`; Worker deployment activates their 301 rule. **No external hosting configuration change is required for those bound domains.** If a separate proxy bypasses the Worker, set this exact Cloudflare redirect: condition `http.host eq "www.benchmarkregistry.org" or (http.host eq "benchmarkregistry.org" and not ssl)`; dynamic destination `concat("https://benchmarkregistry.org", http.request.uri.path)`; preserve query string; status **301**. Confirm actual edge behavior after rollout. Rollback must pair the Worker with a compatible generation containing the SEO projection.

After deployment submit the apex sitemap in Search Console, request indexing for home plus one model and benchmark, inspect redirects/noindex/JSON-LD, then re-check both hosts' site: results in 1–2 weeks. See `docs/seo-audit.md` for reconnaissance and the checklist.

## Commit structure

The branch `seo/site-wide` contains one Phase 0 audit commit, one commit per numbered task (1–12), and a final verification/compatibility commit. No score or ingestion-data edits are included.
