# Benchmark Registry v2 — Frozen Data Contract

**Status:** Frozen

This file is the canonical contract for Registry entities, provenance, result
identity, and write boundaries. The roadmap and scoped agent instructions may
summarize it but do not override it.

## Public entities

```text
companies
namespaces
models
model_aliases
benchmarks
benchmark_versions
metrics
results
```

The schema also uses private integrity tables. They are not additional public
product entities and do not create public routes:

```text
namespace_companies
benchmark_aliases
evaluator_organizations
benchmark_version_evaluators
result_evaluators
result_sources
registry_redirects
```

## Shared data rules

- Public slugs are lowercase ASCII kebab-case.
- `companies.slug` and `benchmarks.slug` are unique.
- Canonical names and aliases retain their display spelling and also store a
  `normalized_name` produced by Unicode NFKC normalization followed by Unicode
  case-folding. Equality and search use the stored normalized value.
- A normalized model alias is unique across all models. A normalized benchmark
  alias is unique across all benchmark families. A canonical name must not
  collide with another entity's alias in the same entity type.
- Dates use ISO 8601. Date precision is stored explicitly when a source supplies
  only a year or calendar date. Timestamps are normalized to UTC.
- Company establishment precision may be `year`, `date`, or `timestamp`; model
  release, benchmark-version release, and result report precision must be `date`
  or `timestamp`. If a model, version, or result source establishes only a year,
  ingestion stops rather than inventing a calendar date.
- Date ordering compares only precision established for both values. Values in
  the same year tie if either is year-only; values on the same date tie if either
  is date-only. The owning contract's non-date tie-break then applies. Code must
  not treat missing precision as midnight or another inferred value.
- Stored source URLs preserve the exact evidence URL. A separate normalized URL
  used for identity lowercases the scheme and host, removes a default port and
  fragment, and preserves path and query bytes. Only absolute HTTP(S) URLs are
  accepted.
- Every source-backed curated fact retains an exact primary evidence URL and
  checked timestamp. Field names may be entity-specific, such as
  `release_source_url` or `primary_source_url`. Facts with distinct sources retain
  field-specific source URLs where required below. Company establishment dates
  may instead be explicitly marked `user_attested` under the rule below.

## Companies, AI units, and namespaces

The `companies` table contains model providers. A provider may be a company or
a standalone AI unit. The existing `/companies/{slug}` route remains stable;
model relationships may be corrected through an explicit compare-and-set
ingestor operation without changing Registry Nos., benchmark results, or
namespace allocation. A superseded parent-company row may be retired only
after its models move to the AI unit, with its former facts recorded in the
tracked correction batch.

A provider records:

```text
name
slug
established_at
established_precision
established_source_url
source_url
source_checked_at
provider_kind
established_basis
established_attestation_ref
established_attested_at
```

`established_precision` is `year`, `date`, or `timestamp`. Establishment data may
be null only when no acceptable primary source establishes it and the tracked
research record documents that gap; the UI then renders an absence state rather
than guessing.

`provider_kind` is `company` or `ai_unit`. AI units are standalone. The
legacy `entity_kind` and `parent_company_id` columns remain only for safe
migration compatibility; new records use `entity_kind=company` and a null
parent link, while `provider_kind` carries the public identity.
`established_basis` is `source` or
`user_attested`. A `user_attested` date is a direct Registry owner assertion,
recorded in a tracked correction batch with its previous state, exact asserted
date, attestation timestamp, and reason. It is not presented as independently
verified. For such a date, `established_source_url` is the existing organization
context URL, not evidence for the date; `established_attestation_ref` identifies
the tracked assertion. Source-backed
dates retain their existing evidence semantics. No other factual entity is
eligible for this exception.

Namespaces follow `registry-numbering.md`. `namespace_companies` is the explicit
allow-list of companies permitted to publish models in a namespace. A company may
use multiple namespaces; namespace identity does not imply legal ownership.

## Models

A model records:

```text
canonical_name
company
namespace
sequence
registry_no
release_at
release_precision
release_source_url
source_checked_at
published_at
status
sequence_exception_reason
```

`published_at` is the immutable timestamp when the Registry first made the model
public. It powers “Recently Added” and is distinct from `release_at`.

`status` is one of `preview`, `active`, `deprecated`, or `stealth`. Status changes
do not change model identity or Registry No. Redirected stealth records remain in
the database and are linked through `registry_redirects`.

`registry_no` and `(namespace_id, sequence)` are both unique. The ingestor must
also verify that the stored Registry No. equals the namespace prefix concatenated
with the zero-padded sequence.

## Model and benchmark aliases

Model aliases may include API identifiers, dated identifiers, or previous names
that refer to the same Registry model. Renaming a model does not itself create a
new Registry No.; the identity test is defined in `registry-numbering.md`.

Benchmark aliases include abbreviations and prior names for the same benchmark
family. A version name is not a family alias.

## Benchmark families, versions, evaluators, and metrics

Benchmark family and benchmark version are separate data concepts.

Each benchmark version records:

```text
benchmark_family
version
version_slug
release_at
release_precision
metric
source_url
source_checked_at
```

`version` preserves the exact display label. `version_slug` is lowercase ASCII
matching `[a-z0-9._-]+`, is unique within its benchmark family, and is the
`{version}` route segment. The exact display version is also unique within its
family. Both values are immutable once public.

Each v2 benchmark version has exactly one metric. If a primary source defines
multiple metrics for the same version, ingestion stops for an explicit contract
revision; the Registry must not invent version names or silently choose a metric.

Evaluator organizations are normalized internal records. A benchmark version and
an individual result may each have one or more evaluators through their join
tables. Evaluator organizations do not receive public routes and do not create an
evaluator-registry feature. Each has a unique lowercase ASCII `key` and a unique
normalized name.

A metric records:

```text
name
key
storage_kind
unit
display_precision
minimum_value
maximum_value
source_url
```

`storage_kind` is `decimal`, `integer`, or `text`. `unit` is an explicit stable
identifier such as `percent`, `elo`, or `points`, not presentation copy. Numeric
scores are parsed with Python `Decimal`, stored as canonical decimal text, and
returned by the API as strings to avoid binary floating-point changes. Results
also retain the exact source spelling in `score_raw`. Text metrics store only
`score_raw`.

Metric `key` is unique lowercase ASCII kebab-case. Canonical decimal text is
finite, uses plain notation without an exponent or leading plus, removes
unnecessary leading/trailing zeroes, and normalizes negative zero to `0`.
`display_precision` is a non-negative integer and is `0` for text metrics.
Minimum and maximum are nullable canonical decimals; when present, the ingestor
enforces them inclusively and requires minimum not to exceed maximum.
Integer metrics reject fractional values; text metrics require `score_value` to
be null.

## Results

A result is one model's observation in one identifiable evaluation run. It
records:

```text
model
reasoning_level
benchmark_version
metric
run_ref
result_key
score_value
score_raw
reported_at
reported_precision
evaluator_set_key
primary_source_url
primary_source_checked_at
```

Reasoning level is result-level metadata. The normalized database key is a
non-null string; the empty string means “not supplied.” It is never copied to the
base model.

The result's required metric must equal the benchmark version's metric. Enforce
this with a database constraint, not only application validation.

`run_ref` identifies the evaluation run. Prefer a stable identifier published by
the evaluator. If none exists, the ingestor creates
`source:<normalized-primary-url>#<reported-at>` and records that it was derived.
If that fallback cannot distinguish a possible rerun, ingestion stops for review.

The logical result identity is:

```text
model
reasoning_level
benchmark_version
metric
run_ref
```

This identity is unique. Evaluator membership is normalized through
`result_evaluators`; `evaluator_set_key` is the lowercase hexadecimal SHA-256 of
`v1`, followed by the sorted evaluator keys, with every component separated by a
NUL byte. It is validated against those rows and detects an evaluator-set change
to an existing run as a conflict.

`result_key` is the lowercase hexadecimal SHA-256 of these UTF-8 components in
order, separated by NUL bytes:

```text
v1
model.registry_no
reasoning_level
benchmark.slug
benchmark_version.version
metric.key
run_ref
```

Identity components may not contain NUL. The key is immutable, unique, safe to
expose through the read API, and independent of database row order.

Each result stores exactly one identity-bearing primary source URL and checked
timestamp in required columns. `result_sources` stores zero or more additional
official citation URLs and checked timestamps; an additional URL must differ from
the primary URL. Additional citations may be attached only when they clearly
describe the same run.

## Duplicate and conflict behavior

Given an existing logical identity:

- identical score, evaluator set, reported date, and source set -> `SKIPPED`;
- different score, evaluator set, or reported date -> `CONFLICT` and stop;
- an additional official citation proven to describe the same run -> add only the
  citation, without replacing existing provenance;
- a different `run_ref` -> a distinct historical result.

The ingestor must not infer a new `run_ref` merely to bypass a conflict. Old runs
remain stored and are never overwritten by newer runs.

## Source priority

1. Benchmark/evaluator primary source
2. Model developer model card or official primary source

Search-result snippets and secondary reporting are not evidence when an
accessible primary source exists. If acceptable primary sources disagree and the
records cannot be proven to represent different runs, ingestion stops.

## Latest and historical result views

The latest result for a logical series is the row with the greatest
`reported_at`, then `result_key` ascending, for:

```text
model
reasoning_level
benchmark_version
metric
evaluator_set_key
```

The latest view returns one row per series. The history view returns every run.
Neither view deletes, updates, or hides data in storage.

## Pagination

Result tables support exactly 50, 100, or 500 rows per page. Default: 50. There
is no `All` option. Page numbers are one-based.

## Public writes and the approved D1 write path

The public app is read-only and exposes no write endpoint.

The Python ingestor is the sole user-facing controlled write path. Local mode
writes through Python `sqlite3` to the explicit `REGISTRY_LOCAL_DB_PATH` created
by the local migration command; it must not discover or guess Wrangler state
paths. Production mode uses a narrow Python adapter over Cloudflare's documented
D1 HTTP query API with an API token scoped to D1 write access for the target
account/database. Credentials are read
from environment variables and are never stored in tracked ingestion files.

`--dry-run` performs all reads and validation but issues no mutation. `--commit`
sends the complete validated unit as one D1 batch. A committed multi-record batch
must be transactional: any failed statement rolls back the batch. P3 must include
an atomic rollback probe for both the local adapter and a disposable remote D1
database before production writes are enabled.

After an ambiguous network response, the ingestor re-queries logical identities
before retrying. It must never blindly replay a write. The public Worker and its
routes remain read-only.
