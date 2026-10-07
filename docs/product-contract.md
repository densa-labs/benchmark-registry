# Benchmark Registry v2 — Frozen Product Contract

**Status:** Frozen

This file is the canonical contract for public behavior, routes, and page
semantics. The roadmap and scoped agent instructions may summarize it but do not
override it.

## Product identity

Benchmark Registry v2 is a simple, modern, data-first registry of AI models and benchmark results.

It is not a leaderboard.

## Homepage

Includes:

- global search,
- Explore Benchmarks,
- Latest Additions,
- All Models (the complete alphabetical model directory).

Explore Benchmarks shows at most five benchmark families, with distinct model
counts and retained result counts across their versions. Families with more
models appear first; ties use normalized benchmark name, then slug ascending.
Families without results may appear with zero counts. Redirected model records
are excluded from these counts.

Latest Additions shows at most five newly inserted benchmark result records,
ordered by the controlled ingestor's increasing result ID descending. Each row
links to the model, benchmark version, and primary source and shows the recorded
score and any result-level reasoning context. Result report dates are not
Registry addition timestamps and do not determine this feed's order. Redirected
model records are excluded. Existing results are not promoted by metadata or
citation corrections.

No Top Models. Neither panel ranks models or aggregates their scores.

Both panels are computed at build time from the same D1 snapshot as every
other page, so they change only with a new deploy.

## Routes

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

Route slugs and benchmark version segments are the immutable route keys defined
in `data-contract.md`; display names are never substituted into canonical URLs.

The site also serves supporting pages outside these route families: `/search`,
`/recent`, `/coverage`, `/corrections`, comparison pairs at
`/compare/{name-slug}-vs-{name-slug}`, `/about`, `/contact`, `/legal`,
`/privacy`, `/terms`, result badges at `/badge/{registry_no}/{slug}.svg`,
`/sitemap.xml`, `/feed.xml`, `/version.json`, `/llms.txt`, the published-results
download at `/downloads/benchmark-registry-results.csv`, and share-card images at
`/og/site.png` and `/og/models/{registry_no}.png`. They must not change the
semantics of the canonical routes.

Every page is prerendered at build time and served as a static asset; there is
no public `/api`. The site's read data is published as static files and changes
only with a new deploy.

## Compare models

`/compare` compares two model selections using existing Registry metadata and
the latest result per logical series from `data-contract.md`. Reasoning levels
filter individual results; they remain result metadata.

The page has sticky model/reasoning selectors, followed by aligned Information
rows (Organization, Released, Registry No., canonical Status, and Source).
Benchmark rows put both selections' scores beside the benchmark name. Shared
benchmarks appear first, then other benchmarks with `—` for a missing result.
Search and All / Shared only controls filter these rows. Result pagination uses
50 / 100 / 500 rows, with default 50.

Match benchmark version and metric identities before displaying an unmatched
pair of versions. Preserve every evaluator's latest series and its provenance.
Explain differences in version, metric, or evaluator set as potentially
non-equivalent. Matching recorded context does not establish identical
methodology: the Registry does not currently record evaluation-protocol IDs.
Expandable details expose each result's evaluator, version, metric, reasoning,
reported date, and primary source. No winners, score averages, or rankings.

Selections use shareable query state, for example
`/compare?models=10001,20001&reasoning=high,max`. Empty reasoning slots mean
not specified; `~` means use the model's first recorded reasoning level in
alphabetical order (including the empty value). Arbitrary reasoning strings
are individually percent-encoded before joining the slots. Search, filter,
page, and limit also use URL state. The base page is indexable; parameterized
comparisons remain noindex and retain their selection in canonical/share URLs.

## Model page

```text
Model Name

Released:
Company:
Source:
Registry No.:

[ Search benchmarks... ]

Benchmarks                         XX results

Benchmark     Score     Source
```

Reasoning level belongs to result context and may display as `Model Name (Max)`.

Score is not sortable.

## Benchmark family page

`/benchmarks/{slug}` shows all benchmark versions.

Versions use the precision-aware release ordering in `data-contract.md`,
descending, then version text ascending.
“Latest” means the first item under that deterministic order; semantic-version
comparison is not inferred unless the source explicitly defines it.

## Benchmark version page

```text
Benchmark Name

Evaluated by:
Release date:
Version:
Metric:

[ Search models... ]

Latest   History   <dynamic company tabs>

Results                          XX results

Company   Model   Score   Source   Registry No.
```

Page size options are exactly:

- 50
- 100
- 500

Default: 50.

No All option.

Score is not sortable.

`Latest` is the default result view and returns one latest run per logical series
as defined by `data-contract.md`. `History` returns every retained run. Dynamic
company tabs filter the active view by model company; they do not change the
latest/history rule. Both controls use shareable query-string state.

## Provider page

```text
Provider Name

Established:
Latest model: Model Name (Month Year)

[ Search benchmarks or models... ]

Benchmarks                       XX results

Benchmark   Model   Score   Source   Registry No.
```

Latest model is the published, non-redirected company model greatest under the
precision-aware release ordering in `data-contract.md`; ties use canonical model
name ascending. Preview and deprecated
models remain eligible because lifecycle status is factual metadata, not a hidden
ranking rule. A redirected stealth placeholder is not eligible.

The `/companies` index and `/companies/{slug}` detail route include companies
and standalone AI units. Establishment dates render at their stored precision.
Their provenance remains in the tracked data; the page does not add a
provenance suffix to the date. A `user_attested` establishment date is not
shown until a primary source establishes it (owner decision, 2026-10-04); the
page shows an absence state instead.

## Registry redirects

`/models/{registry_no}` for a redirected stealth number returns HTTP 308 to the
confirmed model route. The old number remains reserved forever.
The model read data requested under the old number returns the confirmed
model and identifies the old number in `redirected_from`.

## Table behavior

Every result table uses the page sizes and latest/history semantics in
`data-contract.md`. Scores are display-only and are never sortable on any page.
Search, filters, sort state, view state, page, and page size use shareable URL
query parameters.

## Design direction

Basic, modern, data-first.

Avoid bureaucratic/government visual language, excessive cards, decorative gradients, giant heroes, and dashboard-style clutter.
