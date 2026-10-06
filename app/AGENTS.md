# app/AGENTS.md

Applies to the frontend (`src/`), the build-time page renderer (`worker/`) and
the build and deploy scripts (`scripts/`).

Read the root `AGENTS.md` first, then `STATIC-SITE.md`. The site is static
assets only: `worker/` never runs on a request, despite its name.

---

## 1. App role

The app is a **read-first public interface** over curated Registry data.

It must:

- publish stable, prerendered pages and static read data,
- render the frozen page structures,
- make sources easy to reach,
- preserve model/benchmark/company relationships,
- avoid inventing interpretations not present in the data.

It must not become an admin application.

---

## 2. Public routes

The canonical route families are frozen in `docs/product-contract.md`:

```text
/
/models
/models/{registry_no}

/compare

/benchmarks
/benchmarks/{slug}
/benchmarks/{slug}/{version}

/companies
/companies/{slug}
```

The contract also lists the supporting pages (search, recent, coverage,
corrections, comparison pairs, legal and about pages, badges, feed and
`/version.json`). Do not change canonical route semantics or add a route
without explicit approval. Every new page must be reachable from the build's
page inventory in `worker/static-site.ts`, or it will not be published.

---

## 3. Read layer

There is no public `/api` and no database read at request time.

- `scripts/build-static.mjs` loads one `SELECT *` per D1 table into an
  in-memory SQLite snapshot. `worker/repository.ts` and
  `worker/materializer.ts` project it into `data/manifest.json` and
  content-hashed `data/objects/*.json`.
- The read routes in `worker/api-router.ts` are internal. They render pages
  at build time, and `src/static-api.ts` answers the same `/api/*` paths in
  the browser from the static data files.
- Allowed query parameters and sort keys per route live in
  `worker/request-policy.ts`; parsing and validation live in
  `worker/params.ts`. Unknown parameters and unsupported values are rejected.
  Score is never an allowed sort key.
- SQL runs only against the build snapshot. Use bound parameters for every
  dynamic value; never interpolate input into SQL.
- No write endpoints, and no runtime fallback to D1.

---

## 4. UI direction

The visual system is:

**basic, minimalist, modern, data-first.**

Prefer:

- restrained typography,
- compact tables,
- subtle borders,
- clear hierarchy,
- simple links,
- predictable controls,
- useful empty states.

Avoid:

- bureaucratic/government visual language,
- excessive cards,
- decorative gradients,
- giant hero sections,
- dashboardification,
- meaningless status badges,
- oversized marketing copy.

The product should feel like a clean technical directory, not an institution.

---

## 5. Homepage

The homepage includes global search, Explore Benchmarks, Latest Additions,
and the complete alphabetical All Models directory.

Use the homepage semantics in `docs/product-contract.md`: at most five families
with coverage counts, and at most five result records in Registry insertion
order. Keep result report dates distinct from Registry addition order.

There is **no Top Models** feature. Do not introduce rankings or composite model
scores. The homepage panels are computed at build time from the same D1
snapshot as every other page.

---

## 6. Model page

Required metadata:

```text
Model Name

Released:
Company:
Source:
Registry No.:
```

Then:

```text
[ Search benchmarks... ]

Benchmarks                    XX results

Benchmark   Score   Source
```

Rules:

- reasoning level is attached to individual results,
- benchmark names link to benchmark pages,
- company links to company page,
- source links point to evidence,
- Latest/History switches use the shared result-view semantics,
- Score is not sortable.

Do not move reasoning level onto the base model record just for display convenience.

---

## 7. Benchmark pages

Family route:

```text
/benchmarks/{slug}
```

shows all versions.

Version route:

```text
/benchmarks/{slug}/{version}
```

shows:

```text
Benchmark Name

Evaluated by:
Release date:
Version:
Metric:

[ Search models... ]

Latest   History   <dynamic company tabs>

Results                    XX results

Company   Model   Score   Source   Registry No.
```

Rules:

- company tabs are dynamic,
- Latest/History semantics come from `docs/data-contract.md`,
- Score is not sortable,
- page-size selector is exactly 50 / 100 / 500,
- default is 50,
- no All option.

---

## 8. Company page

Shows:

```text
Company Name

Established:
Latest model: Model Name (Month Year)

[ Search benchmarks or models... ]

Benchmarks                   XX results

Benchmark   Model   Score   Source   Registry No.
```

Latest model links to its model page.

The result table exposes the shared Latest/History switch.

Use the eligibility and tie-break rules in `docs/product-contract.md`; do not infer a
different meaning of “latest” in presentation code.

---

## 9. Sorting

Score is never sortable.

Only enable the sort keys listed in `worker/request-policy.ts`; adding one needs
explicit approval.

The active sort should be visually clear.

Do not add sorting simply because a table component supports it.

---

## 10. Search

Global search should support:

- canonical model names,
- model aliases,
- Registry Nos.,
- benchmark names,
- benchmark abbreviations/aliases where present,
- company names.

Page-local search must remain scoped to the current page.

Search runs in the browser over the static search data
(`worker/search-response.ts` through `src/static-api.ts`). Do not add a search service or full-text infrastructure
unless the real dataset demonstrates a need.

---

## 11. Pagination

Supported page sizes:

```text
50
100
500
```

Default:

```text
50
```

No `All`.

Prefer shareable URL state such as:

```text
?page=2&limit=100
```

Pages are one-based. Preserve active search, company, view, sort, and order state
when changing page or page size.

---

## 12. Data presentation

Do not “fix” ambiguous backend data in the UI.

If a field is missing, inconsistent, or semantically unclear:

- render an appropriate absence state when valid,
- otherwise report the data-layer problem.

Never merge conflicting results client-side.

Never normalize incompatible metrics into an implied ranking.

---

## 13. Mobile behavior

Tables remain tables.

Prefer:

- horizontal scrolling,
- compact spacing,
- sticky first column where useful.

Do not convert every row into oversized cards unless explicitly approved. On
phones, `/compare` puts the benchmark name across the row with both scores
beneath (owner-approved, 2026-10-06); that is not a precedent for other tables.

---

## 14. Verification

Before completing app work, run from `app/`:

```sh
npm run typecheck
npm run lint
npm test                    # vitest: pages, read layer, SEO, static build
npm run build && npm run test:seo
```

`npm run test:accessibility` covers axe checks on rendered pages. A full static
build needs D1 access (`npm run build:staging`); for a local build from a
SQLite copy, see `STATIC-SITE.md`.

For UI changes, verify:

- loading state,
- empty state,
- error state,
- pagination,
- keyboard/focus behavior,
- mobile overflow,
- frozen sorting behavior.

Do not claim visual behavior is correct without checking it.
