# A1 — Web Analytics / Post-Launch Telemetry Cleanup

Verified September 30, 2026. Production Worker version: `4a2bb7bb-2277-42a1-8027-32d20ea9cdfe`. Staging Worker version: `53dea7e9-5501-4717-86a5-1df077fa9884`.

## Outcome and initial state

A1 complete: YES. A2 was not started.

The user restored Cloudflare Web Analytics after P11.11 disabled it, leaving the deployed Privacy Policy inaccurate. Initial inspection confirmed automatic setup with the EU-exclusion radio selected, one working production beacon, and disabled persisted Worker logs/traces. The dashboard already showed two views/two visits after the user's restoration; this task did not observe it empty. Subsequent checks established new data and soft-navigation reporting.

Automatic setup also injected the beacon into Access-protected staging. The dashboard's 24-hour window contains one historical staging view from before the exclusion. A1 prevents new staging collection; it does not erase earlier data or rewrite the P11 reports.

## Configuration and regional exclusion

The signed-in dashboard's Manage Site page was inspected initially and after deployment: **Enable, excluding visitor data in the EU** remains checked, with automatic injection. Existing API credentials lacked Account Settings/RUM scope, so configuration was verified through the signed-in UI; no secret or raw authenticated response was saved.

Cloudflare defines the exclusion using connections to data centers in these country codes:

`AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE CH GB`

This includes its listed EU/EEA countries plus Switzerland and the United Kingdom. The policy describes the data-center criterion rather than promising the visitor's physical location is conclusively determined. Configuration is verified; **physical excluded-region request behavior was not independently tested**. Production collection was tested on the available eligible connection.

[Cloudflare's RUM documentation](https://developers.cloudflare.com/speed/observatory/rum-beacon/) defines that scope and explains the data it processes, in-memory performance measurements, absence of beacon cookies/storage and source-IP discard at the nearest data center. Delivery/security processing remains separate.

## Browser collection and navigation

Fresh Chrome 154 capture after production deployment found one automatically injected `static.cloudflareinsights.com/beacon.min.js`, a successful 200 script response and same-origin POST `/cdn-cgi/rum` responses of 204. Application source has no manual beacon installation or manual pageview emission. Automatic integration remains sufficient.

The fixed sequence home → Models → model → benchmark → organization, then back/forward, search, Models and sort, stayed within the same document. Each navigation produced exactly one observed `eventType: 1` pageview; client navigation reported `nt: soft-navigation`. Cloudflare also sent separate `eventType: 3` performance reports for the previous route. Those are not duplicate pageviews. A theme change without navigation produced zero new pageviews. Heading focus remained correct when route identity changed; sorting retained its logical control focus.

URL-state search and sort navigations are automatically counted by the current beacon, with their query strings removed. This follows Cloudflare's route-change measurement model. No custom event handler or router rewrite was added. See [sanitized production capture](a1-production-browser.json), including per-navigation counts and separate sendBeacon payload categories. The test harness observed/forwarded Cloudflare's own sendBeacon calls once; it did not synthesize analytics events.

[SPA documentation](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/) describes Soft Navigations API, Navigation API and History fallback support. [Cloudflare's current FAQ](https://developers.cloudflare.com/web-analytics/faq/) explains load/route/leave reports, same-origin automatic collection, POST-only ingestion and ad-blocker limitations.

## Dashboard reporting

The last-24-hour dashboard with bots excluded increased from the initial 2 views/2 visits to 5/5. Removing the bot-exclusion display filter exposed the bounded verification traffic: 42 views, 13 visits, including 29 soft navigations. The tested benchmark, organization and Models paths appeared in its aggregate path breakdown. This establishes reporting separately from successful browser requests.

The final included-traffic snapshot showed 41 production views and the same single historical staging view. The default snapshot showed four production views plus that earlier staging view. These are aggregate snapshots, not exact counts of real humans or attribution to individual test sessions. Automated functional audits are visible when bots are included. Web Analytics does not equal raw Worker/CDN requests, all crawlers or all visits.

Cloudflare documents that data can take a few minutes to appear. No exact per-event delay was measured; checks occurred while research, publication and verification continued. [Dashboard evidence](a1-dashboard.json) records the filters, counts, top paths, countries, referrer categories and Core Web Vitals baseline. Default-filter LCP p50/p75 were 884/2,032 ms; LCP and CLS were 100% good in that small snapshot, and INP had no data. This small sample is not a performance distribution for the site's audience.

## Query handling and storage

Both pageview payloads and observed sendBeacon performance payloads omitted the controlled search term. Locations/referrers contained paths without search/sort query strings. Shareable query URLs still work. The FAQ separately confirms Web Analytics does not log query strings; Worker query redaction is not used as proof of that behavior.

Fresh production and staging sessions had no initial localStorage, IndexedDB, Cache Storage or service workers. Cloudflare security introduced `_cfPre_tabId` in sessionStorage and `__cf_ob` / `cf_clearance` cookies. The existing theme preference created only `benchmark-registry-theme` in localStorage when selected. Security scripts remained present and functional in staging. These findings do **not** support a blanket “no cookies” statement for the site; the policy limits that statement to the analytics beacon.

Evidence stores only cookie names/domains, storage keys, controlled public URLs, payload key names/categories and aggregate measurements. IPs, visitor IDs, page-load IDs, tokens, full user agents, security request paths and raw payloads were not retained.

## Staging exclusion

Staging HTML now sends `Content-Security-Policy: script-src-elem 'self' 'unsafe-inline'`. It allows the same-origin app/security scripts and Cloudflare's inline security bootstrap, while blocking execution of the external analytics script. The injected tag is still present; its blocked loading attempt is distinguished from a successful network response. Final fresh-session capture had zero RUM requests and zero successful beacon responses throughout the route/query/sort sequence. The legal audit separately recorded blocked beacon attempts, zero analytics responses and functioning security requests.

A staging `no-transform` trial also removed Cloudflare security injection, so it was replaced with this narrow script policy. Production has no new enforcing CSP. Access, noindex/noarchive, robots blocking, staging title/banner/favicon and routing remain intact. [Staging browser capture](a1-staging-browser.json), [legal audit](a1-staging-legal-browser.json) and [HTTP checks](a1-staging-http.json) verify the deployed outcome. Open staging tabs loaded before this deployment can retain their earlier beacon until reloaded; all verification of the exclusion used fresh sessions.

## Privacy, architecture and performance

The Privacy Policy now explains aggregate analytics purpose/data categories, the actual exclusion scope, query handling, beacon storage behavior, IP handling, ad blockers and retention. It separates Cloudflare delivery/security, Web Analytics and disabled persisted application logs. Its revision date is the actual September 30 production deployment date; Terms remains September 28. Legal routes and metadata remain intact. The policy makes no anonymity or jurisdiction-specific compliance claim; no new consent control was introduced for this storage-free beacon implementation.

Worker settings API checks confirm `observability: null`, Logpush false, no tail consumers and no D1 binding on both deployed public Workers. Repository controls continue disabling invocation persistence, custom-log persistence, trace persistence and destinations. Cloudflare normalizes that no-persistence configuration to null observability. There is no new application logging of raw requests, IPs, location, ASN, user agent, referrer, TLS or queries. Exceptional live diagnostics remain separate from stored application logs.

Normal Registry routes and search still return D1 queries = 0 and rows = 0. The architecture remains D1 canonical truth → producer → KV → public Worker. Analytics uses Cloudflare's script/managed `/cdn-cgi/rum` collection; no Registry handler, D1/KV analytics write or producer object was added. Cloudflare-managed collection adds browser-side script/report requests, not a Registry data-store tracking path. Existing cache reads/prefetches remain unchanged. [Production settings](a1-production-observability.json), [HTTP checks](a1-production-http.json) and [model API verification](post-launch-benchmark-verification.json) provide deployed evidence.

A1 does not add routes. The user's separately authorized model/results import changes the sitemap from launch's 808 to **820**: two model pages and ten approved exact-result URLs. `/privacy` remains indexable, canonical and present exactly once; staging remains noindex. [Data report](post-launch-models-and-benchmarks.md) explains the change and preserved ambiguity rules.

Two bounded homepage Lighthouse profiles passed the existing regression thresholds:

| Profile | Performance | LCP | TBT | CLS | Script execution |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 96 | 1,856 ms | 0 ms | 0 | 191 ms |
| Desktop | 99 | 697 ms | 0 ms | 0 | 0 ms |

Existing local launch evidence scored 98/100 respectively. The small score variation remains within the established gates (mobile ≥90, desktop ≥95; LCP ≤2,500/1,500 ms, TBT ≤250 ms, CLS ≤0.1). No material regression was found or performance point chased. Accessibility and SEO both scored 100. [Sanitized Lighthouse evidence](a1-lighthouse.json) includes timings and versions.

No analytics control, heading, landmark or focusable element was added. Focused accessibility tests passed; deployed legal pages passed axe on light/dark desktop/mobile, keyboard route focus and 320px enlarged-text reflow in both environments. No physical screen-reader or excluded-region browser test was performed. [Production legal audit](a1-production-legal-browser.json) and [staging accessibility](a1-staging-accessibility.json) preserve those practical limits.

## Verification and deployment

- App tests: 377 passed, 1 skipped; focused accessibility: 28 passed.
- Python suite: 90 passed, 1 skipped for normally unset disposable-remote credentials; that actual disposable-remote atomic rollback test passed separately before staging and production ingestion.
- Link unit tests: 8 passed; typecheck, ESLint, Ruff and whitespace checks passed.
- Staging and production builds plus environment/privacy guards passed. Existing Vite future-loader warnings were informational.
- Staging code deployed first, then its live exclusion/legal/accessibility checks passed. Production code deployed afterward; production collection, policy, reads, observability and performance were verified again.
- Controlled ingestion was independently staging-first; no destructive production test or schema migration ran.

The legal browser audit was updated to allow exactly Cloudflare's analytics origin and distinguish staging's blocked attempt from production's successful script/RUM responses. HTTP verification accepts an explicit expected inventory count rather than encoding this unrelated data update as a legal-route invariant.

## Completion gate

| Check | Result |
| --- | --- |
| Cloudflare Web Analytics enabled | YES |
| EU visitor-data exclusion enabled | YES |
| Automatic beacon injection active | YES |
| Eligible browser beacon request observed | YES |
| Pageviews visible in Cloudflare dashboard | YES |
| Client-side navigation pageviews verified | YES |
| Duplicate analytics events observed | NO |
| Staging traffic included in production analytics after exclusion | NO; one earlier view remains historical |
| Unexpected analytics cookies/storage introduced | NO |
| Privacy Policy updated for Web Analytics | YES |
| Privacy Policy matches observed behavior | YES |
| Persisted application request logging remains disabled | YES |
| Traces remain disabled | YES |
| Normal public traffic queries D1 | NO |
| Normal public D1 rows per representative request | 0 |
| Material performance regression | NO |
| Accessibility regression | NO |

A1 complete: YES.

A2 was not started.

## Official Cloudflare sources consulted

- [Automatic integration, regional option, headers and reporting delay](https://developers.cloudflare.com/web-analytics/get-started/)
- [Beacon data, storage/IP behavior and exclusion country list](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [FAQ: queries, retention, sampling, blockers, subdomains, CSP and report timing](https://developers.cloudflare.com/web-analytics/faq/)
- [Current SPA detection](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)
- [Soft-navigation rollout changelog](https://developers.cloudflare.com/changelog/post/2026-08-21-improved-soft-navigation-measurement-for-single-page-applications/)
- [Host/path rules](https://developers.cloudflare.com/web-analytics/configuration-options/rules/)
