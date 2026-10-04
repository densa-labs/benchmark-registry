# UI clarity rollout — 2026-10-04

[PR #2](https://github.com/densa-labs/benchmark-registry/pull/2) was merged first, preserving all eight numbered task commits. Merge commit: `d2236032150a4b9fd826944f64130d877cb28d6f`. [CI passed on the merged commit](https://github.com/densa-labs/benchmark-registry/actions/runs/37177962039).

The merged build was deployed to staging, verified there, then deployed to production and verified again. Deployments used the existing `npm run deploy:staging` and `npm run deploy:production` commands, including typechecking, environment/build verification and Wrangler publishing. No data materialization, migrations or ingestion ran. Both read-only publication status checks report `pending: false`, zero D1 rows written and zero KV writes. Existing data generations and dataset counts remain unchanged.

| Environment | Worker version | Build timestamp (UTC) | Published generation | Sitemap URLs |
| --- | --- | --- | --- | --- |
| staging | `8923b108-1990-4f2a-88d3-536950dfd023` | 2026-10-04 04:46:45 | `5630baa086834cb1a1790ca692c0dc7e` | 288 |
| production | `5765730b-7cd8-4e04-8893-8a3b777326ff` | 2026-10-04 04:49:37 | `3234440f6e7748d2a3fa2d58dea89fb3` | 287 |

Each live environment passed 18 browser checks: Terminal-Bench family, Claude Opus 5.5 and Terminal-Bench 2.1 at 1440px and 390px, with JavaScript enabled in light/dark themes and disabled in light theme. All 12 axe checks per environment reported zero violations. Checks covered page overflow, table captions/header scope, one H1, heading order, native variant expansion, keyboard scrolling, History, benchmark/source sorting and `aria-sort`, focus outlines and Compare preselection. Live desktop/mobile screenshots were captured and representative production screenshots were visually inspected. The committed [before/after screenshots](ui-clarity-pr.md) and [UI audit](ui-audit.md) document the implementation.

Server-rendered HTTP checks confirmed inline metadata, conditional controls, grouped versions, shared metric, accurate count copy and every source-linked observation against the real API. Claude Opus 5.5 retains 21 results across 9 benchmark families, displayed in 11 version/metric rows. Unknown effort labels remain intact. Filter, sort, page-size and History URLs work; filtered pages retain a Clear control. Production client bytes match the built asset exactly. Its staging-only diagnostic commit identifier is deliberately removed; the temporary smoke checker was corrected to compare asset bytes instead of requiring that identifier.

Full live crawls verified canonical HTML, JSON-LD, real sitemap dates, noindex exclusions, ordinary-link reachability within three clicks and redirects. Production HTTP/www redirects preserve path and query. Staging remains Access protected, with robots blocking and noindex/noarchive headers. Public data responses report zero D1 queries/rows. Staging remains at 946 results / 95 models / 85 families / 149 versions; production remains at 945 / 95 / 84 / 148. This pre-existing dataset difference was preserved.

Some crawl requests returned transient 503 responses before succeeding on bounded retries. They had no Registry revision header; the responsible layer is not established. Similar responses were observed during the earlier SEO rollout. Exact routes, attempts and headers are retained in the [structured deployment evidence](ui-clarity-deployment.json), without treating those initial attempts as successes.

Live checks reused the existing Chrome, Playwright and axe tooling. Temporary verification adapters applied the existing staging Access token privately to the committed local UI audit and reused the prior live SEO checker. No token was logged or committed. Automated checks do not substitute for a physical screen reader or touch-device test.
