# P11.6 — Technical SEO

## Routing audit and scope

Before P11.6, the Worker handled read APIs and immutable model redirects, then
served the SPA asset fallback. P11.5 supplied initial document metadata using
D1 entity reads. Missing entity documents and arbitrary routes returned the
SPA shell with HTTP 200, even though the client subsequently displayed its
existing not-found state. Initial HTML had an empty React root. Production had
no data-driven sitemap, canonical links, or production robots implementation.

The meaningful content routes are the frozen homepage, three indexes, model,
company, benchmark family, and benchmark version routes. Family pages represent
all versions; a version is a distinct entity addressed by its stored immutable
`version_slug`. Stored display versions, including `4.0`, `1.1`, `2.0`, and
`TEST`, remain unchanged.

P11.4 search directs users to entities or immutable benchmark-version result
states; there is no public search document route. General UI state uses `q`,
`company`, `sort`, `order`, `page`, `limit`, and `view`. The read API validates
those parameters and rejects unsupported values. None of these variations
creates a separately intended SEO entity. Exact result navigation uses
`?view=history&result={immutable lowercase SHA-256 key}` and survives reload.

P11.6 changes only Worker document/crawl behavior and verification. The React
pages, controls, navigation, contracts, Registry data, and schema are unchanged.

## Canonical and indexing policy

- The sole canonical origin is `https://benchmarkregistry.org`.
- Existing content routes return exactly one absolute self-canonical. Distinct
  models, families, and benchmark versions retain their own canonical URLs.
- Trailing slashes and alternate percent encodings of existing route keys return
  permanent 308 redirects to the normalized route, preserving queries.
- Canonical and Open Graph URLs use production equivalents on staging as well.
  No staging, local, or Worker preview origin becomes a canonical URL.
- Queryless production content pages have no noindex directive.
- Query states default to `noindex, follow`, with a canonical to the content
  route. This includes pagination, sorting, company filtering, search, history,
  limits, unknown UI parameters, and repeated/malformed query parameters.
- A selected result is eligible only when its key belongs to the addressed
  version, there is exactly **one retained row across all runs, evaluators,
  reasoning levels, and configurations** for that model/version, and its model
  is not a Registry redirect source. This follows P11.4's retained-result
  ambiguity rule rather than choosing a winner from Latest view.
- Eligible exact results use the stable canonical
  `/benchmarks/{slug}/{version_slug}?view=history&result={result_key}`. A request
  containing exactly one `view=history` and one valid `result` is indexable.
  Query order does not change the canonical serialization. Extra UI parameters,
  or a result-only URL missing `view=history`, remain noindex and canonicalize to
  that approved exact URL.
- Ambiguous result states remain usable and retain P11.5 metadata, but have
  `noindex, follow`, canonicalize to the benchmark-version page, and are excluded
  from the sitemap. No underlying results are removed or modified.
- Missing, wrong-version, malformed, or repeated result keys use the normal
  benchmark-version metadata and canonical, with noindex. Document status stays
  200 for this existing UI behavior; the existing API still rejects malformed
  keys with 400 or returns an empty scoped result set for absent keys.
- Missing resources and arbitrary document routes return actual HTTP 404,
  noindex HTML, and no canonical. GET and HEAD agree on status.
- Public API responses, including search and errors, have
  `X-Robots-Tag: noindex, follow`; API behavior and payloads are preserved.

Robots permits crawling query URLs so crawlers can observe their noindex and
canonical directives. Robots is not used to conceal those directives.

## Sitemap and robots

`/sitemap.xml` queries authoritative D1 data. It includes the homepage, indexes,
all non-redirected models, every benchmark family/version, all companies, and
eligible exact results. There is one standards-compliant XML sitemap. It contains
no general query/filter URLs or redirected model pages. There is no reliable
per-page modification timestamp covering all content changes, so `<lastmod>` is
omitted.

Production `/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://benchmarkregistry.org/sitemap.xml
```

Staging `/robots.txt` remains:

```text
User-agent: *
Disallow: /
```

Staging retains `X-Robots-Tag: noindex, nofollow, noarchive` on all Worker
responses. Its HTML additionally has `noindex, follow`; the stricter response
header remains authoritative. Cloudflare Access configuration is unchanged.
Local/preview hosts also receive disallow robots and the protective response
header. A staging sitemap can be inspected after Access authentication but only
contains production canonical URLs; staging is never made indexable.

## Initial HTML

The Worker adds a small ordinary HTML identity summary inside the React root,
using the same authoritative entity reads and frozen P11.5 copy. It includes
model/company identity links and exact-result score, reasoning level when
supplied, and primary source. It is available in raw HTML and when JavaScript
is disabled. The existing `createRoot` client replaces it with the unchanged
application. This is a bounded crawler fallback, not a new rendering framework
or an implementation of broader internal linking.

## Verification

Automated coverage exercises canonical routes, eligible and ambiguous result
states, malformed/unrelated result keys, junk queries, complete sitemap inventory,
sitemap exclusions, staging/preview protection, robots, 404 GET/HEAD responses,
route normalization, HTTP normalization, and API noindex. Sitemap tests also
request every fixture URL and require a self-canonical indexable HTTP 200.

The reusable raw audit is `app/scripts/verify-seo-live.py`. It compares sitemap
inventory to live paginated read API data and all retained model/version result
sets, requests every sitemap document, checks every ambiguous result URL, and
verifies query states, real 404s, robots, API policy, and environment protection.
Staging uses the existing Access CLI session; it does not bypass or weaken Access.

The staging audit passed against all 805 advertised documents and all 57
ambiguous result states. Unauthenticated `/`, `/api/models`, `/robots.txt`, and
`/sitemap.xml` requests all continued to redirect to Cloudflare Access.

Staging Worker version: `f4df0eb2-3445-4857-bdba-2f655961ff41`.
Production Worker version: `6d4a6caf-4944-41d4-81ce-9dec75962f8c`.
All 18 application artifact SHA-256 hashes matched between the verified staging
build and the production build; environment configuration was checked separately.

| Sitemap category | URLs |
| --- | ---: |
| Homepage | 1 |
| Indexes | 3 |
| Models | 92 |
| Benchmark families | 53 |
| Benchmark versions | 104 |
| Companies | 15 |
| Approved exact results | 537 |
| **Total** | **805** |

No `<lastmod>` values are emitted. The 57 ambiguous result states are excluded.

Automated checks: 235 tests across 11 files passed; typecheck and lint passed;
staging and production builds and environment verification scripts passed;
`git diff --check` passed. Frozen contracts, data, schema, and Registry numbering
were unchanged. No database writes occurred.

Re-run raw verification from the repository root:

```sh
python3 app/scripts/verify-seo-live.py staging.benchmarkregistry.org /tmp/p116-staging /path/to/cloudflared
python3 app/scripts/verify-seo-live.py benchmarkregistry.org /tmp/p116-production
```

Local raw evidence is retained in `/tmp/p116-staging` and `/tmp/p116-production`
(sitemap, robots, every advertised initial HTML document, and JSON reports).

Production then passed the same complete raw audit: all 805 sitemap documents
returned 200, one correct self-canonical, initial identity content, and no
production noindex leakage. All 57 ambiguous states had noindex and version-page
canonicals. Missing models, families, versions, companies, and arbitrary routes
returned actual 404 for GET and HEAD. Production robots advertised the sitemap;
API responses retained noindex without affecting functionality.

Live host checks passed: `https://www.benchmarkregistry.org/...` returned 308 and
`http://benchmarkregistry.org/...` returned Cloudflare's 301 to the HTTPS apex,
with path/query preserved. The destination HTTPS pages returned 200, without
redirect loops. The Worker independently enforces a 308 HTTP-to-HTTPS fallback.

## Deferred limitations

The initial HTML summary does not server-render the complete interactive tables
or directory listings. Broader discovery links and crawl navigation remain
P11.7. Responsive/UI polish, performance work, accessibility audit, legal pages,
and the final launch audit remain their separately scoped later phases.

P11.6 complete: YES

P11.7 was not started.
