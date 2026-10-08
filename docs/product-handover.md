# Product trust/features release handover — 2026-10-04

Work stopped at the user's explicit instruction: “just stop everything. do the handover”. Do not resume deployment or publication work without a new instruction. The active release commands had already completed successfully when checked; no task-owned release processes remained. No automation or subagents were started.

## Current state

- Repository: `/Users/ivan/Desktop/Densa-Labs/benchmark-registry`.
- [PR #3](https://github.com/densa-labs/benchmark-registry/pull/3) merged with a merge commit, preserving the audit and 14 numbered task commits. Merge: `66bfb47b5b4f6e5e2a7ac6e5078fd6d1414e6bc7`.
- Current checkout: `main`, HEAD `d8fc3545a44d8def0f2cd163d86139a9b6fa07e0`, pushed to origin. Tracked files were clean before this handover file was written. This handover is intentionally local and uncommitted; no further push was performed after the stop request.
- Preserve the pre-existing untracked `docs/p11-12-*` reports and Python cache directories. Do not add them to a commit or delete them.
- Original implementation/audit: `docs/product-audit.md`, `docs/product-pr-description.md` and merged PR #3. The PR description describes the original projection version 5; the release fixes below upgrade it to version 6.

## Staging

Latest deployment completed successfully:

- Host: `https://staging.benchmarkregistry.org`.
- Worker version: `be27d6f9-d725-40da-a1df-43e01637b92e`.
- Deployed code: HEAD `d8fc3545a44d8def0f2cd163d86139a9b6fa07e0`.
- Active publication reported by the completed publisher: generation `e0d2d444ed5d4da3ba9ef5c6ed5a4e64`, projection version **6**.
- Canonical revision remains `92e1579bbd692a053225025175ba5211`.
- Publisher verified 354 objects and **105 canonical/materialized comparisons**. Existing immutable object writes: 0; manifest writes: 1; descriptor writes: 2. Its two D1 row writes were the existing lease acquire/release, not result edits.
- The full-publication manifest shrank from **5,111,801 bytes to 33,357 bytes**, with only two tiny objects inline. Standalone immutable objects retain hash checks; small incremental updates retain bounded inline bundles, and failed reads fall back as a complete previous generation.
- Migrations 0009, 0010 and 0011 were applied to staging. Before/after checks preserved 946 records, 95 models, 85 families and 149 versions, the canonical revision, and the result fingerprint `59bb517656677f7078700b1692cdd35f684789c13fb528a134f02532eec06f2a`.

**Latest staging deployment/publication has not received final live verification. The user stopped work immediately after they completed. Do not treat staging as approved for production.**

Before the compact-publication fix, browser checks passed Coverage, Corrections, citations, reporting links, footer links and operator search (14 results), at the browser's native 1280px width. Existing Access remained enabled. The deployed logging/persistence/export controls and isolated staging D1 binding passed their checker on an earlier staging version.

A live crawl verified all 292 indexable staging sitemap pages on the earlier version, then stopped on a request timeout during subsequent exclusions/reachability checks. Other attempts saw Cloudflare **1102 “Worker exceeded resource limits”** responses without application revision headers. These were real failures, not just generic upstream errors. They motivated compact manifests and read reuse. **Elimination of those failures on the latest version is still unverified.**

A badge smoke check initially used `/badge/20015/gpqa.svg`, an unrecorded pair. Its 404 was correct. Claude Opus 5.5's stored families include CursorBench, so the temporary probe now uses `/badge/20015/cursorbench.svg`. No badge/data fix or fabricated GPQA result was added.

## Production

**No production migrations, publication changes or Worker deployment were performed during this release.** Only read-only baseline queries and an official D1 export were performed.

- Baseline: 945 records, 95 models, 84 families, 148 versions.
- Canonical revision: `725dc82a31f06687207e24b5574bad41`.
- Result fingerprint: `a4f9fd27ac840c88a2f174c50ff89fecdd8db35b94dc5653e77c1d7d47c23a0c`.
- Baseline migrations: 0001–0008; 0009–0011 still need application before this application is released to production.
- SQL backup: `/tmp/trust-release-production-before.sql`, restricted to mode 600. Do not publish the backup. Do not copy/export any temporary signed download URL from Wrangler output.
- The pre-existing one-record/family/version difference between staging and production was preserved. Do not synchronize the datasets.

## Release fixes already committed and pushed

1. `18731db`: deployment guards validate exact, distinct maintenance/public D1 identities for Coverage/Health; the manual publisher uses the producer's projection-version-aware refresh predicate.
2. `c6a90c6`: full projection upgrades reuse the existing local canonical snapshot and shadow comparison path, reducing remote D1 requests.
3. `846ea55`: projection version 6; full manifests have a bounded inline bundle; public object reads parse/validate once and memoize verified reads per request. Rejected memo entries are evicted so fallback can succeed.
4. `3a736b3`: shadow comparison reads either bundled or standalone candidate objects.
5. `d8fc354`: full upgrades retain all shadow inputs even when immutable object hashes are unchanged.

Two earlier compact-publication attempts were safely rejected by shadow verification before switching the active publication. Their assumptions about inline/unchanged objects are now covered by regression tests. The final attempt succeeded with the full staging dataset.

## Verification evidence

Most recent local checks on the final code:

- App typecheck and ESLint passed.
- App tests: **468 passed, one optional integration test skipped**.
- Staging production build and deployment guards passed as part of the completed deployment.
- Previous implementation verification: 90 ingestion tests passed, 20 manual-script tests passed, 8 link-script tests passed, Ruff passed, 42-page fixture SEO check passed, reversible migration up/down/up checks passed, and local visual checks at 1440px/390px passed. Release fixes did not modify ingestion, scores, batches or workflows.
- PR #3 CI passed before merge. CI was last inspected as successful at `c6a90c6`; CI for the newest release-fix commits was not inspected before stopping. Check it on resume.

Useful local evidence (temporary files are not durable handover attachments):

- `/tmp/trust-release-staging-deploy-v6.log`
- `/tmp/trust-release-staging-materialization-v6.json` and `.log`
- `/tmp/trust-release-staging-db-before.json` and `...-db-after.json`
- `/tmp/trust-release-production-db-before.json`
- `/tmp/trust-release-staging-observability.json` (earlier Worker version)
- `/tmp/trust-release-staging-seo-initial.log` and `...-initial-transport.json`
- `/tmp/trust-release-staging-seo-second.log` and `...-second-transport.json`
- `/tmp/trust-release-staging-feature-transport.json` (contains 1102 response identification)

Temporary verification tools:

- `/tmp/trust-release-db.mjs`: `staging|production before|after`; reads D1 with the existing Wrangler credential command captured privately, records counts/fingerprint, and compares the `after` baseline. Do not run `before` again against a changed database and overwrite the preserved baseline.
- `/tmp/trust-release-features.mjs`: `staging|production`; checks live features and exact deployed client bytes. Run against the matching environment build. It now uses the real CursorBench badge pair and scopes source safety separately from repository navigation links.
- `/tmp/trust-release-seo.mjs`: `staging|production`; full live sitemap/metadata/noindex/reachability checks using the corresponding local candidate manifest. Its hard-coded evidence commit is stale; update to the actual deployed commit before relying on its report. It retains bounded retries and transport failures rather than counting initial failures as successes.
- Existing staging Access CLI: `/private/tmp/p119-tools/cloudflared`. Browser was authenticated too. Never print or persist its token. A first Wrangler token read failed because the session needed refresh; the existing Wrangler migration-list command refreshed it. Credentials were not copied into the repo.

## Resume sequence — only after new user authorization

1. Confirm remote main/CI and current staging deployment/publication. Inspect task-owned browser tabs before using them; a staging search tab may remain open, with no active automation.
2. Verify the latest staging version and projection 6, specifically repeated cold model/benchmark/search reads with no Cloudflare 1102 failures; complete feature checks, badge/feed checks and the sitemap/noindex crawl. Preserve failed attempts and distinguish timeouts from application failures. Recheck mobile layout if needed; do not claim live 1440px/390px checks from the native-width browser checks above.
3. If staging passes, use existing `npm run db:migrate:production`, verify canonical preservation, and run `npm run materialize -- --environment production` before deploying the app. Projection version 6 triggers a full refresh with the snapshot/shadow path. Preserve the production baseline and backup.
4. Deploy via existing `npm run deploy:production` and verify the real production site, exact client bytes, health, new pages, search/compare, citations/permalinks, feed, badge, cache headers, sitemap/canonicals and logging/privacy controls. Ensure published pages continue to use KV, while only Coverage/Health use public D1.
5. Record final release evidence and any remaining limitations. No workflow changes, scheduled jobs, ingestion automation or new runtime dependencies are authorized.

The owner approved the release after the original PR's license/governance review list. Analytics remains off unless a vendor is explicitly chosen/configured; none was selected. The hidden funding/neutrality TODO and legal draft markers remain as shipped. Do not invent their replacement text.
