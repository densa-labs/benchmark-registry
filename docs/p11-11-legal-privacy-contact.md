# P11.11 — Legal, Privacy & Contact

Status: complete. Evidence date: September 28, 2026. P11.12 is outside scope.

## Scope and sequence

Audit deployed/source behavior → minimize observability → inspect retained events
→ establish the data map → write policies → staging verification → production
deployment and verification. Existing uncommitted P11.9/P11.10 work is preserved.

## Before hardening

Production's settings API returned `logs.enabled=true`, `persist=true`,
`invocation_logs=true`, `head_sampling_rate=1`, `redact_query_string=false`.
Traces were disabled; Logpush was false; tail consumers were empty. Staging had
no observability configuration. Public Workers have ASSETS and isolated READ_STORE
KV bindings and no D1 binding. Canonical D1 remains maintenance-only.

Four server error handlers emitted complete exception objects. Staging browser
diagnostics emit only build/timestamp, bounded route kind, theme choice,
HTTP status, navigation cache category and duration. They emit no payload,
credentials, network-derived location, visitor identifier or full URL/query.

Wrangler is 4.133.0. Its installed schema supports independent `invocation_logs`,
`persist`, `redact_query_string`, log/trace destinations and sampling controls.
Official documentation confirms those controls. Staging probe version
`1ab8fc09-45c4-4290-ad36-17952c764fff` accepted invocation logs off, redaction on,
custom-log persistence on temporarily, traces/persistence off and no destinations.
The temporary probe emits only fixed `category` and `build`, on a controlled
authenticated staging robots request. It was removed before legal-page deployment.

The dashboard identifies the account as Workers Free, with 200K log events/day.
Free Workers Logs retention is three days; Paid is seven. These are platform
retention periods, not custom retention settings. Old logs do not disappear
merely because future persistence is disabled.

## Data-flow inventory

| Category | Actual flow and purpose |
| --- | --- |
| Infrastructure processing | Cloudflare receives the request URL, network/IP, headers and connection/security context to deliver/protect the site; network-derived location is not device GPS. Security processing is distinct from application log persistence. |
| Application diagnostics | No new persisted per-request logs or traces; aggregate metrics and transient live tails remain. Sanitized server helper accepts only fixed failure classifications and a compiled build ID; never requests or exceptions. |
| Browser/device | Local theme preference, in-memory document/search caches and ordinary HTTP caching; details below. |
| Public Registry content | Public companies/providers, models, aliases, benchmarks/versions, results, evaluators, sources and integrity/publication state in canonical D1 and immutable KV materializations. No visitor table or visitor-driven writes. |
| Voluntary support | `mailto:support@benchmarkregistry.org` invokes the visitor's mail app. Only choosing to send mail provides sender email, message, optional name/signature and attachments. No form or site mail API; no repository evidence identifies the mailbox provider or retention schedule. |
| Outbound links | Sources, GitHub and Densa Labs are ordinary links; visiting the Registry does not load their sites. Following a link sends a request to that service under its own practices. Source links use `rel=noreferrer`. |

Application request-header processing is limited to cache eligibility (presence
of Authorization and cookie names), controlled prefetch/Accept behavior, and
ordinary HTTP routing. Cache eligibility never persists credentials. Staging's
CF_Authorization handling is isolated to the staging hostname. No request.cf
serialization or application geolocation use exists.

Search terms and filters travel in shareable URL query parameters and are evaluated
against materialized public data. Arbitrary `q` requests bypass shared render
caching; materialized logical keys contain no visitor search query. No persistent
search-history store exists. Browser history may keep visited URLs independently
of the Registry's application storage.

## Browser storage audit

| Item | Mechanism | Purpose, lifetime and invalidation |
| --- | --- | --- |
| `benchmark-registry-theme` | localStorage | `light`, `dark` or `system` only; persists until changed/cleared or browser eviction. `system` remains stored but follows OS preference. No expiry or visitor identifier. |
| Documents/public payloads, head, URL state and generation | JavaScript memory Map, 24 entries | Navigation reuse: 60-second fresh TTL and five-minute display limit. Revision changes clear entries and retire old generations; bounded eviction; page unload clears memory. May contain current search/filter URL state, not a stored profile. |
| Search responses keyed by query | JavaScript memory, 16 entries | 60-second reuse, generation invalidation and bounded eviction; disappears with page session. No persistent search history. |
| Scroll positions/navigation state | JavaScript memory and browser history | Back/forward navigation and focus/scroll restoration; no telemetry upload. |
| Public responses/assets | Browser-managed HTTP cache | Responses 60 seconds, fingerprinted assets one year; browser controls eviction. Worker Cache API is server-side, not browser Cache Storage. |

No application cookie writes, sessionStorage, IndexedDB, browser Cache Storage,
service workers or persistent visitor IDs found in source. Live Chrome checks additionally
found Cloudflare-injected Challenge Platform scripts and the `_cfPre_tabId`
sessionStorage key on staging and production. This is security session state,
not Access authentication or Registry search history; its value is not recorded.
It lasts for the browser tab session. The policy explicitly discloses Cloudflare
browser characteristics/activity checks and security storage. Theme and public caching support
appearance/speed, not advertising or profiling. No banner is introduced.

## Cookies, third-party code and secrets

Controlled live model responses on staging and production set no cookie.
Application code never sets cookies. Cloudflare documents conditional technical
security cookies; a bounded ordinary sample cannot prove they never occur.
Staging Access necessarily processes tester authentication and uses its own
authentication storage; production does not require accounts or Access login.

Geist/Geist Mono fonts are bundled locally via @fontsource. No Google Analytics,
Meta Pixel, behavioral analytics, fingerprinting, session replay, advertising SDK,
sendBeacon, external font/CDN script or embed was found in application source.
Live network checks found same-origin Cloudflare Challenge Platform security scripts.
They can perform browser fingerprinting/automation assessment, so the policy makes
no blanket claim that the deployed site has no fingerprinting. No application
advertising/profiling scripts were found. Mail setup stays provider-neutral.

All reachable committed history was scanned for private-key, AWS-key and quoted
long secret/password/API-token patterns, without emitting matched values. No
matches found. This bounded pattern scan is not a proof that every possible
credential form is absent. Existing ignored local credentials were read privately
only for authorized Cloudflare API access; they were never printed or saved.

## Important primary sources

- [Workers Logs: invocation enrichment, sampling and plan retention](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Wrangler observability configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#observability)
- [Worker metrics and zone analytics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/) — aggregate Worker metrics up to three months; zone analytics last 30 days.
- [Security Events plan retention](https://developers.cloudflare.com/waf/analytics/security-events/)
- [Security Analytics plan retention](https://developers.cloudflare.com/waf/analytics/security-analytics/)
- [Cloudflare browser security checks and session state](https://developers.cloudflare.com/cloudflare-challenges/precursor/)
- [Cloudflare injected JavaScript detection](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/)
- [Cloudflare technical cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/)
- [Web Analytics setup and disable control](https://developers.cloudflare.com/web-analytics/get-started/)
- [Web Analytics retention and query omission](https://developers.cloudflare.com/web-analytics/faq/)
- [RUM fields, processing and IP handling](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [Workers Observability query API](https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/)

## Additional live infrastructure findings

The zone has Precursor enabled (verified in Security Settings). It injects
Challenge Platform browser-security code and uses `_cfPre_tabId` sessionStorage.
This security feature remains enabled; no security or Access controls were weakened.
The zone API returned `Free Website`. Its security dashboard exposes sampled
records with Time, Source IP, Host and Path, plus browser/device/OS/method
categories. Only field names were inspected/saved, not visitor values. Official
Free-plan retention is 24 hours for Security Events and seven days for Security
Analytics (the latter has a 24-hour query-window limit, not 24-hour retention).
The public policy discloses this continued security retention explicitly.

Live Chrome also exposed `static.cloudflareinsights.com/beacon.min.js`. Web Analytics
Manage Site showed automatic RUM injection enabled across the zone (including
subdomains). Optional RUM was disabled on September 28 through its supported
Disable/Update setting, retaining Worker/zone aggregate metrics and security.
This is a shared zone setting, applied before final staging verification. No
analytics site/data was deleted and no new destination was introduced.

Previous RUM data remains: seven days unsampled, then sampled aggregate data
available for up to six months. Cloudflare documents that queries are not logged
and source IPs are discarded at the nearest edge rather than saved in RUM core
databases/logs. The policy discloses earlier RUM data separately from old Worker
request logs. Browser storage findings are security state, not the RUM beacon.

## Stored-event inspection and final monitoring model

Actual production baseline invocation JSON (controlled robots request, September
28 at 21:27:59.007 GMT+8) contained IP headers, city/region/postal, network-derived
coordinates, ASN/organization, full user agent, TLS fingerprints/randoms/handshake
and certificate context, URL/path/search, request/correlation IDs, method/status,
CPU/wall time, Worker script/version and account metadata. The controlled request
had no referrer or credentials; their absence in that sample is not evidence that
the automatic header envelope would strip them. Field names only are recorded in
[p11-11-observability-fields.json](p11-11-observability-fields.json).

The staging custom-log probe at 21:26:35.993 GMT+8 retained only `category`, `build`
and enriched level plus Worker/script/version/method/URL/path context and
request/ray/trace/span/account IDs. Query strings were omitted. No IP, city,
region, postal, coordinates, ASN/organization, UA, referrer or TLS fields appeared.
Thus the enriched event was broader than the two explicitly emitted fields even
though sensitive network fields were stripped. Invocation view showed one custom
event and no automatic invocation record.

The conservative final choice disables all persisted per-request logs and traces,
including custom events. Both environments explicitly configure:

```json
{
  "enabled": true,
  "redact_query_string": true,
  "logs": {
    "enabled": true,
    "invocation_logs": false,
    "persist": false,
    "head_sampling_rate": 1,
    "destinations": []
  },
  "traces": { "enabled": false, "persist": false, "destinations": [] }
}
```

Cloudflare normalizes this all-storage-disabled/no-destinations combination to
`observability: null` in `/script-settings`; the older `/settings` endpoint omits
observability. This is not a claim that the API echoes each source flag. A
supported explicit settings PATCH returned success with the same null
normalization during the staging probe. The actual dashboard Logs/Traces toggles
are off and stored-event inspection confirms no new records. Built deployment
configs are tested against the explicit source settings.

Persistent diagnostic fields intentionally retained per request: **none**.
Transient application diagnostics: fixed `read-api`, `model-redirect`, `sitemap`,
`document`, `materialized-read` classifications and compiled `build` only. No
exception/request serialization, `request.cf`, URLs or visitor fields. Runtime
allowlisting rejects dynamic strings. The temporary probe category/route is gone.

Sampling evaluation: the account has roughly a few thousand daily Worker
invocations, well below Free's 200K daily log allowance. Sampling broad envelopes
would still retain some unnecessary visitor data. Persistence is therefore off
rather than choosing an arbitrary percentage. Source `head_sampling_rate: 1`
preserves exceptional live diagnostic availability; it creates zero persisted
request events in the chosen configuration. Platform aggregate analytics may
use their own documented sampling independently.

Useful monitoring remains: Worker invocation/error counts and CPU/wall/request
latency quantiles, deployment/version comparisons, asset status/cache metrics,
zone HTTP status/cache/bandwidth aggregates and KV/read-layer health. A controlled
real-time staging tail received one event with application log fields exactly
`category` and `build`; the raw tail was held in memory and not saved. Live tails
can expose broader request context and are exceptional debugging sessions, not
persistent exports. Materialized-read errors are visible as handled 500s in zone
status aggregates and classified during live debugging; Worker error metrics
alone count runtime failures rather than every handled HTTP 500.

Settings verify `logpush: false`, no tail consumers, no destinations and no D1
binding. Account Logpush UI shows the paid-plan/Enterprise upsell rather than
configured jobs. No log export or observability migration was introduced.

Retention differs by category:

| Category | Verified behavior |
| --- | --- |
| New application request logs/traces | No persistence |
| Earlier Workers Free logs | Automatic three-day expiry; disabling future persistence does not delete them |
| Worker aggregate metrics | Up to three months |
| Worker zone analytics | Last 30 days |
| Free-zone Security Events | 24 hours; infrastructure security, separate from application logs |
| Free-zone Security Analytics | Seven days; sampled traffic/security records, including IP/path categories |
| Earlier Web Analytics/RUM | Seven days unsampled, then sampled aggregates up to six months; beacon now disabled |
| Theme | Until changed/cleared/browser eviction |
| Page-session memory | Session lifetime with TTL/revision invalidation |
| HTTP cache/history | Browser-controlled |
| Support correspondence | No verified fixed automatic deletion schedule; no invented provider/period |

## Legal pages and architecture

`/legal` is a compact hub linking Privacy Policy, Terms and Support. The footer
continues to contain just Legal. Support uses the existing decorative,
current-color diagonal SVG, accessible name **Support**, the exact mailto address,
and no target blank. Both policies show the fixed publication date September 28,
2026; future unrelated builds do not change it.

Privacy distinguishes infrastructure security processing/retention, application
log persistence, device storage, public reference data, voluntary email and
outbound links. It acknowledges earlier logs and RUM data. It does not claim
anonymity, zero cookies, tracking-free status or legal compliance certification.
Terms cover the actual informational service, accuracy/availability, sources,
non-affiliation, technical abuse, code licensing, external services and changes.
Apache-2.0 refers only to repository code; there is no separate DATA_LICENSE or
new dataset/trademark grant, entity/address/jurisdiction, billing or account clause.

Static routes and their invalid children bypass publication/KV/cache/repository
reads. Tests use throwing KV and D1 fixtures: initial HTML still returns 200 for
policies, 404 for arbitrary children, and zero reads. Shared SSR/client content,
route-document parsing and navigation preserve hydration and new-H1 focus. Query
variants are noindex with base canonicals; trailing slashes redirect; HEAD has no
entity body. Legal pages remain available during materialization failure.

The HTTP sitemap appends and deduplicates the three application routes to the
existing 805 materialized paths: **808 URLs**, each legal route exactly once,
apex URLs only, no staging/mailto. Canonical/materialized inventory remains
unchanged; no D1 write, migration or rematerialization was necessary.

## Verification receipts

Final staging version: `a4a7e484-04ad-4a07-8a0d-61c60c96ab18` (build
13:59:37 UTC). All final staging checks passed before production deployment.
[p11-11-staging-live.json](p11-11-staging-live.json),
[p11-11-staging-browser.json](p11-11-staging-browser.json),
[p11-11-staging-observability.json](p11-11-staging-observability.json) and
[p11-11-staging-stored-events.json](p11-11-staging-stored-events.json) record
HTTP, browser, settings and stored-event results. Access rejects unauthenticated
Legal requests, robots still disallows all, noindex protections and staging
banner/title/favicon remain, and isolated KV has no public D1 binding.

Production version: `3fc7d7ee-521c-4105-937f-39b2868d1b19` (build
14:01:12 UTC). Bounded HTTP, browser and deployed-settings checks all passed.
[p11-11-production-live.json](p11-11-production-live.json),
[p11-11-production-browser.json](p11-11-production-browser.json),
[p11-11-production-observability.json](p11-11-production-observability.json) and
[p11-11-production-stored-events.json](p11-11-production-stored-events.json)
record the results. The production Metrics dashboard shows the active final
version and aggregate invocation/error/CPU/wall/cache monitoring remains available.
There are no staging banner/title/favicon markers, production
browser diagnostics or unexpected external requests. Cloudflare security code
and `_cfPre_tabId` remain, as disclosed; no production cookie was observed in
this bounded browser run. Optional RUM is absent.

Stored-event dashboard checks after final controlled requests showed only the
older staging custom probe and 46 earlier production invocation events (latest
21:55:54.299 GMT+8). There were **zero newly stored events** for either final
deployment. Prior logs remain under the three-day automatic retention; the NO
answers below describe collection after hardening, not immediate deletion of
those existing records. This is separate from continuing Cloudflare security
analytics with its own disclosed fields and retention.

Each environment passed 12 live axe cases (three pages × two widths × Light/Dark)
with zero violations. Keyboard footer/hub navigation, new-H1 focus, Support SVG
semantics, visible focus, back navigation and all six 320px/200%-text reflow cases
passed. Enlarged-text screenshots and representative desktop/mobile screenshots
were visually inspected. Normal model/API/search requests retained zero D1 reads;
legal pages also read zero KV. Existing public-data materializations and canonical
D1 were not modified.

Deterministic results: app **376 passed, 1 skipped**; Python **89 passed,
1 skipped**; link tests **8 passed**; accessibility command **28 passed**;
typecheck, ESLint, configured ingestor Ruff and diff checks passed. The app skip is the opt-in P11.9 local D1 audit fixture; the Python skip
requires disposable remote D1 credentials. Neither is a legal-page failure. Both
staging and production builds/environment verification passed. Vite emits an
existing nonfatal native-config extension warning; no new build failure.
An exploratory overly broad Ruff invocation also reported pre-existing issues
outside the configured ingestor scope; no unrelated files were changed to silence
it. The required configured Ruff check passes.

Browser checks are limited to new legal pages: desktop/mobile, Light/Dark, one H1,
landmarks, axe with real contrast, exact Support name, visible focus, keyboard
footer/hub navigation and back navigation, 320px with 200% text, theme persistence,
network/storage and production console. No full crawl or Lighthouse rerun occurred.
Automated text reflow is not a physical screen-reader/native-zoom certification.
No support email was sent; mailto semantics are verified without invoking delivery.


CLI OAuth can inspect Worker settings but telemetry/Logpush API reads return 403;
the separate local ingestion token also lacks those permissions. The signed-in
dashboard is used for read-only verification without creating or expanding access.

No entity, postal address, jurisdiction, compliance certification, data license,
mail provider or support-email retention period will be invented. The mailbox provider, actual mailbox deletion schedule,
and jurisdiction-specific legal review remain outside available evidence; the
policies do not make claims about them. Cloudflare internal security handling
is disclosed without assuming application log controls erase platform data. Full launch auditing, Lighthouse,
full SEO/integrity/a11y recertification and launch GO/NO-GO belong to P11.12.


## Completion checklist

These answers apply to new application observability after the final deployment.
Legacy Worker logs and separate infrastructure security records are disclosed
above and in the policy.

- Automatic invocation logs retained: **NO**
- Full query strings retained in application observability: **NO**
- IP retained in Benchmark Registry application logs: **NO**
- City/region/postal/coordinates retained in Benchmark Registry application logs: **NO**
- ASN/network organization retained in Benchmark Registry application logs: **NO**
- Full user agent/referrer retained in Benchmark Registry application logs: **NO**
- TLS fingerprint/handshake metadata retained in Benchmark Registry application logs: **NO**
- Intentionally retained country in per-request application logs: **NO**
- Intentionally retained pathname/status/duration in per-request application logs: **NO**
- Privacy policy matches observed production behavior: **YES**
- Legal hub live: **YES**
- Privacy Policy live: **YES**
- Terms live: **YES**
- Support mailto live: **YES**
- Normal public Registry traffic still performs 0 D1 reads: **YES**

**P11.11 complete: YES**

**P11.12 was not started.** No final launch GO/NO-GO, full crawl, Lighthouse,
whole-site SEO/integrity/accessibility recertification or P11.12 changes were made.
