# P11.9 amended architectural map (before materialization code)

The September 28 edge-first amendment supersedes the earlier origin-cache design.
This is the pre-implementation analysis: at that point P11.8 production was
still at ab3487d and origin-cache experiments existed only on staging. The
completed cutover and verification are recorded in p11-9-performance-report.md.

| Surface | Current producer/read path |
| --- | --- |
| HTML metadata | index.ts -> documentMetadata -> metadataModel/Company/Benchmark/Result |
| Worker SSR | renderDocument -> loadRegistryRoute -> in-process handleApi -> RegistryRepository |
| Hydration | serialized InitialDocument -> React hydrateRoot, no duplicate fetch |
| Homepage | stats + models(released), models(published), models(name), paginated full directory |
| Lists | models / benchmarks / companies; strict server filters, sorts and pagination |
| Detail | model / benchmark / benchmarkVersion / company; result latest/history scoped queries |
| Exact SEO | metadataResult and exact_result_indexable; parent version result selection |
| Search | search:catalogue names/aliases/versions; search:relationships for parsed combined intent |
| Sitemap | sitemapPaths joins canonical entities and exact-result eligibility |
| Canonical writes | Python Catalog.load -> validate Plan -> atomic execute_batch |
| No-op | Plan.statements empty -> no execute_batch; identical records yield SKIPPED |
| Revision work | migration 6 singleton token + transaction-bound triggers on 15 dependency tables |
| Existing bindings | isolated D1 and static ASSETS; no existing shared read-store binding |
| Environment | staging Access/noindex/custom domain and isolated D1; production apex/www redirect |

## Existing P11.9 classification

RETAIN: before/after D1 counters and EXPLAIN plans; demonstrated indexes and scoped
latest/count queries; metadata memoization; additive available_companies; hydration
reuse; persistent shell navigation, cancellation, history, local safe sorting;
bounded browser documents/search reuse; 150 ms cold skeleton; background cache
writes; immutable static assets; fixed bounded verification and tests.

REWORK: edge cache consumes immutable published objects/manifest rather than D1;
revision endpoint returns publication generation; browser refresh consumes published
state; first-click preparation reads materialized objects; SQL repository becomes
canonical producer/shadow-reference only; ingestion integrates publication after
actual canonical changes with a durable transactional change journal.

REMOVE: public revision SQL polling; expiry -> D1; public object miss -> D1;
visitor-driven origin warming; D1 failure as cache refresh trigger; D1 emergency
fallback. Production Worker will have no D1 binding after cutover.

## Selected storage and publication direction

R2 API inspection reports account error 10042 (R2 not enabled). Use two private KV
namespaces. KV is eventually consistent, including negative reads; never assume
pointer visibility orders object visibility. Content-addressed immutable read
objects + immutable complete manifests + active pointer carrying CURRENT/PREVIOUS.
Verify every manifest object before publishing. Resolve one manifest per request;
if required new objects are missing/corrupt, rerun the entire request using PREVIOUS
instead of mixing generations. Preserve immutable previous manifests/objects,
keep a last-verified manifest descriptor for pointer failure, and return a service
error if neither valid materialization can serve. No D1 fallback.

Logical objects follow real repository scopes: complete model/benchmark/company
indexes; per-model, per-family, per-version and per-company detail; reference/sort
lookup dictionaries; stats; redirects; search entities and relationships; sitemap.
Exact result states resolve from parent version, retaining 537/57 policy without
537 duplicated objects. API, SSR and navigation consume the same representations.
Dynamic strict filters/order/pagination run over bounded materialized rows using
producer-calculated canonical precision/sort keys; no arbitrary query objects.

A durable D1 transaction journal records affected logical scopes; producers read
only pending journal and affected canonical scopes, carry unchanged immutable
references into a new manifest, verify stable canonical revision across generation,
and publish only a coherent candidate. Actual ingestion commit invokes producer;
no-op never invokes it. Retry compares canonical token/journal against publication,
so post-commit failures remain pending and previous state stays live.

### KV coherence refinement before cutover

A manifest additionally carries all newly changed payloads in an immutable inline
update bundle. CURRENT pointing at that manifest cannot expose only part of the
update: either the single manifest value validates and contains the complete
changed set, or the complete request falls back to PREVIOUS. Unchanged hashes can
read their older standalone objects (already published in prior generations).
Bootstrap bundles the initial small dataset once; routine generations embed only
changed payloads. This deliberate second copy of changed payloads avoids a
per-location probe of hundreds of keys and avoids reliance on KV write ordering.
Measure manifest/object footprint explicitly. Immutable hash keys have no expiry.
Public Cache API stores only derived presentations and verified immutable read
objects; it never produces canonical materializations or queries D1. Pointer KV
cache TTL 30 seconds affects publication visibility, not correctness or DB refresh.

The singleton canonical revision is now producer-only. Migration 7 records logical
scope changes transactionally and guards identical SQL UPDATEs so they change
neither revision nor journal. Ingestor no-op skips producer entirely. Producer
acquires a maintenance lease, captures revision/watermark, builds affected scopes,
verifies canonical state stayed stable, verifies every manifest reference, and only
then publishes. Unchanged payload hashes are reused; search catalogue regenerates
for entity/alias/version changes, while new results regenerate relationships only.
Operational pending status compares canonical token/watermark with publication.

The public serving deployment has KV and ASSETS only. D1 bindings move to
wrangler.maintenance.jsonc. No automatic bootstrap runs on deployment. Explicit
bootstrap snapshots canonical D1 once, rebuilds all projections locally through the
same SQL repository, verifies and publishes. Incremental maintenance uses indexed
canonical scopes from the journal. Failed candidates are retryable via immutable
hashes; prior pointer remains until publication. GC is a separate plan-only tool,
protecting current, previous and last-good references, retaining unreferenced keys
for at least 14 days. No cleanup runs during publication.
