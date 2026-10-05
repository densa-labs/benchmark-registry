# app/AGENTS.md

Applies to the frontend and the build-time page renderer in `worker/`. The site
is static assets only (see `STATIC-SITE.md`); the `/api` routes below run at
build time and in the browser from static data, not on a deployed Worker.

Read the root `AGENTS.md` first.

---

## 1. App role

The app is a **read-first public interface** over curated Registry data.

It must:

- expose stable read endpoints,
- render the frozen page structures,
- make sources easy to reach,
- preserve model/benchmark/company relationships,
- avoid inventing interpretations not present in the data.

It must not become an admin application.

---

## 2. Public routes

Preserve:

```text
/
/models
/models/{registry_no}

/benchmarks
/benchmarks/{slug}
/benchmarks/{slug}/{version}

/companies
/companies/{slug}
```

Do not change canonical route semantics without explicit approval.

---

## 3. API contract

Expected read endpoints:

```text
GET /api/models
GET /api/models/{registry_no}

GET /api/benchmarks
GET /api/benchmarks/{slug}
GET /api/benchmarks/{slug}/{version}

GET /api/companies
GET /api/companies/{slug}

GET /api/search?q=
```

Where applicable:

```text
?page=
?limit=50|100|500
?q=
?company=
?sort=
?order=
?view=latest|history
```

Use the response envelopes, validation rules, allowed sort keys, and deterministic
default ordering in `development-roadmap.md` Phase 5. Reject unknown parameters
and unsupported values; score is never an allowed sort key.

No public write endpoints.

Use D1 prepared statements/bindings for dynamic values.

Never interpolate untrusted input directly into SQL.

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
scores. Serve the homepage panels through the published read store, with no
public D1 queries.

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

Only enable sorting keys explicitly listed in `development-roadmap.md` Phase 5.

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

Start with indexed SQL lookups.

Do not add full-text infrastructure unless the real dataset demonstrates a need.

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

Do not convert every row into oversized cards unless explicitly approved.

---

## 14. Verification

Before completing app work, run the relevant repository commands for:

- typechecking,
- linting,
- unit/integration tests,
- route/API tests.

For UI changes, verify:

- loading state,
- empty state,
- error state,
- pagination,
- keyboard/focus behavior,
- mobile overflow,
- frozen sorting behavior.

Do not claim visual behavior is correct without checking it.
