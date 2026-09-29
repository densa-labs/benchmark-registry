# P11.9 design — Performance, caching and interaction speed

Historical origin-cache experiment only. The edge-first amendment supersedes its
cache-miss/revision serving architecture. See p11-9-materialized-design.md and
p11-9-performance-report.md for the implemented, deployed design. SQL/perceived
performance findings below remain useful; visitor-driven D1 fills were removed.

This design is based on the bounded local D1 audit, before implementation.
Scope is P11.9 only. Frozen product/data/numbering contracts and P11.1–8 remain authoritative.

## Evidence and architecture before

Worker-first static assets serve Vite HTML; the Worker performs metadata reads,
then calls the read API in-process to render hydratable React HTML. Documents use
`no-store`; no shared data cache exists. Hydration already reuses the bootstrap.
Normal anchors and GET forms reload the document. Benchmark-version rendering
loads a second, up-to-500-row result set only to discover company tabs. Homepage
issues four in-process API calls (seven SQL queries). Search loads its full
name/alias catalogue for every submitted query; typing itself sends no requests.

The disposable Miniflare D1 fixture uses the existing Sep 25 production export
(92 models, 53 families, 104 versions, 594 results), with migrations 4/5 added to
match current schema. It does not include later provider corrections. Representative
local counters: homepage 2,686; model 7,273; version 16,927; organization 12,160;
exact selection 103; search 4,721 rows read. All request queries write zero rows.
Raw before plans and counters are retained with the final report.

Plans show whole-results window ranking repeated for counts/lists, scans of
precision date peers, alias scans despite unrelated normalized-name indexes,
and repeated indexed metadata lookups for exact pages. No per-row API N+1 exists,
but correlated SQL has equivalent read amplification. Crawlers, 805-document
verification, and many links multiply this uncached cost; DAU alone cannot
explain traffic. No claim about actual bot counts is made without analytics.

## Query changes before caching

Replace whole-table latest ranking with series-scoped indexed anti-existence,
preserving precision-aware ties and immutable result-key ordering. Index series
lookups, expression date peers, alias owner/name lookups, and model company
selection. Remove unnecessary joins from unfiltered result counts. Scope latest
models to the requested organization. Memoize repeated metadata reads within a
request. Return an additive `available_companies` field from benchmark-version
API using a DISTINCT scoped company query; existing public response fields remain
unchanged. Client fallback remains compatible with older responses. Measure
plans/counters before accepting changes; avoid speculative indexes.

## Volatility and dependencies

Reference names/slugs/numbers/aliases/metrics/evaluators are very stable. Entity
metadata changes rarely. Historical results remain retained; additions can change
latest results and unique exact-result eligibility. UI sort/page/filter states
are deterministic, but arbitrary search/filter text creates unbounded cardinality.

A singleton D1 revision token is maintained by INSERT/UPDATE/DELETE triggers on
all public and integrity tables. Triggers participate in the approved ingestor's
existing atomic batch. Dry-run/duplicate/rollback do not change the token. This
also covers compare-and-set corrections and citation changes without a second
write path. No public mutation endpoint exists. One global revision is deliberate:
the dataset is small, writes are controlled/rare, and search, sitemap, directories,
company relationships and exact eligibility have broad overlapping dependencies.
Minor writes invalidate all entries logically; old entries expire physically.
This trades some extra cold work after writes for complete dependency coverage.

## Shared edge cache

Use Cloudflare Cache API because this Worker generates HTML and D1 JSON directly,
with no origin fetch that could use CDN fetch caching. HTTP headers alone do not
establish this application's shared cache. Cache API is per data center; it does
not provide tiered caching. No new storage service or canonical database is added.

Keys include request origin, deployment build identity, revision, resource kind,
path, and sorted parameters. API parameters are validated before lookup and
explicit defaults are normalized. HTML keeps semantically relevant query state
(including defaults that change noindex), while parameter order is normalized.
Unknown/malformed/duplicate parameters bypass caching. Arbitrary q responses are
not stored at the edge; search catalogue is cached privately under the revision,
so varied queries do not reread all names/aliases. No user data is cached.
Authorization and non-Access cookies bypass shared cache. Staging Access remains
upstream and its Access cookie is not part of public Registry data; all staging
keys use a distinct hostname and build. Set-Cookie/private responses are excluded.

Revision lookup reads one indexed row at most once per 60 seconds per active
edge location. Objects live for 24 hours under a revision key. Cached revision
freshness bounds write visibility to 60 seconds at edge; browser reuse adds at
most 60 seconds. New deployment identities prevent serving old JS/HTML together.
An expired revision can only be used on lookup failure for up to five minutes.
Only a matching, previously successful object may then be served. Once a newer
revision is observed, an old object is never used. Object miss + D1 failure returns
500; errors, quota responses, malformed requests, and 404s are never stored.
Cache storage failure falls back to D1; it does not turn valid data into an error.
Cache writes run through execution-context waitUntil, outside the response path.
Cache diagnostics use response headers with counts/duration, no request metadata.

## Browser and interaction policy

Keep a bounded in-memory document cache (24 entries); seed it with initial HTML
and bootstrap so hydration sends zero fetches. Normal browser HTTP cache also
reuses public responses for 60 seconds. No canonical dataset mirror, IndexedDB,
search-history persistence, or new state dependency. Cached documents contain
route payload and metadata. A cheap revision endpoint validates expired entries;
matching revision renews them, mismatches discard them. Failures do not renew
stale browser entries indefinitely.
Known documents can display immediately for up to five minutes while revision
checks run quietly. New observed revisions retire previous tokens, preventing a
delayed older response from reintroducing them. Refreshes revalidate HTTP cache.

Enhance real same-origin anchors and GET forms with document fetches, bootstrap
parsing, metadata replacement and history/popstate, keeping AppShell mounted.
Preserve native modified clicks, downloads, external links, fragment navigation,
unknown routes and direct reloads. Abort obsolete requests and ignore stale
completions. Valid cached content renders immediately. Keep previous useful
content for the first 150 ms of uncached transitions, then show the destination
skeleton if still waiting. Cached transitions never show a skeleton.

Sort locally only with a complete loaded set and exact server-compatible text
keys/ties. Partial pages and fields lacking canonical sort keys use cached document
navigation. Pagination remains 50/100/500 with real hrefs and cache reuse. Filters
continue server semantics with cancellation. Search remains submit-driven, has
cancellation and bounded memory reuse for identical queries; no typing storms.
After the user's first-click feedback, prepare the three main navigation links
after hydration and links on hover/focus/touch intent. Requests use an edge-only
header: fresh cached revision and object return content, otherwise 204 without
any D1 read. Bound preparation to three concurrent requests and 24 destinations
per mount; arbitrary search states are excluded. No origin warming or bulk
entity/pagination prefetch occurs. Cached/prepared click targets aim below 250 ms;
an entirely cold network destination still depends on transport latency.

## Assets, validation and execution

Production baseline bundle is 277.75 kB (81.47 kB gzip), not the previously quoted
480 KiB unused JS. Inspect route splitting and logos against the current build;
retain SSR parity and avoid route-loading waterfalls for a small measured gain.
Fingerprint assets receive immutable one-year browser caching. No redesign.

1. Capture reproducible local counters and plans (done before edits).
2. Apply non-destructive performance/revision migration and query changes; compare.
3. Implement edge safety/revision/cache tests and browser navigation/reuse tests.
4. Run all app, ingestor, offline link, lint/type/build checks; inspect contracts.
5. Apply migration/deploy staging; bounded authenticated Access checks and browser
   interactions, cold/warm headers and quota/error simulation.
6. Only after staging passes, migrate/deploy production and make bounded
   representative checks. Never execute full live crawl/link/SEO tools.
7. Record actual Lighthouse evidence, capacity scenarios, limits and final state.

Correctness review: results/precision/redirects are unchanged; missing URLs retain
404; exact and ambiguous indexability is computed against canonical D1 per revision;
SEO/canonicals/crawlable hrefs remain SSR-generated; staging noindex/robots/Access
and D1 isolation are untouched. Later P11.10–12 work is excluded.
