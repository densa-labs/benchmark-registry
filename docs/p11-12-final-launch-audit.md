# P11.12 — Final Launch Audit

Audit date: 2026-09-29 (Asia/Manila). Status: complete.

Scope: verify P11.1–P11.11 frozen launch contracts; fix only evidenced launch
blockers or minimal regressions. Preserve existing uncommitted work. No release,
tag, billing changes, destructive production tests or post-release features.

## Audit inventory established before code changes

| Group | Release-critical checks | Evidence strategy |
| --- | --- | --- |
| Product/data integrity | Counts, provenance, relationships, aliases, redirects, result-level reasoning, text identifiers and namespaces | Deterministic schema/ingestor tests, bounded maintenance status and published inventory |
| Navigation/routes | Frozen directories/details, legal routes, query/pagination, redirects and true 404s; homepage ordering/directory and non-sortable Score | App/Worker tests and fixed staging-first live sample |
| Search | Exact/alias/normalized/combined/version/prefix/fuzzy/Registry No./ambiguous/no-result semantics; published search objects | Search regression tests and representative live queries |
| Exact-result behavior | 537 approved, 57 controlled ambiguous, exact-version metadata/canonical/provenance; redirects excluded | Deterministic inventory and bounded live samples |
| SEO/indexing | Initial titles/description/OG, canonicals, query noindex, staging block, apex redirects, sitemap composition | SEO tests, sitemap inventory and live headers/HTML |
| Internal linking | All canonical entities reachable, full model directory, versions/results/legal discovery, no broken/wrong-origin targets | Existing offline link/graph tests |
| UI/responsive | Frozen identity, light/dark/system, header/mobile menu, footer/timestamp, favicons and usable reflow | Regression tests and bounded rendered Chromium checks |
| Performance/materialization | Public KV+ASSETS only, zero D1, coherent generations, incremental dependencies, failure protection, navigation caches and bounded memory | D1-trap tests, maintenance status, deployed bindings/counters, builds and Lighthouse |
| Accessibility | Landmarks/headings, skip/focus/menu/search/theme/table ARIA, errors/loading, reduced motion, legal and 200% reflow | Existing regressions and representative rendered axe/keyboard checks |
| Legal/privacy/contact | Live policy truthfulness, Support mailto, persistence/traces/beacon disabled, storage/telemetry | Deployed settings, fixed legal/network/storage sample and sanitized event evidence if accessible |
| Staging/production isolation | Access, noindex/robots, distinct namespaces and environment title/banner/favicon/diagnostics | Environment guards, deployed settings and staging-first live verification |
| Deployment/configuration | Build identity, public/maintenance bindings, domain/assets, secrets/history hygiene, license and operational artifacts | Build/config guards, sanitized API reads and bounded source/history scan |
| Operational recovery | CURRENT/PREVIOUS/last-good validation, no pending journal, status/incremental/bootstrap/rollback/GC documentation | Read-only maintenance checks and deterministic publication/recovery tests |

Severity: BLOCKER prevents release; SERIOUS requires impact investigation;
MODERATE/MINOR may be deferred when launch contracts and practical usability hold.
The evidence and final decision below complete this inventory.


## Deployment identity and audit boundaries

Production remains version `3fc7d7ee-521c-4105-937f-39b2868d1b19`, deployed
2026-09-28 14:01:23 UTC, built **14:01:12 UTC**. Staging remains version
`a4a7e484-04ad-4a07-8a0d-61c60c96ab18`, deployed 13:59:55 UTC, built
**13:59:37 UTC**. Their privately inspected compiled Worker build ID is
`37969bbe53c0-dirty`. The viewer-local footer reproduces these timestamps with
UTC+08:00. These builds included P11.9–P11.11 changes before those changes were
committed; a clean deployed commit must not be invented. During this audit those
pre-existing phases became committed; final source HEAD is
`f61badc9a9ffbfc248a0412f9c53b79baf6aec10`. P11.12 did not create those commits.

No application behavior, canonical data, publication pointer, deployment, Access
policy, billing, security setting or privacy setting was changed by P11.12.
Only this report and sanitized audit receipts were added. Read-only maintenance
requests are distinct from public traffic and their bounded D1 cost is disclosed.
No public 808-page crawl was run. The full inventory/graph was rendered locally.

## Data integrity, numbering and published state

| Contract | Verified value |
| --- | ---: |
| Models | 92 |
| Benchmark families | 53 |
| Benchmark versions | 104 |
| Results | 594 |
| Organizations | 15 |
| Model aliases / benchmark aliases | 45 / 5 |
| Approved exact states | 537 |
| Controlled ambiguous states | 57 |
| Canonical sitemap URLs including legal | 808 |
| Redirected model records in current dataset | 0 |

Replayed every migration and approved production batch into a clean disposable
SQLite database using the controlled ingestor. Foreign keys, text Registry Nos.,
namespace ownership, metric/version relationships and required primary provenance
validate. All 594 immutable result keys and evaluator-set hashes were recalculated
and match. Reasoning is absent from models and remains attached to results.
Replay tests preserve published numbers and result rows through provider/date
corrections. Schema/ingestor tests cover duplicate identity, alias collisions,
release precision, dates, sequence append rules and redirect chains/cycles.
No primary evidence was replaced or guessed, and no identifiers were renumbered.

Allocated prefixes are exactly `00, 10, 15, 20, 30, 35, 40, 50, 60, 70, 80, 90,
110, 120, 130, 140, 150, 160, 170`. Prefix `100` remains unallocated. Ownership
uses the explicit namespace/provider allow-list, including standalone AI units;
these relationships do not infer legal ownership. Registry Nos. remain text with
three-digit sequences `001`–`999` and immutable reserved identities.

Both deployed materialized manifests independently validate all **272 inline
objects** against their hashes and schemas, complete references, search
relationships, counts and exact-state inventory. Only three KV REST values per
environment were needed: publication, last-good and the bootstrap manifest.
The immutable bootstrap bundle contains the complete dataset; this avoided
hundreds of remote object reads. Standalone copies of every object were not
re-read because the validated inline bundle is the active serving representation.

| Environment | CURRENT generation | Canonical revision | Journal watermark |
| --- | --- | --- | ---: |
| Production | `c43aa32558574636ac9e202016920931` | `78346a0a8f5436c82c13431e3bba98e1` | 0 |
| Staging | `a6d618c20a164a4e9dfe161e5f1bd156` | `9ceefb0e821e3d13a269fab1d1571e65` | 0 |

Published revisions/watermarks match canonical state in both environments.
There is no pending work or data change since bootstrap. One bounded canonical
count/revision query per environment reads **860 rows**, writes zero; the staging
status command additionally reads two rows. This maintenance cost is not a public
request cost. Both last-good pointers reference their valid bootstrap CURRENT.
**PREVIOUS is absent because neither environment has published a second data
generation.** This is expected initial-publication state, not failed protection.
Last-good protects pointer recovery now; older-data rollback becomes available
once a successful later publication retains PREVIOUS. No fake data was published
to manufacture a previous generation.

Evidence: [data integrity](p11-12-data-integrity.json),
[production publication](p11-12-production-materialization.json),
[staging publication](p11-12-staging-materialization.json),
[compiled deployment identity](p11-12-deployed-build.json).

## Routes, homepage and entity presentation

Staging passed before the final production sample. Fixed HTTP samples include
home, all three directories, model, family, version, organization, approved exact,
models page 2, company-filtered benchmark, unknown model/family/version/company,
generic 404, legal child 404, legal/privacy/terms and invalid API parameters.
All expected successful documents return 200; unknown entity/version/child routes
return accessible 404 shells, one H1 and noindex. Unsupported Score sorting,
`limit=All` and unknown parameters return 400. Errors expose no exception or
visitor details and do not query D1. Initial HTML contains meaningful content,
metadata and a serialized hydration document. Legal routes require zero KV reads.

The full local materialized Worker audit renders **808 canonical documents plus
ordinary pagination/history states: 1,237 documents**, and resolves **5,371 unique
internal targets** directly. No broken target, redirect target, wrong origin,
orphan, unreachable canonical entity or invalid exact-result link was found by
the existing graph verifier. A throwing D1 stub records **zero calls** throughout.
The homepage directory links every model and alphabetical groups; Recent Models
and Recently Added retain release-date and published-at ordering respectively.
No Top Models section or ranking is introduced. Hydration performs no duplicate
initial API fetch in fresh staging/production browser sessions.

Entity and rendered table tests retain model release/company/source/Registry No.,
version-specific evaluator/release/metric, local search, dynamic company tabs,
latest/history, links, precision-aware ordering and pagination. Organization
columns remain **Model | Benchmark | Score | Source | Registry No.** All Score
columns remain non-sortable. Result-level reasoning and source links survive.
GPQA Diamond exercises substantial retained history (56 results in the published
version object). Page sizes remain exactly 50/100/500, default 50, with shareable
URL state and no All. Existing tests verify complete-data local sorting while partial or
precision-sensitive data keeps materialized/server semantics.

Evidence: [offline inventory](p11-12-offline-inventory.json),
[internal graph](p11-12-internal-links.json),
[staging HTTP](p11-12-staging-http.json),
[production HTTP](p11-12-production-http.json).

## Search and exact-result states

Both live environments pass explicit assertions for `gpt`, Registry No. `10001`,
`GPT-4.1 GPQA`, reversed `GPQA GPT-4.1`, exact `GPQA Diamond` version intent,
`gpt-4.1-2025-04-14` alias, NFKC full-width model name, `claud` prefix,
`anthropci` conservative typo and a deliberately unmatched query. Forward/reverse
combined queries and version-aware intent return the same appropriate exact
`direct_href`; canonical/alias/normalized names resolve the correct model;
no-result stays empty. Automated search tests additionally cover ambiguity,
conservative fuzzy navigation and ranking boundaries. Published entity and
relationship objects validate; arbitrary queries create no KV objects, D1 scans
or persistent search history.

Manifest inventory proves **537 approved / 57 ambiguous** without requesting all
594 live states. All approved local canonical states are indexable, unique and
exact-version scoped. Live approved sample is GLM-5.2 on AutomationBench 1.0.6,
with that title and exact canonical URL. The additional live ambiguous GPQA
Diamond state returns 200, noindex and the parent version canonical in both
environments. It is absent from the canonical inventory. Redirect eligibility,
source/provenance, malformed/unrelated keys and ambiguous filtered contexts remain
covered by deterministic tests. Current production contains no redirects; 308
stealth behavior is verified with fixtures, not a fabricated live record.

## Metadata, canonical origins and indexing

Production home/index/entity/version/exact/legal titles, descriptions and OG
conventions retain the P11.5 generator in initial HTML and on client navigation.
Live examples include `Benchmark Registry`, `Models | Benchmark Registry`,
`Benchmarks | Benchmark Registry`, `GPT-6 Astra | Benchmarks`,
`GPQA | Benchmarks`, `GPQA Diamond | Results`, `OpenAI | Benchmarks`,
`GLM-5.2 | AutomationBench 1.0.6`, and all three legal titles. Canonical origin
is HTTPS apex; query pagination/filter states retain base canonicals/noindex;
approved exact URLs retain their exact canonical. No global production noindex
or metadata flash was observed. APIs retain `noindex, follow`.

**Resolved wording difference:** the P11.12 prompt listed
`Organizations | Benchmark Registry`; the frozen P11.5 report, tests and live
`/companies` title are `Companies | Benchmark Registry`. The user explicitly
selected preserving P11.5 and documenting the difference. That wording is
therefore the accepted audit baseline; it is not an unresolved launch defect.

Production robots allows intended crawling and advertises the reachable sitemap.
Staging robots disallows all. Both sitemaps contain **808** unique HTTPS apex URLs:
1 home + 3 directories + 92 models + 53 families + 104 versions + 15 organizations
+ 537 approved exact states + 3 legal pages. The materialized data inventory has
805; the Worker adds three static legal routes, explaining the final count.
Only approved exact URLs use the frozen `view=history&result=` query form; no
arbitrary search/filter/page query, ambiguous state, mailto, staging/www origin
or redirect is promoted into the sitemap.

Redirect samples preserve `/models/10001?q=gpt`: HTTP apex → HTTPS apex **301**;
HTTP www → HTTPS www **301** → HTTPS apex **308**; HTTPS www → apex **308**.
No loop or lost path/query occurs. Technical readiness does not depend on actual
search-engine indexing/ranking or indexing lag.

## UI, interaction, accessibility and browser coverage

Chromium rendered checks cover staging desktop 1440 and mobile 390 px in Light
and Dark, production representative mobile routes, both environment legal pages
at both widths/themes, and separate fresh-session/home/asset checks. Visual
inspection of generated Light/Dark captures retains the official mark, wordmark,
system font stack, restrained data layout, table links and footer. The observed
body font is `-apple-system, system-ui, Segoe UI, sans-serif`; no external font
request or image dependency was found. The locally installed Geist packages are
not an external font request and do not replace the observed system body stack.

Staging has red banner/favicon and exact `STAGING | Benchmark Registry` title.
Production has normal titles, all three expected favicons and no staging markers
or browser diagnostics. Fresh System is selected; one theme radio is active;
Light/Dark persistence and native arrow keys pass. Footer Legal, themes, GitHub,
Last updated toggle and viewer-local build timestamp with UTC offset pass.

The existing keyboard audit checks skip-to-main visibility/focus, mobile
Space/open, search-first Tab order, results, nested Escape, menu close and focus
restoration, hidden-menu exclusion, keyboard table scrolling, one active
`aria-sort`, page/local-search announcements, cross-page H1 focus, cached route
focus, theme controls and footer order. Reduced-motion behavior, static hidden
skeleton semantics and an injected **staging browser navigation failure** retain
an accessible shell/alert. No production publication was damaged.

Axe checks have **zero violations**: staging 44 core/interaction + 12 legal checks;
production 9 core/interaction + 12 legal checks. Contrast `incomplete` results are
not silently counted as passes; existing token measurements, rendered contrast
checks and visual inspection complement them. All 28 focused accessibility
regressions pass. Landmarks, one H1, headings, named searches, table captions and
scoped associations, touch/focus rules, 404/error/loading states and route focus
remain covered. Legal support SVG is decorative, mailto has the correct accessible
name, dates/headings/canonicals and initial HTML are correct.

320 px with **200% text sizing** passes core/menu/footer and all legal pages in
Light/Dark. The separate disposable Chrome native-page-zoom rerun verifies the
actual CSS viewport/DPR ratio for **200% page zoom** and menu/footer usability;
this does not modify the user's browser profile. Chromium screenshots and real
keyboard automation were performed, with limited agent visual inspection.
Safari/WebKit and Firefox binaries were not available for practical final runs.
No physical Safari/Firefox session, mobile touch device, VoiceOver or NVDA was
performed or claimed. These coverage gaps are non-blocking absent a demonstrated
device-specific failure, and remain explicit limitations.

Evidence: [staging browser](p11-12-staging-browser.json),
[production browser](p11-12-production-browser.json),
[staging legal browser](p11-12-staging-legal-browser.json),
[production legal browser](p11-12-production-legal-browser.json),
[additional hydration/identity/ambiguous-state checks](p11-12-extra-browser.json),
[native 200% Chrome zoom](p11-12-staging-native-zoom.json).

## Materialized reads, performance and capacity

Deployed bindings and generated config both show isolated environment READ_STORE
KV + ASSETS, **no public D1 binding**. Private deployed Worker inspection finds no
canonical model-serving SQL; canonical repository stays producer/reference-only.
Live home/model/family/version/company/exact/search/page/filter requests all report
**0 D1 queries / 0 D1 rows**, with the fixture D1 trap providing independent
behavioral evidence rather than inferring zero from account analytics. Fixed
samples used one KV read per normal data request; legal/assets/robots use zero.
Published generation identity matches the appropriate environment. Public errors
and materialization failures never have unrestricted D1 fallback.

Fresh repeated production home/API requests confirm miss → hit → hit while still
using one pointer KV read and zero D1. The older verifier's mandatory-hit assertion
failed on an earlier staging transport sample; changing the **temporary audit
copy** to record misses did not weaken correctness assertions. This was not a
production code fix. cloudflared also had a transport timeout; a single existing
Access token with direct HTTP transport completed the fixed sample. Neither issue
was hidden or misrepresented as a core-route failure.

The application suite checks shell preservation, immediate cached documents,
back/forward state, 150 ms cold skeleton, cancellation/stale-response protection,
bounded 24-document and 16-search caches, generation retirement, no persistent
search history, local safe sorts and accessible focus. Deterministic publication
tests pass for missing/corrupt CURRENT manifest, whole-request PREVIOUS fallback,
coherent generations, failed validation/publication, rollback, last-good,
environment isolation and GC protection. No destructive production test was run.

An additional full canonical in-memory incremental run proves no-op rebuild **0**,
one result **6 objects**, a 50-result batch **22**, entity metadata **13**;
**248 unchanged hashes** are reused. Search relationships and inventory update
with results; search entities update for metadata. The resulting disposable
candidate validates. Its changed exact-state counts are local test effects only;
production remains 537/57 and no remote write occurred.

Production rebuild: JS **308.02 kB raw / 90.08 kB gzip**, CSS **26.54 / 5.79 kB**.
The deployed JS is 307,996 bytes. Staging rebuild JS 309.05 / 90.43 kB. There is no
material unexpected growth over the deployed P11.11 artifact. Fingerprinted asset
responses use `public, max-age=31536000, immutable`, with zero Registry KV/D1.

### Final isolated homepage Lighthouse

| Profile | Performance | Accessibility | Best Practices | SEO | Agentic Browsing | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 98 | 100 | 81 | 100 | 100 | 958 | 958 | 150 | 0 | 2,541 |
| Desktop | 100 | 100 | 77 | 100 | 100 | 320 | 320 | 0 | 0 | 1,034 |

Both pass the existing performance/LCP/TBT/CLS gates. Relative to P11.10's 98/97,
100/100 accessibility and SEO, there is no material application performance or
semantic regression. Both still report Cloudflare Precursor's two deprecations.
Desktop additionally reports a CSP inspector issue touching app/challenge and
prefetch URLs, lowering Best Practices to 77. A separate DevTools issue capture
did not reproduce that CSP issue; hydration, navigation and client-error checks
all passed. No enforced app failure was observed. The transient inspector finding
is documented as non-blocking, without asserting an unproven root cause or
weakening Cloudflare protections to improve a score.

Actual plan remains Workers Free / Free Website; signed-in aggregate view reports
approximately 4.24k requests, 2.95k Worker invocations and **0 Worker errors** in
24 hours (account context only). Official current limits are Workers Free
100,000 requests/day and 10 ms nominal CPU; KV Free 100,000 reads/day,
1,000 writes/day and 1 GB storage. At roughly 1–2 reads/data request, practical
KV/Worker ceilings precede D1. Quotas are account-wide, and these figures do not
promise a fixed number of visitors. Eventual propagation and CPU/network variation
remain operational constraints; current observed traffic/errors do not establish
an immediate capacity blocker. No plan/billing or architecture change was made.
Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[KV limits](https://developers.cloudflare.com/kv/platform/limits/).

Evidence: [cache sample](p11-12-cache-sample.json),
[incremental audit](p11-12-incremental.json), [Lighthouse](p11-12-lighthouse.json).

## Legal, privacy, contact and security

Legal hub, Privacy Policy, Terms and `mailto:support@benchmarkregistry.org` are
live, initial-rendered, self-canonical, linked and included once in the sitemap.
Their dates and semantics match P11.11. Support link has no provider/delivery
claim; no email was sent. Metadata, keyboard focus, Light/Dark and reflow pass.
The policy accurately distinguishes Cloudflare delivery/security processing,
legacy log retention, minimized app diagnostics, optional voluntary support,
ordinary browser history/storage and external links.

Deployed settings remain normalized `observability=null`, Logpush false, no tail
consumers and no D1 binding; generated configuration independently requires
invocation persistence off, custom persistence off, traces/persistence off,
query redaction on and no export destinations. The signed-in production AND
staging dashboard says **Workers Observability is Disabled** after controlled
requests. Web Analytics lists benchmarkregistry.org **Disabled**. Bounded browser
network checks find no external telemetry/beacon/font/image request; same-origin
Cloudflare Challenge Platform remains active as disclosed. Production app console
has no staging diagnostics; sanitized failure logging retains fixed category/build
only and no raw request or exception serialization.

No new sensitive application-log retention was found. **A fresh stored-event
count is not claimed:** the disabled dashboard does not expose event-query results.
The P11.11 independent stored-event inspection remains historical evidence;
fresh settings and dashboard state confirm persistence stays disabled. Separate
Cloudflare security records and expiring old logs were not erased or inspected
as visitor payloads, and are disclosed by the live policy.

Fresh browser sessions store only the explicit theme in localStorage plus
Cloudflare's known `_cfPre_tabId` security session key where observed; no app
cookies, IndexedDB, Cache Storage, service worker, advertising/session replay or
unexpected analytics store was found. In-memory public/search caches and ordinary
HTTP/history storage match the policy. No cookie banner was warranted or added.
Mailbox provider, deletion schedule, actual delivery and jurisdiction-specific
legal review remain unverified; no details were invented.

Header inspection: HTTPS is enforced by redirects; HTML has correct content type.
HSTS, nosniff, X-Frame-Options, Referrer-Policy, CSP and COOP were absent in the
sample. These are optional hardening candidates, **MODERATE**, not established
exploitable launch defects for this public read-only registry with no authenticated
production writes/forms. Source escaping, read-only routes and current browser
behavior passed; this is a bounded assessment, not a penetration-test claim.
No blanket headers, Trusted Types policy or security setting was introduced
without demonstrated compatibility/necessity.

Scanned **444 reachable Git blobs** and current nonignored files with bounded
private-key/AWS/GitHub/OpenAI/long quoted secret signatures: no credential matches,
tracked .env/.wrangler artifacts or DATA_LICENSE files. Apache-2.0 remains intact.
Ignored credentials/checkpoints/build/test caches stay local; temporary large
fixtures/screenshots/raw Lighthouse reports remain outside the repository. Only
sanitized summaries are added; challenge request identifiers were removed.
A pattern scan cannot prove absence of every arbitrary secret format.

Evidence: [production controls](p11-12-production-observability.json),
[staging controls](p11-12-staging-observability.json),
[dashboard state](p11-12-observability-dashboard.json),
[source hygiene](p11-12-source-hygiene.json).

## Operational recovery readiness

Existing [P11.9 runbook](p11-9-performance-report.md) documents explicit
environment selection, bootstrap, incremental retry, rollback and GC plan.
Operators can answer whether canonical D1 is ahead or pending with:

```sh
# From app/, staging before production; these examples are read-only.
npm run materialize -- --environment staging --status
npm run materialize -- --environment production --status
npx wrangler kv key get publication --binding READ_STORE --config wrangler.jsonc --env production --remote
npx wrangler kv key get last-good --binding READ_STORE --config wrangler.jsonc --env production --remote
```

Publication exposes CURRENT and PREVIOUS when retained; last-good exposes the
verified recovery descriptor. Compare manifest canonicalRevision/watermark with
status; immutable manifest keys are `manifests/<hash>`. Current audit confirms
valid bootstrap CURRENT/last-good and no pending work. A future operator can
regenerate with explicit `--environment production` after staging validation;
bootstrap refuses an existing publication. Retry verifies canonical state and
immutable references instead of blindly replaying a checkpoint. `--rollback`
requires retained PREVIOUS; currently no older data generation exists.
`--gc-plan` protects CURRENT/PREVIOUS/last-good and only lists eligible old objects;
GC execution is intentionally not implemented. No rollback, bootstrap, GC deletion
or fake remote update was performed during this audit.

## Automated verification and limitations

| Check | Fresh result |
| --- | --- |
| Full app suite | 376 passed; 1 opt-in local D1 test skipped in default run |
| Focused accessibility suite | 28 passed, already included in app suite |
| Python pytest | 89 passed; 1 remote disposable-D1 test skipped because credentials absent |
| Offline Python link verifier tests | 8 passed |
| Full materialized offline inventory/graph | Passed: 808 canonicals, zero broken/unreachable/orphan targets, zero D1 trap calls |
| Full canonical replay/hash/relationships | Passed |
| Full-dataset local incremental audit | Passed: no-op, one result, batch 50, entity metadata and hash reuse |
| Typecheck / ESLint / Ruff | Passed |
| Production / staging builds and environment/privacy guards | Passed |
| Lighthouse thresholds | Passed mobile and desktop |
| Diff/whitespace and frozen-contract review | Passed; no application diff introduced |
| Optional Miniflare canonical SQL performance audit | Attempted; timed out at its existing 120-second limit with full fixture |

The optional Miniflare run was not called a pass or silently omitted. Initial
local setup exposed an old Python symlink/source path, a dump-order issue and a
loopback sandbox restriction; these were corrected using the existing Python
3.12 runtime, explicit PYTHONPATH, dependency-ordered disposable fixture and
approved local listener access. The resulting optional legacy canonical SQL
baseline audit timed out. It does not exercise the deployed public serving path.
Equivalent full-data materialized SSR, integrity, incremental and D1-trap coverage
passed, so this remains a **non-blocking test-harness limitation**, not evidence
of broken public routing or D1 fallback. No timeout was increased or test disabled
in application code. The destructive/credential-dependent remote write probe was
not run or treated as a failure.

Both builds have the existing nonfatal Vite native-config import-extension
warning; no build failure. A sandbox-only Wrangler log-directory write warning on
the first staging build was avoided on later commands by a temporary log path.
Those local tooling observations do not change deployed privacy controls.

Manual/agent inspection actually performed: limited Chromium Light/Dark image
review, signed-in dashboard read-only observability/analytics state, source/config
review, report/diff review. Browser route, keyboard, focus, contrast, storage,
network and reflow checks were automated real-browser checks, not physical-device
certification. No physical screen reader/mobile/Safari/Firefox, email delivery,
mailbox retention inspection, destructive production recovery test, full external
penetration test or search-engine ranking/index completion check was performed.

Fresh command results: [verification receipt](p11-12-verification.json).

## Findings, deferred issues and release decision

**BLOCKER: none. SERIOUS unresolved findings: none.** No release-blocking data,
route, search, SEO, exact-state, accessibility, privacy, publication, isolation,
secret or persistent-5xx regression was found. No application fix was necessary.

| Severity | Known limitation / deferred issue | Impact and launch assessment |
| --- | --- | --- |
| MODERATE | Workers/KV Free quotas, nominal CPU ceiling and account-shared capacity | Operational ceiling; sampled traffic/errors do not show immediate exhaustion. Monitor and plan capacity separately; no billing change. |
| MODERATE | Eventual KV propagation, cold latency and manual producer retry | Immutable bundles, whole-request fallback and durable pending checks preserve correctness. No pending work now. |
| MODERATE | Optional security headers absent | Useful future compatibility-reviewed hardening; no direct practical release-blocking exploit established. |
| MODERATE | Physical screen-reader/device and Safari/Firefox coverage unavailable | Strong Chromium/axe/keyboard/reflow evidence, no known device-specific defect; coverage limitation remains explicit. |
| MINOR | Bootstrap has no PREVIOUS data generation | Valid last-good protects pointer recovery; older-data rollback becomes available after next valid publication. Do not claim a live older-generation rollback exists now. |
| MINOR | GC remains plan-only; retry is not automatic | Documented operations remain usable; no immediate storage pressure or pending failure. |
| MINOR | Cloudflare deprecations/transient desktop CSP inspector warning | Best Practices variation with no reproduced functional failure; app performance/a11y/SEO pass. |
| MINOR | Disabled dashboard cannot enumerate fresh stored events | API config + visible disabled observability/beacon state verified; no fabricated fresh event count. |
| MINOR | Optional local Miniflare audit timeout | Full-data materialized/deterministic coverage passes; legacy baseline harness limitation disclosed. |
| MINOR | Mail provider/retention/delivery and jurisdiction-specific legal review unverified | Policy avoids unsupported promises; Support mailto is correct and no email was sent. |
| MINOR | Existing Vite config warning | Both current builds/guards succeed; future tooling compatibility work can be deferred. |

The user-approved preservation of the frozen Companies index title resolves the
prompt wording discrepancy. It is not an unresolved release issue.

Benchmark Registry v2 satisfies the accepted frozen launch contracts based on the
evidence collected. This GO decision does not certify a perfect system or the
unperformed tests listed above.

## Final release checklist

```text
Production core routes healthy: YES
Production canonical metadata correct: YES
Production indexing configuration correct: YES
Staging remains protected/noindex: YES
Sitemap valid: YES
Internal-link verification passed: YES
Search contracts intact: YES
Approved exact-result states intact: YES
Ambiguous exact-result controls intact: YES
Registry numbering/integrity intact: YES
Materialized read architecture active: YES
Normal public traffic queries D1: NO
Normal public D1 rows per representative request: 0
Materialization pending work: NO
CURRENT generation valid: YES
PREVIOUS/last-good recovery protection valid: YES
Unrestricted public D1 fallback exists: NO
Accessibility release checks passed: YES
Legal hub live: YES
Privacy Policy live and accurate: YES
Terms live: YES
Support mailto live: YES
Persisted application request logging remains disabled/minimized as documented: YES
Production/staging isolation verified: YES
Release-blocking secret exposure found: NO
Core automated tests passed: YES
Launch blockers remaining: 0
```

The recovery checklist YES means valid last-good now and tested PREVIOUS behavior;
it does not mean an older live PREVIOUS exists at bootstrap. Browser/legal/privacy
and test-coverage limits above remain part of this decision.

**Final release readiness decision: GO**

**P11.12 complete: YES**

**Post-release roadmap work was not started.** No release or tag was created.
P11.12 stops here.
