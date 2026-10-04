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
`X-Robots-Tag: noindex, nofollow, noarchive` and its CSP to every response, and
its robots.txt disallows everything.

## Redirects (`_redirects`)

Generated from the data: retired model numbers (308), legacy
`/benchmarks/<family>/versions/<version>` URLs and old model name slugs (301),
and trailing-slash variants to the canonical path (308).

## Cloudflare settings outside this repository

These replace redirects the Worker used to perform. Set them before the first
production deploy:

- **Redirect Rule** on the `benchmarkregistry.org` zone: hostname equals
  `www.benchmarkregistry.org` → dynamic redirect to
  `concat("https://benchmarkregistry.org", http.request.uri.path)`, status 301,
  preserve query string.
- **SSL/TLS → Edge Certificates → Always Use HTTPS**: on.

## Rollback

`npx wrangler rollback --env production` restores the previous version,
including the last Worker-rendered version. The ingestor still refreshes the
retired KV read store through `npm run materialize` (namespace IDs are now in
`wrangler.maintenance.jsonc`), so that version keeps serving current data. Remove
KV and the materializer's publish path once rollback is no longer needed.
