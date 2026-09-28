# P11.7 — Internal Linking & Crawlability

## Inspection and bounded implementation

The React homepage already contained the complete model directory and real model
hrefs. React indexes, model company metadata, company result rows, version model
and company rows, and family version rows also used anchors. Indexes and result
tables had real pagination URLs. However, P11.6's initial HTML was only an identity
summary: directories, version lists, tables, and pagination required JavaScript.
Model and company result labels linked to benchmark families even when displaying
a specific version. Table scores had no exact-result navigation; version pages
had no explicit family parent link.

The before audit uses the saved P11.6 production HTML and its 805-document
inventory. Counting only ordinary non-self anchors, it found **600 pages with no
internal inbound links** and **804 pages unreachable from the homepage**. These
are initial-HTML measurements, not a claim that the React UI had 600 orphans.
Sitemap entries and canonical tags never count as graph edges.

## Internal-link architecture

- The homepage's existing full alphabetical directory exposes all 92 canonical
  model hrefs in initial HTML. Primary navigation opens each of the three indexes.
- Model metadata links to its company; benchmark result labels link to the exact
  stored version route, preserving reviewed common names and display versions.
- Company latest-model metadata and result rows link to models; their benchmark
  labels link to versions. No additional related-link directory was introduced.
- Family tables explicitly link every known version with meaningful full version
  labels. Versions retain separate canonical pages.
- Version metadata links to the family and version. Result rows link to models
  and companies. An approved score links to its selected exact-result state.
- Selected exact results expose all four parents through the same version
  metadata and model/company table cells; existing source links are retained.
- Evaluators retain their frozen internal-record role and existing metadata;
  no public evaluator routes or inferred evaluator/company identities were added.
- Indexes and result tables retain native anchors and GET forms, URL state,
  frozen 50 / 100 / 500 sizes, default 50, and existing Latest/History rules.
- Redirect source models are excluded from the discovery list. Their immutable
  public routes and API detail redirect behavior remain intact.

## Initial HTML

`RegistryDocument` renders the existing loaded page components for both the client
and Worker. The Worker calls the existing read API handler directly against its
own environment's D1 binding, then uses React's static server renderer. There is
no network loopback, separate table implementation, new route family, hydration
framework, or database write.

Initial HTML now contains the ordinary shell/navigation, homepage directory,
index tables, family version tables, entity metadata, the current result-table
page, and real pagination. It honors valid query state. Malformed/unknown query
states keep P11.6's noindex HTTP 200/base-page behavior while the API retains its
strict validation. Missing entities retain actual 404 documents.

Global search suggestions and direct navigation from global search, theme
controls, and scroll-responsive header behavior still require JavaScript. The
client still starts with `createRoot`, loads data, and replaces the initial
markup; hydration and general performance work are outside P11.7. Entity data,
tables, pagination, and ordinary local-search GET forms no longer require
JavaScript for discovery/navigation. A table renders its selected page, rather
than bypassing the frozen pagination limits.

## Exact-result policy

The shared `EXACT_RESULT_ELIGIBLE_SQL` predicate supplies document canonical
eligibility, sitemap eligibility, and result-row navigation. It counts **all
retained results for the model/version**, including reasoning variants,
evaluators, and historical runs, and excludes redirect-source models.

The API adds the stored `benchmark_version_slug` and nullable
`exact_result_href`. Only eligible rows receive
`/benchmarks/{slug}/{version_slug}?view=history&result={key}`. The UI makes the
existing score a link, retaining a descriptive model/version title. It does not
replace the benchmark version link or add duplicate SEO columns. Ambiguous
scores remain text, and their selected query states remain usable, noindex,
canonical to the version, and excluded from the sitemap.

## Automated audit and evidence

`app/scripts/verify-links-live.py` runs the P11.6 indexing regression audit, then
extracts ordinary anchors from initial HTML. It checks homepage reachability,
non-self inbound links, origin consistency, pagination/history discovery,
ambiguous-state promotion, and HTTP integrity of all emitted internal hrefs,
including nonindexable UI controls. HTTP checks do not follow redirects.
Sitemap/API inventory detects missing canonical pages without contributing edges.

Deterministic coverage includes real migration/repository/Worker integration:
all homepage model links, models/companies/versions, every family version,
exact-result parents, approved versus ambiguous links, display-version/slug
separation, initial index pagination, malformed query/API boundaries, canonical
origins, representative direct 200 responses, and staging protection. Separate
graph tests detect self-link/sitemap false positives, disconnected cycles, and
pagination-dependent reachability. Result-key checks reject malformed keys and
keys linked under the wrong version, even when P11.6 returns HTTP 200.

The live audit checkpoints integrity statuses and stops on server failures.
`resume-links-live.py` probes recovery, revalidates all canonical documents and
the unchanged graph, and retries failed or unchecked targets. Previously proven
unchanged controls are retained to avoid repeating thousands of D1 reads.

Commands from the repository root:

```sh
cd app
npm test
npm run test:links
npm run typecheck
npm run lint
npm run build:staging
npm run verify:staging
npm run build:production
npm run verify:production
cd ..
python3 app/scripts/verify-links-live.py staging.benchmarkregistry.org /tmp/p117-staging /path/to/cloudflared
python3 app/scripts/verify-links-live.py benchmarkregistry.org /tmp/p117-production
git diff --check
```

### Staging gate

Staging Worker: `7eb2da15-9f68-49e9-aa10-fa145becd886`.

- 805 canonical/indexable URLs audited: homepage 1, indexes 3, models 92,
  families 53, versions 104, companies 15, approved exact results 537.
- 1,264 initial documents including pagination/history navigation.
- 7,200 distinct internal href targets: every target returned direct HTTP 200.
- Zero orphaned indexable pages; zero unreachable canonical pages.
- Zero broken links, redirecting links, malformed/wrong-version result keys, staging/www/preview internal links, or promoted
  ambiguous result URLs.
- All 57 ambiguous states retained noindex and benchmark-version canonicals.
- Unauthenticated homepage, API, robots, and sitemap remained behind Access.
  Authenticated staging retained its protective response header and robots
  `Disallow: /`; generated canonicals remained production equivalents.

Staging and production builds have identical SHA-256 hashes for all 18
application artifacts (Worker plus client assets). Environment configuration
checks passed independently, including separate D1 bindings.

### Verification commands

246 app tests across 12 files, eight graph/recovery-audit tests, typecheck, ESLint,
staging/production builds, environment/config checks, and `git diff --check`
passed. Browser checks covered normal homepage/model/company/version/exact/family
navigation, approved versus ambiguous score links, the empty-results model,
loading states, mobile table overflow, and browser error logs. The linked version
table retained horizontal scrolling at a 390px viewport; no browser errors were
observed.

Local raw evidence: `/tmp/p117-before-graph.json`, `/tmp/p117-staging`, and
`/tmp/p117-production`. Live audit directories include every canonical initial
HTML document, robots/sitemap, indexing report, graph report, and captured
pagination/history HTML.

### Production gate — passed after quota recovery

Production Worker: `1df4b8d0-18de-4098-abf8-44c3b30d1f00`, deployed after staging
passed with the same verified application artifacts.

All 805 canonical documents initially returned HTTP 200 with correct indexing
metadata. The 57 ambiguous states retained their noindex/version-canonical policy.
The 1,264-document graph has zero orphaned or unreachable indexable URLs and no
invalid internal origins or promoted ambiguous states. During the subsequent
7,200-target integrity check, 969 targets returned HTTP 500; no 404 targets or
redirecting internal links were observed. Worker logs confirmed the account had
exhausted Cloudflare D1's free daily row-read quota. Ordinary entity/API reads also
failed after the cap was reached. The original audit failed; those responses were
not treated as passing link integrity.

Live reads stopped until the free quota reset. The user briefly waived the
remaining audit, then revoked that waiver and restored the automation. The
authorized resumption ran at **08:05 Manila on September 27, 2026**, after the
midnight UTC reset. Billing is unchanged.

Recovery command executed successfully:

```sh
python3 app/scripts/resume-links-live.py benchmarkregistry.org /tmp/p117-production
```

The resumed live audit passed:

- Live sitemap inventory still contains exactly the same 805 canonical URLs.
- All 805 canonical documents were fetched again and returned indexable HTTP 200
  with the expected canonical URL and no production noindex header/directive.
- Their emitted href set matches the saved graph. The combined 1,264-document
  graph has zero orphaned and zero unreachable canonical/indexable URLs.
- All 969 previously failed targets were retried and returned direct HTTP 200.
- Across the original successful checks and the completed recovery run, all
  7,200 internal targets are verified, with zero unchecked or non-200 targets,
  broken links, redirecting links, invalid origins, malformed/wrong-version
  result keys, or promoted ambiguous result URLs.
- P11.6's production indexing checks, including all 57 ambiguous states, passed
  in the original run; the unchanged deployed runtime and shared eligibility
  logic were retained. The recovery run revalidated the indexable surface.

`/tmp/p117-production/graph-report-before-resume.json` preserves the original
969-failure evidence. `graph-report.json` records the completed passing gate;
`integrity-status.json` contains the verified target statuses. The resumption
retained successful unchanged controls instead of repeating all 7,200 requests.

**P11.7 complete: YES** — staging passed first, production recovery and the
remaining integrity checks passed afterward, and the handover is complete.

**P11.8 was not started.**

## Scope

Frozen contracts, Registry numbering, data, schema, source evidence, scoring,
canonical/query indexing rules, Cloudflare Access, and D1 isolation are unchanged.
No P11.8–P11.12 features were implemented. Typography/spacing, mobile redesign,
footer additions, theme/favicon work, performance/hydration, accessibility phase,
legal/contact pages, and the final launch audit remain their separate phases.

## Handover

### What changed and why

The existing Registry tables and metadata now form an ordinary-anchor entity
graph, and the Worker renders those same components into initial HTML. This
removes search and JavaScript as prerequisites for entity discovery while
preserving the P11.6 indexing policy and frozen route/page-size rules.

### Files changed

- Runtime: `app/src/App.tsx`, `benchmark-link.tsx`, `model-pages.tsx`,
  `company-pages.tsx`, `benchmark-pages.tsx`, new `result-score-link.tsx`;
  `app/worker/index.ts`, `api.ts`, `repository.ts`, `metadata.ts`, new
  `document.tsx` and `result-links.ts`.
- Verification: existing app test fixtures/assertions, new
  `app/worker/crawlability.test.ts`; `app/scripts/verify-seo-live.py`, new
  `crawl_graph.py`, `live_http.py`, `verify-links-live.py`, `resume-links-live.py`,
  and two Python test modules; test/audit scripts in `app/package.json`.
- Reports: this document and the prior P11.5/P11.6 reports. Integration groups
  the runtime, audit tooling, reports, and production observability configuration
  into separate commits; see Git history for the commit identifiers. No pull
  request was created. The separate `app/wrangler.jsonc` observability change was
  not authored as P11.7 work and is included in its own commit.

### Tests run

246 app tests and eight Python audit/recovery tests passed, along with typecheck,
ESLint, both environment builds/config checks, browser navigation checks, and
diff checks. Staging passed the full live audit. Production indexing/graph
verification passed before quota exhaustion; the September 27 recovery run
completed HTTP integrity successfully. Eight audit/recovery tests and diff checks
were also rerun successfully during resumption.

### Known limitations and unresolved questions

- Production quota recovery was verified. The free allowance still presents an
  operational constraint: exhausting it can make normal D1-dependent documents
  and APIs return HTTP 500 until reset. Billing was not changed.
- All 969 previously quota-failed targets passed after recovery. There are no
  unresolved crawl/link integrity findings in the completed audit.
- SSR adds D1 reads, and the client subsequently fetches again. Current code
  discards D1 `rows_read` metadata. The conversation's 3,000 reads/page and DAU
  figures are planning estimates, not measurements or traffic guarantees.
- Generated HTML remains `no-store`; HEAD checks still perform document reads.
  No caching/query/hydration changes were implemented. Performance belongs to
  a separately authorized P11.9 task.
- Global search suggestions/navigation, themes, and header scroll behavior
  remain dependent on JavaScript. Result tables expose their selected page.
- Raw audit evidence is saved under `/tmp`; the durable aggregate findings and
  deployed Worker versions are recorded above.

### Next expected task

P11.7 is complete; stop this task. Wait for the user's next phase instruction.
P11.8 and later phases have not been started. Do not change billing or rerun the
completed audit automatically.
