# Static site

Benchmark Registry is deployed as **Workers static assets only**. There is no
Worker script, so requests never count toward the Worker request quota.
Static asset requests are free and unlimited.

```text
D1 (canonical, edited by the ingestor)
  └─ npm run build:<env>      vite build + scripts/build-static.mjs
       ├─ one SELECT * per table into an in-memory SQLite snapshot
       ├─ projections + publication checks (worker/materializer.ts, worker/publication.ts)
       └─ dist/client/  HTML per page, data/*.json, sitemap.xml, feed.xml,
                        badge/*.svg, robots.txt, 404.html, _headers, _redirects
  └─ wrangler deploy --env <env>
```

## Build and deploy

```sh
cd app
npm run deploy:staging      # build from staging D1, verify, upload
npm run deploy:production   # build from production D1, verify, upload
```

New data appears on the site after the next deploy. After an ingestor commit,
run the deploy for that environment.

Deploy from a clean clone outside iCloud Drive. An iCloud-synced checkout gains
`… 2` duplicate files, which would be built and uploaded. Confirm the result with
`curl https://<host>/version.json`: `commit` should be the commit you deployed
and `dirty` should be `false`.

A build reads each canonical table once (one D1 query per table). Rows read per
build equal the table sizes, far under the free 5M rows/day. All joins run
locally. Builds fail instead of publishing when projection checks fail, a page
does not render with status 200, the redirect or header rule limits are
exceeded, or the output exceeds 15,000 files (the hard limit is 20,000) or has a
file over 25 MiB.

For a local build from a SQLite copy of the database:

```sh
CLOUDFLARE_ENV=staging npx vite build
node scripts/build-static.mjs --environment staging --db /path/to/registry.sqlite
npm run preview             # wrangler dev, serving dist/client like production
node ../scripts/seo_check.mjs --base http://127.0.0.1:8787
```

Analytics is injected at build time when `ANALYTICS_SCRIPT_URL` and
`ANALYTICS_SITE_ID` are set in the environment that runs the production build.

## Pages and data

Every page is prerendered with the same renderer, metadata and structured data
code the Worker used, so titles, descriptions, canonicals, JSON-LD and the
sitemap are unchanged.

Query variants (`?sort=`, `?page=`, `?view=`, `?result=`, `/search?q=`,
`/compare?models=`) are served the base page. The browser then applies the
query from static data and marks that view `noindex, follow`, as the Worker did.
`src/static-api.ts` runs the former `/api/*` read routes in the browser
against `data/manifest.json` and its content-hashed `data/objects/*.json`.
There is no public `/api` anymore.

## Caching (`_headers`)

| Path | Cache-Control |
|---|---|
| `/assets/*` (Vite-hashed JS, CSS, fonts) | `public, max-age=31536000, immutable` |
| `/data/objects/*` (content-hashed data) | `public, max-age=31536000, immutable` |
| HTML pages, `data/manifest.json`, sitemap, feed, robots, badges | `public, max-age=300, must-revalidate` |

Static assets send `ETag` and answer conditional requests with 304. Cache rules
never overlap, because overlapping `_headers` rules append values. Staging adds
`X-Robots-Tag: noindex, nofollow, noarchive` to every response, and its
robots.txt disallows everything.

One `/*` rule sends the security headers on every response: HSTS (one year,
`includeSubDomains`, no preload), `nosniff`, `strict-origin-when-cross-origin`
and a CSP. The build hashes the only inline script (the theme script) into
`script-src` and fails if a second inline script appears. Production also allows
the Cloudflare Web Analytics beacon origin (`https://static.cloudflareinsights.com`), which the zone injects automatically, and
the `ANALYTICS_SCRIPT_URL` script when it is set. Staging allows neither, which
keeps it out of analytics.

`/version.json` names the live build: full git commit, whether the tree was
dirty, commit and build times, when the build read D1, the data generation, and
model, benchmark, version and result counts. It is served with
`Cache-Control: no-store`. It replaces the Worker's `/healthz`.

## Redirects (`_redirects`)

Generated from the data: retired model numbers (308), legacy
`/benchmarks/<family>/versions/<version>` URLs and `versions/default` for
existing families (301), `/models/<name-slug>` (301), root-level model slugs
from the frozen allow-list in `worker/legacy-root-slugs.ts` (301), and
trailing-slash variants to the canonical path (308). Retired identities with no
equivalent, such as an unknown version or an unlisted root slug, get the real
404 page instead of a hub redirect. The build fails if an allow-listed slug
points at a model that is not published.

## Cloudflare settings outside this repository

These replace redirects the Worker used to perform. Set them before the first
production deploy:

- **Redirect Rule** on the `benchmarkregistry.org` zone: hostname equals
  `www.benchmarkregistry.org` → dynamic redirect to
  `concat("https://benchmarkregistry.org", http.request.uri.path)`, status 301,
  preserve query string.
- **SSL/TLS → Edge Certificates → Always Use HTTPS**: on.

## Rollback

`npx wrangler rollback --env production` restores a previous static version.
Versions from before the static migration rendered from a KV read store that is
no longer refreshed, so do not roll back that far.
