# P11.9 — Performance, materialized reads and interaction speed

Completed September 28, 2026. Scope stops at P11.9. The edge-first architectural
amendment supersedes the earlier origin-cache experiment. P11.1–P11.8 product,
numbering, provenance, search, exact-result and SEO contracts remain intact.

## Result

Public D1 reads per normal page load before: **2,686 rows on the homepage;
22–16,927 rows across the representative route sample.**

Public D1 reads per normal page load after: **0 rows, cold or warm.**

| Completion statement | Result |
| --- | --- |
| Materialized read architecture active | YES |
| Normal public traffic queries D1 | NO |
| No-op ingestion triggers regeneration | NO |
| Incremental affected-object regeneration verified | YES |
| Coherent generation publication verified | YES |
| Previous-generation fallback/rollback verified | YES, deterministic failure/rollback tests |
| Edge failure causes unrestricted D1 fallback | NO |
| P11.9 complete | YES |

P11.10 was not started.

## Before, audit and retained query improvements

Before: `public request → D1 → metadata + in-process API → React SSR → hydration`.
Hydration already reused the initial payload; it was preserved. Ordinary anchors,
sorts and GET forms reloaded the document. No shared read store existed.

The local Miniflare audit uses the existing September 25 canonical export: 92
models, 53 benchmark families, 104 versions and 594 results. It adds subsequent
schema migrations locally; it does not crawl production. Rows read come from D1
statement metadata, and the evidence includes actual EXPLAIN QUERY PLAN output.
The fixture precedes later provider corrections, so display text is not claimed
to be a current production snapshot.

| Representative route | P11.8 D1 rows | Optimized canonical reference | Public materialized path |
| --- | ---: | ---: | ---: |
| Homepage | 2,686 | 2,134 | 0 |
| Models directory | 644 | 644 | 0 |
| Model 10001 | 7,273 | 95 | 0 |
| Model 10005 | 7,356 | 162 | 0 |
| Benchmark directory | 894 | 691 | 0 |
| GPQA family | 22 | 16 | 0 |
| GPQA Diamond | 16,927 | 1,516 | 0 |
| Organization directory | 642 | 642 | 0 |
| OpenAI | 12,160 | 2,247 | 0 |
| Approved exact result | 103 | 52 | 0 |
| Search `gpt` | 4,721 | 413 | 0 |
| Models page 2 | 644 | 644 | 0 |
| GPQA Diamond, company filter | 16,217 | 1,038 | 0 |
| Model scoped `gpqa` query | 7,260 | 82 | 0 |

A seven-request home/models/model/version/company/exact/search session read
44,597 rows before, 7,168 through optimized canonical queries, and zero through
the deployed public reader. D1 statements in the serving-reference audit wrote
zero rows. The former 5M-row/day model allowed about 112 such sessions/day before
optimization, or 697 after SQL optimization alone; those estimates no longer
describe the public architecture.

Root causes were a global latest-results window evaluated for scoped pages,
repeated precision-peer scans, unnecessary joined count queries, duplicate
metadata lookups, a second large result request just to discover company tabs,
and a full search catalogue read on each public search. Changes retain frozen
ordering/tie-break semantics:

- Indexed series `NOT EXISTS` selects latest results without a global window.
- Count queries omit entity/metric joins when filters do not require them.
- Alias ownership, company/model scope, temporal precision peers and result-series
  covering indexes make scope/peer probes indexed searches.
- Company latest-model selection scopes its CTE to the requested company.
- Request-local metadata memoization eliminates repeated identity reads.
- `available_companies` removes the client's second up-to-500-row result query.
- Producer sort-field queries omit unused metric/company/benchmark joins and
  resolve scope identifiers through indexed lookups.
- Incremental sitemap inventory reuses prior inventory and changed version
  projections, rather than querying all canonical results again.

EXPLAIN evidence shows index searches for series/alias/precision lookups.
Complete directories still require sorting their small canonical sets. Search
catalogue generation and bootstrap intentionally read complete bounded sets;
they no longer run because a visitor submits a query.

## After: shared public read model

After: `D1 → controlled producer → immutable KV read state → public request`.

SSR, public API, crawler documents and client navigation share
`MaterializedRepository`. The SQL repository is used only by maintenance,
bootstrap and the explicitly internal shadow/audit adapter. The deployed public
Worker has **KV + ASSETS, no D1 binding**, and its compiled bundle contains no
canonical SQL repository. `/api/revision` returns a published generation, not a
D1 freshness query. Static assets and robots do not require Registry data.

There are 272 reusable logical objects in the initial generation:

| Logical scope | Representation and consumers |
| --- | --- |
| `models`, `benchmarks`, `companies` | Complete directory rows plus canonical sort/alias fields; lists, homepage, pagination, filters |
| `model:<registry_no>` | Complete history result projection and model metadata; model SSR/API and dynamic latest/history views |
| `family:<slug>` | Family metadata and versions |
| `version:<slug>:<version_slug>` | Complete version history, metadata, eligibility and company choices; version and exact-result SSR/API |
| `company:<slug>` | Organization metadata/latest model and complete result history |
| `stats`, `redirects` | Shared counters and frozen model redirects |
| `search-entities`, `search-relationships` | Entity/alias/version catalogue and result relationships |
| `inventory` | Published sitemap paths, including eligible exact states |

The read layer applies the original strict parameter validation, filtering,
sorting, latest/history selection and one-based 50/100/500 pagination to these
bounded projections. Canonical normalized date/source/alias keys are produced
once; public requests do not reconstruct them from SQL. Logical keys contain no
geography and no arbitrary search-query key.

Exact results resolve from their parent version, avoiding 537 duplicated result
objects. Initial HTML retains exact selection, title/canonical/robots metadata
and hydration payloads. Both live bootstraps verified 805 canonical URLs, 537
approved exact states and 57 ambiguous controlled states. Ambiguous states remain
noncanonical/noindex, and redirects remain excluded from exact eligibility.

Search uses the original P11.4 interpreter and ranking code, shared with the SQL
reference. The edge holds names, aliases, version identities and relationships;
it does not send the catalogue to browsers. Result writes regenerate relationship
data; entity/alias/version changes regenerate the relevant catalogue. No arbitrary
query objects or ordinary public D1 scans exist. Search/query render-cache bypass
still reads only published materialized data.

## Storage, generations and consistency

Private Workers KV namespaces are isolated:

- Staging: `0bc4e56c19ab4a95966f0c81fe13a579`.
- Production: `6063f8ffd85d416a9bc56c75ddf5ea12`.

KV was already available on the account. R2 inspection returned account error
10042, indicating R2 was not enabled; no account/billing change was made. KV's
eventual consistency and cached negative reads were explicitly considered.
[Cloudflare KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

Each logical object is an immutable SHA-256-addressed `objects/<hash>` value with
schema, logical identity, environment and typed projection. An immutable
`manifests/<hash>` value records the complete logical-key/hash mapping, unique
generation, canonical revision, change-journal watermark and timestamp.
`publication` references CURRENT and, after the first update, PREVIOUS.
`last-good` independently retains the prior valid descriptor.

Critically, each manifest **embeds every newly changed object in one coherent
inline bundle**. Bootstrap embeds the initial set; subsequent manifests embed
only changed payloads. Unchanged objects reference previous immutable hashes.
This measured duplication costs roughly 2.58 MB on bootstrap but avoids assuming
that hundreds of KV object writes become visible before a pointer write.

Publication protocol:

1. Acquire a producer lease; capture canonical revision and journal watermark.
2. Regenerate affected scopes and reuse unchanged hashes.
3. Confirm canonical revision/watermark stayed stable during the build.
4. Write missing immutable objects; verify every referenced object's hash/schema,
   entity references, exact eligibility, counts, search relationships and inventory.
5. Write and verify the immutable manifest. Confirm canonical revision again.
6. Retain `last-good`, then publish the CURRENT/PREVIOUS descriptor.

A reader resolves one generation for its complete response. A visible new
manifest carries its complete changed set. If its manifest or an unchanged
referenced object is missing/corrupt, the **whole request** retries PREVIOUS;
it does not mix projections or query D1. Exhausted safe materializations produce
a no-store service error. Cache API is an additional local cache of validated
immutable values and generation/build-keyed rendered responses.

KV propagation can expose an older complete generation at some locations. This
is per-generation coherence, not a globally simultaneous switch. Browser caches
reject a previously retired generation. Publication verification actually
encountered transient missing KV values on staging and production; the old
serving path stayed active, and bounded 30-second verification retries succeeded.

KV immutable objects have no expiration. The pointer uses KV cache TTL 30 seconds;
immutable binding reads use 86,400 seconds. Derived render cache entries use
86,400 seconds and include build identity plus generation; ordinary HTTP freshness
is 60 seconds. These timers control visibility/storage, never visitor-driven
D1 refresh. Cloudflare's Cache API is local to a data center, so separate requests
can observe different rendered-cache hit/miss states.
[Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/).

## Incremental dependencies and no-op behavior

Migration 7 records transaction-bound logical scopes for public-relevant changes,
including OLD and NEW ownership where required. The producer reads only journal
entries after the prior manifest watermark and carries all other hashes forward.
Migration 8 narrows UPDATE scopes: metadata edits do not rebuild counters, URL
inventory only changes for identity/ownership changes, and result score/date
corrections do not regenerate unchanged search relationships. Regression tests
assert these unrelated objects are skipped.

| Canonical change | Regenerated dependency scopes |
| --- | --- |
| Result/run/evaluator change | Affected model, version and company; result changes also stats, relationships and inventory |
| Model metadata/alias | Model/directory, company/latest-model directory, versions embedding it, search catalogue; applicable inventory/stats |
| Benchmark/alias/version | Family/version/directory, related model/company projections, search; version identity updates also relationships/inventory/stats |
| Company metadata | Company/directory, owned model projections/directory, affected version projections and search |
| Metric/evaluator metadata | Only families/versions and result projections embedding that metadata |
| Redirect | Redirect lookup, source/target projections and related versions/company, directories, search and indexing inventory |

Date-only result changes additionally affect same-day precision-peer scopes.
Those dependencies are required by existing canonical ordering; unrelated entity
objects are not regenerated. Non-public namespace/secondary-source bookkeeping
may change the canonical token without changing any read payload hashes.

Identical SQL UPDATE guards change neither revision nor journal. An ingestor
SKIPPED/dry-run/replay has no statements to commit and never invokes the producer.
A maintenance no-op costs one two-row state query and two KV descriptor reads,
with zero generation/object writes. Both live environments returned `NO_CHANGE`.

After a successful known staging/production remote ingestion commit, the CLI
invokes incremental materialization. Canonical commits are not rolled back if
publication fails: the ingestor returns exit 4 with `canonical_committed` and
`materialization_pending`, while prior published state remains live. `--status`
compares canonical revision/watermark with the published manifest. Retrying the
producer consumes pending journal entries; it never asks public Workers to
discover changes. Maintenance requires D1/KV-authorized credentials.

## Bootstrap, retry, rollback and GC operations

D1 bindings and migration commands live in `wrangler.maintenance.jsonc`; serving
configuration has no D1. From `app/`:

```sh
npm run db:migrate:staging
npm run materialize -- --environment staging --bootstrap --output ../docs/p11-9-staging-materialization.json
npm run materialize -- --environment staging --status
npm run materialize -- --environment staging
npm run materialize -- --environment staging --rollback
npm run materialize -- --environment staging --gc-plan
```

Use explicit `production` only after the staging gate. `--bootstrap` rejects an
already-published store; deployment never runs bootstrap. Initial bootstrap
copies the 17 canonical/revision/journal tables once into a foreign-key-validated
local SQLite transaction, runs the same canonical projections locally, performs
104 bounded shadow comparisons, verifies all KV references, and publishes.

Local `.wrangler/materializations/` candidate checkpoints and last-run receipts
are ignored operational artifacts. Immutable hashes make retries idempotent and
reuse already-written objects; a retry reconstructs the candidate and rechecks
canonical state rather than blindly publishing a checkpoint. This is retryable,
not a fully automatic resumable scheduler. Staging required two failed preparation
attempts before successful verification; failed attempts did not publish.

Rollback verifies the retained PREVIOUS manifest and republishes it with a fresh
generation identity, retaining the displaced CURRENT. D1 remains canonical and
pending until regenerated. The initial bootstrap has no earlier Registry
generation to roll back to; subsequent successful updates retain PREVIOUS.
Failure/fallback/rollback behavior is verified deterministically without mutating
production Registry content for a test.

GC is intentionally **plan-only**. It protects all objects/manifests referenced
by CURRENT, PREVIOUS and `last-good`; unreferenced failed/superseded candidates
must be at least 14 days old to become candidates. No deletion runs during
publication, and the tool does not automatically execute a destructive cleanup.
Journal compaction and aggressive storage GC are deferred until measured need.

## Measured costs and capacity

Production initial materialization read **1,969 D1 rows in 23 maintenance
queries**, including the snapshot, stable-state checks and lease operations;
lease acquisition/release wrote two maintenance rows. It wrote 272 objects plus
manifest and two descriptors: 275 KV writes. Verification/retries consumed 578
KV reads. Staging's final successful retry reused existing immutable payloads:
1,969 D1 rows, 546 KV reads and three publication writes. These staging figures
describe the final successful attempt; earlier failed preparation costs were
additional one-time costs, not fully aggregated in that receipt.

The local direct-D1 producer audit separately measures what canonical projection
queries cost, and demonstrates incremental scaling:

| Update class | D1 queries | D1 rows read | Objects rebuilt | Changed payloads |
| --- | ---: | ---: | ---: | ---: |
| All canonical projections directly against local D1 | 1,255 | 52,001 | 272 | 272 |
| One new timestamped result | 20 | 6,784 | 6 | 5 |
| Batch of 50 new results | 106 | 18,417 | 22 | 22 |
| No canonical change | 1 | 2 | 0 | 0 |

Update costs exclude the ingestion mutation itself and separate publication
lease/check overhead. The one-time CLI snapshot is cheaper than running 1,255
remote producer queries. Small/batch candidates embed about 377 KB / 848 KB;
unchanged materializations are reused. Production immutable objects occupy
2,533,791 bytes; bootstrap manifest is 2,577,206 bytes, approximately 5.11 MB
combined before prior generations. Largest standalone object is 130,460 bytes,
well below KV's 25 MiB value limit.
[KV limits](https://developers.cloudflare.com/kv/platform/limits/).

Measured normal warm requests use one KV pointer read. An uncached immutable
manifest adds a read; later incremental generations may also load required
unchanged projections. Per-request memoization and Cache API avoid duplicate
immutable reads. Initial samples observed 1–2 KV reads; final samples observed one
per normal data request and **zero D1 queries/rows**. Static fingerprinted assets
and robots need no Registry KV/D1 reads.

| Pageviews, unchanged Registry | Public D1 rows | Illustrative KV reads at 1–2/page |
| --- | ---: | ---: |
| 1,000 | 0 | 1,000–2,000 |
| 10,000 | 0 | 10,000–20,000 |
| 1,000,000 | 0 | 1,000,000–2,000,000 |

This is a structural traffic model validated by representative requests and a
D1 trap in deterministic public tests, not a million-request load test. Browser
reuse can lower network requests; main-navigation preparation adds at most three
initial reads. Later generations' cold multi-object requests may exceed the
illustrative 1–2 reads. D1 cost now tracks changes/maintenance, not pageviews.

There is still a hosting capacity limit. Cloudflare documents Free KV allowances
of 100K reads/day, 1K writes/day and 1 GB storage, and Free Workers 100K
requests/day. An illustrative ten-KV-read daily session therefore fits roughly
10K DAU in the KV read allowance, before staging/maintenance/other traffic; it is
not an account-level measured entitlement or guarantee. At 1M pageviews/day the
free hosting allowances require a different plan even though public D1 pressure
remains zero. No billing plan was changed.
[KV pricing](https://developers.cloudflare.com/kv/platform/pricing/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

## Interaction, assets and Lighthouse

The shell remains mounted during internal navigation; cancellation and sequence
guards discard late responses. Back/forward reuse loaded documents and preserve
scroll positions. A bounded 24-document memory cache displays known content
immediately, validates expiry quietly through the published generation, and
rejects retired generations. Fresh reuse lasts 60 seconds; known display reuse
is bounded at five minutes. A 16-query memory cache avoids repeated parsing and
network work for identical searches and rejects entries from an older observed
document generation. No persistent search history is introduced.

Complete already-loaded sets sort locally when equivalent; partial or temporal
precision-sensitive sets retain correct materialized server semantics. Controls
keep shareable query state and strict 50/100/500 pagination. Score remains
unsortable. Main navigation prepares up to three materialized destinations after
400 ms, with bounded hover/focus/touch preparation. Cold destinations show a
skeleton after 150 ms; cached ones render immediately without a skeleton.

Observed staging browser timings: first prepared Models navigation **47 ms**,
organization local sorting **31 ms**, complete 92-model sorting **32 ms**, cold
pagination **451 ms**. Mobile at
390×844 preserved tables with internal horizontal scrolling and no document
overflow. Menu, search, pagination, light/dark selection and source links worked;
keyboard theme selection was also checked. Global `10001` search retained its
single canonical model match. These are bounded observations, not percentile
guarantees. A fully uncached network request cannot be guaranteed under 250 ms.

Final production-light HTTP sample: 16 rendered hits, median **287.60 ms**
(201.58–749.69 ms); rendered misses 350.38–868.70 ms. Search bypass responses
247.63–521.82 ms still read zero D1. Staging Access transport is slower:
rendered-hit median 599.71 ms; first homepage 1,278.67 ms. The earlier initial
KV-cold staging homepage took 2,045.97 ms. Access/transport
timings are not equivalent to browser cached navigation or Worker CPU time.

Fingerprint JS/CSS use one-year immutable caching. There are no new libraries
in the browser: esbuild is an explicit maintenance dev dependency. The added
navigation/cache/strict local-sort behavior increases app JS from 277.75 KB /
81.47 KB gzip to 294.18 KB / 85.98 KB gzip; CSS remains 23.58 KB / 5.28 KB gzip.
The gain is fewer full reloads and duplicate requests, not a smaller initial
bundle. Production Lighthouse transferred about 89 KB including JS response
headers. Fonts/logos require no third-party font or image requests; Cloudflare's
existing beacon/challenge assets remain unchanged.

| Production homepage | Mobile | Desktop |
| --- | ---: | ---: |
| Lighthouse performance | 97 | 99 |
| FCP | 1.3 s | 0.6 s |
| LCP | 1.5 s | 0.8 s |
| Total blocking time | 160 ms | 0 ms |
| CLS | 0 | 0 |
| Speed index | 2.9 s | 1.2 s |

Two final bounded homepage runs, plus an earlier pair before the final client
corrections. There was no recorded P11.8 Lighthouse baseline;
no numeric before-score improvement is claimed. `verify:lighthouse` establishes
repeatable floors of mobile 90 / desktop 95, LCP 2.5 s / 1.5 s, TBT 250 ms and
CLS 0.1 using existing reports, without initiating a crawl.

## Cutover and verification evidence

Staging migration, explicit bootstrap/shadow verification and KV-only deploy
passed before production migrations/bootstrap/deploy. Both published canonical
revisions match D1 and have no pending work. Staging remains Access-protected,
noindex and isolated; production preserves apex/www redirects, canonical metadata,
indexable approved exact results, query noindex and no staging branding.

- Staging Worker: `cdee4f07-5208-4886-bee4-40796a4b5b89`.
- Production Worker: `663bae45-b957-4446-8e95-827dc1af9237`.
- Staging generation: `a6d618c20a164a4e9dfe161e5f1bd156`.
- Production generation: `c43aa32558574636ac9e202016920931`.
- Staging final bounded sample: 34 requests; production final sample: 34 requests.
  A preceding bounded production verifier run stopped on its incorrect assumption
  that pagination should be indexable; the response's noindex behavior was correct.
- No production sitemap crawl, full SEO audit, 805-page or bulk-link audit ran.
- Public zero-read evidence combines response counters, the deployed absence of
  D1 bindings/SQL and deterministic tests that throw on any public D1 access.
  It does not claim the whole account's D1 analytics are zero: maintenance reads
  are deliberately separate.

Automated checks: **333 app tests passed**, one opt-in audit skipped in the normal
suite and passed separately; **89 Python tests passed**, one disposable-remote
atomicity probe skipped because its credentials were not configured. Eight
offline link-verifier tests passed. Typecheck, ESLint, Ruff, production/staging
build guards, diff whitespace and Lighthouse thresholds passed.

Deterministic materialization tests cover bootstrap/keys, metadata and result
dependency scopes, no-op updates, affected-only rebuilds, manifest identity/hash
validation, publication failures, missing/corrupt values, complete previous
fallback, rollback, isolation, search/pagination/status/HTML equivalence, approved
and ambiguous exact states, and GC protection of both live generations.
Browser tests cover hydration without startup fetches, immediate safe sorting,
late-response cancellation, history/shell reuse, 150 ms skeleton timing,
preparation, cache expiry and revision changes.

Evidence files:

- `p11-9-read-baseline.json`: original D1 counters/plans.
- `p11-9-read-after.json`: retained SQL/origin-cache experiment; not final architecture.
- `p11-9-materialization-cost.json`: final canonical query plans and update costs.
- `p11-9-materialized-design.md`: pre-implementation architecture map and RETAIN/REWORK/REMOVE.
- `p11-9-*-materialization.json`, `p11-9-*-status.json`, `p11-9-*-noop.json`: publication and no-op evidence.
- `p11-9-staging-live.json`, `p11-9-production-live.json`: bounded serving counters/contracts.
- `p11-9-lighthouse.json`: condensed actual Lighthouse/network evidence.

Limits intentionally retained: eventual publication visibility, cold network
latency, small complete-directory projections at current scale, manual recovery
retry/plan-only GC, and no global traffic benchmark. No public D1 exceptions
remain. P11.10–P11.12, legal/accessibility expansion and observability/privacy
hardening were not started.
