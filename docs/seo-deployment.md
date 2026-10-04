# SEO rollout — 2026-10-04

[PR #1](https://github.com/densa-labs/benchmark-registry/pull/1) was merged with its task commits retained. Merge commit: `4277a76f700579a35e85c021e75045984eae970d`. CI passed on that merged commit.

Staging was published, deployed and fully verified before production. Each environment received the SEO projection before its Worker rollout; only `seo` and `home-panels` were rebuilt. Canonical data revisions did not change. The producer's two D1 row writes were its existing lease acquisition/release. No scores, ingestion batches, migrations or ingestor logic changed.

| Environment | Worker version | Published generation | Sitemap URLs | Static pairs | Excluded entity pages | Records / models / families / versions |
| --- | --- | --- | --- | --- | --- | --- |
| staging | `9207d3af-f54e-400d-b0a4-e4e3facb1047` | `5630baa086834cb1a1790ca692c0dc7e` | 288 | 29 | 94 | 946 / 95 / 85 / 149 |
| production | `e32c2ef6-1628-4273-b4d8-cb1483c015b1` | `3234440f6e7748d2a3fa2d58dea89fb3` | 287 | 29 | 93 | 945 / 95 / 84 / 148 |

The pre-existing staging dataset has one additional record/family/version. Environments were not synchronized or altered to match; production remains at its pre-rollout 945 records. Both publication status checks report `pending: false`.

The complete live crawl verified every sitemap document's 200 response, single apex self-canonical, single H1, bounded metadata, JSON-LD, real data lastmod and ordinary-link reachability within three clicks. Production metadata is unique across all 287 indexable pages. All 93 production thin/placeholder pages and the tested sorting/pagination/search/compare parameter states are noindex, with clean canonicals and no sitemap inclusion. Staging's Access, generic staging title, noindex/noarchive headers and robots blocking remain intact. Public data requests use the current generation and report zero D1 queries/rows.

The deployed www and HTTP origins return 301 to HTTPS apex with paths and queries preserved. Retired legacy shapes redirect to real canonical entities or the closest existing hub. The sharing logo returns 200. Browser checks confirmed the model summary, actual update date, sorting head transfer and recently added page, with no application console errors.

Initial crawls observed HTTP 503 responses at staging `/models/50002` and production `/models/150003`; direct rechecks of each page and its API returned 200. The successful production crawl also recorded two transient 503 responses for `/models?page=2` before a 200 response. Those responses had no Registry revision header; their exact origin is not established. They are retained in the evidence rather than counted as successful first attempts. The crawl ultimately passed every assertion; later pagination and uncached sort/page-size control requests returned 200.

See [structured deployment evidence](seo-deployment.json) for IDs, timestamps, publication statistics and recovered response details. The implementation audit and Search Console checklist remain in [seo-audit.md](seo-audit.md). Submit the apex sitemap and request indexing for home plus one benchmark and model, then re-check both hosts' site: results in 1–2 weeks.
