# P11.5 — Page Metadata remediation

## Architecture

The existing Worker reads the app-owned Vite HTML template and replaces its
title, description, and Open Graph tags before returning the document. Small
bound D1 reads supply canonical entity names, benchmark aliases, exact version
labels, and version evaluator names. The frontend remains client-rendered;
metadata requires no browser effect. Existing links and search navigation request
new documents. Local, staging, and production requests use the same logic.

There is one metadata generator in `app/worker/metadata.ts`. Superseded generic
SEO titles were removed: entity titles no longer use “Benchmark Results”,
“Models & Benchmarks”, or a redundant site-name suffix. Index titles no longer
start with “AI”.

## Frozen conventions

| Route/state | Title | Description |
| --- | --- | --- |
| Homepage | `Benchmark Registry` | `AI model benchmark results in one place \| Benchmark Registry` |
| Models index | `Models \| Benchmark Registry` | `AI models and their benchmark results` |
| Benchmarks index | `Benchmarks \| Benchmark Registry` | `AI benchmarks and model evaluation results` |
| Companies index | `Companies \| Benchmark Registry` | `AI companies, models, and benchmark results` |
| Model | `{Model} \| Benchmarks` | `{Company}'s {Model} model evaluation and benchmark results \| Benchmark Registry` |
| Company | `{Company} \| Benchmarks` | `{Company} model evaluation and benchmark results \| Benchmark Registry` |
| Benchmark family | `{Benchmark} \| Benchmarks` | `Model results across versions of {Benchmark}` |
| Benchmark version | `{Benchmark} {Version} \| Results` | `{Evaluator}'s {Benchmark} {Version} model results` |
| Exact result | `{Model} \| {Benchmark} {Version}` | `{Company}'s {Model} evaluation results on {Benchmark} {Version}` |

P11.3's naming helpers provide recognizable benchmark names. Family descriptions
include the canonical expansion when the title uses a reviewed short name.
Family pages show multiple versions and do not invent an active version.

Version labels come from the version row addressed by the immutable route key.
Result metadata requires one valid immutable result key belonging to that exact
benchmark/version. Missing, unrelated, malformed, or duplicate result keys leave
the exact version metadata active. The company in result descriptions is the
model developer. Version descriptions use the sole stored version evaluator;
there is no primary evaluator designation in the current schema. Zero or
multiple evaluators use `Model results on {Benchmark} {Version}`.

Stored formatting is preserved: `TEST`, `Verified`, decimals, years, and official
variants. The live CursorBench version is `4.0`; metadata retains `4.0` rather
than changing it to the illustrative `4`. Tests separately cover exact `4`.

Global search is a control that navigates to existing entity/result routes, with
no standalone public search page. Arbitrary queries do not become title copy.

## Open Graph and document integrity

Open Graph title and description equal the document title and description.
`og:type` is `website`, `og:site_name` is `Benchmark Registry`, and `og:url` uses
the HTTPS request URL only on the configured public hosts. This does not define
canonical or query-indexing policy. The app previously had no Twitter card
metadata; no separate platform system or social image was added. Website pages
receive no invented publication dates.

All inserted values are HTML-escaped. Existing title/description/Open Graph tags
are removed before one new set is inserted. Transformed documents discard static
template validators and length and use `Cache-Control: no-store`. Asset responses,
read API behavior, immutable model redirects, and HEAD semantics are preserved.

## Verification

- Typecheck and lint passed.
- All 202 tests across 11 files passed, including SQL-backed metadata response
  tests, escaping, exact versions, evaluator ambiguity, result scoping, absence
  of old patterns, duplicate tags, redirects, and staging protection.
- Staging and production builds and their environment verification scripts passed.
- All 18 Worker/client artifact SHA-256 hashes matched between environments.
- The diff was inspected; `git diff --check` passed. Frozen contracts, numbering,
  Registry data, and migrations were unchanged. No database writes occurred.

Staging version: `137110fc-cc19-435a-bc50-875caff954aa`.
Production version: `77c7995d-6e0d-4c67-8ec8-29d697abc816`.

Authenticated staging heads were checked first, then Cloudflare's normal Access
CLI sign-in was used to inspect raw HTTP response bodies. Browser source-view
navigation was blocked; it was not used as evidence. Thirteen raw initial staging
HTML responses matched exact title/description and Open Graph expectations,
including an empty React root proving metadata precedes client rendering.
Staging `X-Robots-Tag: noindex, nofollow, noarchive` and the exact robots disallow
body passed live verification. Unauthenticated staging page and API requests
continued to redirect to Access. Access configuration was unchanged.

Production was deployed afterward. The same thirteen raw production response
bodies passed, including exact Open Graph URLs, one title and description,
and an empty initial React root. No production response contained STAGING text,
a staging hostname, or noindex metadata/header. Exact title equality excludes
the superseded generic P11.5 title patterns.

Representative routes checked in both environments:

- `/`
- `/models`, `/models/40003` (Grok 4.7), `/models/10014` (GPT-6 Sol)
- `/companies`, `/companies/anthropic`
- `/benchmarks`, `/benchmarks/mmmu`
- `/benchmarks/deep-swe/1.1`, `/benchmarks/cursorbench/4-0`
- `/benchmarks/ai2d/test`, `/benchmarks/chartqa/test`
- Exact Claude Opus 5.5 × CursorBench 4.0 history/result-key state

## Deferred scope

Sitemaps, production robots, canonical URLs, query/filter indexing policy,
crawl architecture, and status/soft-404 audits remain P11.6. UI, footer,
theme/favicon, performance, legal, and staging title/banner work remain later
phases. Metadata does not make client-rendered page content server-rendered.

P11.5 metadata remediation complete: YES

P11.6 was not started.
