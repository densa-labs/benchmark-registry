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
- Recent Models,
- Recently Added.

No Top Models.

Recent Models uses the precision-aware `release_at` ordering in
`data-contract.md`, descending, then canonical model name ascending. Recently
Added is ordered by immutable Registry `published_at`
descending, then Registry No. ascending. Neither section is a ranking.

## Routes

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

Route slugs and benchmark version segments are the immutable route keys defined
in `data-contract.md`; display names are never substituted into canonical URLs.

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
Their provenance remains in the tracked data and API; the page does not add a
provenance suffix to the date.

## Registry redirects

`/models/{registry_no}` for a redirected stealth number returns HTTP 308 to the
confirmed model route. The old number remains reserved forever.
The API model-detail response returns HTTP 200 with the confirmed model and
identifies the old number in `redirected_from`.

## Table behavior

Every result table uses the page sizes and latest/history semantics in
`data-contract.md`. Scores are display-only and are never sortable on any page.
Search, filters, sort state, view state, page, and page size use shareable URL
query parameters.

## Design direction

Basic, modern, data-first.

Avoid bureaucratic/government visual language, excessive cards, decorative gradients, giant heroes, and dashboard-style clutter.
