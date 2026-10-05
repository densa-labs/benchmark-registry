# ingestor/AGENTS.md

Applies to the Python ingestion system.

Read the root `AGENTS.md`, `docs/data-contract.md`, and `docs/registry-numbering.md` first.

The ingestor is the **primary controlled write path** into Benchmark Registry.

---

## 1. Core principle

Never make ingestion more permissive merely to get problematic data through.

Accuracy and provenance take priority over convenience.

---

## 2. Supported operations

The v1 CLI should support bounded operations equivalent to:

```text
ingest company
ingest result
ingest model
ingest benchmark
ingest batch
```

Required modes:

```text
--dry-run
--commit
```

Do not add `--force` in v1.

Production mutation must require explicit commit intent.

`ingest benchmark` owns benchmark families, aliases, versions, metrics, and
benchmark-version evaluators. `ingest model` owns model aliases and optional
stealth redirect declarations. `ingest result` owns run evaluators and sources.
Namespaces are migration-owned approved seed data. `ingest company` creates
reviewed, provenance-backed namespace/company authorizations; model ingestion
requires the mapping to exist. No other operation creates those mappings.

---

## 3. Required validation

Validate before write as applicable to the selected operation:

- company existence or company duplicate/conflict state,
- company slug, establishment precision, and provenance,
- namespace existence,
- Registry No. format,
- namespace/sequence consistency,
- release ordering or documented late-backfill exception,
- namespace/company authorization,
- benchmark family existence,
- benchmark version existence,
- metric existence,
- benchmark-version/metric consistency,
- evaluator set presence,
- reasoning level when supplied,
- score type,
- run reference,
- exact source URLs and exactly one primary source,
- reported date,
- duplicate/conflict state.

Never invent a missing value during validation.

---

## 4. Result behavior

Result states:

```text
VALID
SKIPPED
CONFLICT
ERROR
```

Expected behavior:

```text
Exact duplicate    -> SKIPPED
Missing dependency -> ERROR
Possible conflict  -> CONFLICT and stop
Valid new record   -> stage/insert
```

Never silently overwrite an existing result.

Never collapse two distinct evaluation runs into one record.

---

## 5. Result semantics

A result records:

```text
model
reasoning_level
benchmark_version
metric
run_ref
score_value
score_raw
reported_at
evaluator_set
sources
```

Reasoning level belongs to the result, not the base model.

Benchmark version must be explicit.

Metric must be explicit.

Every source must be exact and one source must be marked primary.

Logical identity, run-reference fallback, evaluator-set hashing, and duplicate /
conflict behavior are defined in `docs/data-contract.md`. Do not invent a new
`run_ref` merely to get a conflict through validation.

---

## 6. Source policy

Use this priority:

1. benchmark/evaluator primary source,
2. model developer model card or official primary source.

Do not substitute:

- search-result snippets,
- random secondary coverage,
- unsourced social posts,
- inferred values,

when an accessible primary source exists.

If no acceptable source exists, stop.

If primary sources disagree materially, do not choose silently.

---

## 7. Registry numbering

Do not assign or modify Registry Nos. casually.

Registry No. assignment follows `docs/registry-numbering.md`, including release
precision, deterministic ties, immutable numbers, late backfills, and exhaustion.

Registry Nos. are strings.

Never:

- reuse a public Registry No.,
- renumber an existing public model,
- derive sequence from marketing model numbers,
- guess release ordering.

If release order is uncertain, stop and report.

---

## 8. Batch ingestion

Batch ingestion is atomic.

Committed batches must be atomic. Do not leave local or production data partially
applied if one record fails validation or write execution.

Dry-run must show what would happen without writing.

A committed batch should be safely rerunnable.

---

## 9. Conflict detection

The ingestor must distinguish:

- exact duplicate,
- likely update/conflict,
- distinct evaluation result.

If the schema cannot distinguish these safely, stop and report the schema ambiguity rather than adding heuristics that may lose information.

---

## 10. Database writes

Use only the approved local and production D1 adapters in `docs/data-contract.md`.

After an ambiguous network response, re-query logical identities before retrying;
never blindly replay a write batch.

Keep write logic centralized.

Do not create alternate hidden write paths.

Do not mutate production schema from the ingestor.

---

## 11. Tests

At minimum, maintain tests for:

- valid company ingestion,
- valid model ingestion,
- valid benchmark/version ingestion,
- valid result ingestion,
- valid multi-record batch,
- exact duplicate,
- conflicting result,
- distinct rerun,
- ambiguous rerun,
- additional citation for an existing run,
- evaluator-set conflict,
- malformed Registry No.,
- namespace mismatch,
- unauthorized company/namespace pairing,
- late historical assignment,
- namespace exhaustion,
- unknown metric,
- metric/version mismatch,
- numeric canonicalization, integer rejection of fractions, and metric bounds,
- text metric rejection of numeric `score_value`,
- unknown benchmark version,
- missing source,
- malformed date,
- local atomic batch failure,
- disposable-remote D1 atomic batch failure.

A bug affecting data correctness should gain a regression test.

---

## 12. Output

CLI output should be concise and machine-readable enough for agents.

Prefer explicit statuses and record identifiers.

Do not hide warnings in verbose logs.

---

## 13. Stop conditions

Stop instead of guessing when:

- Registry numbering is ambiguous,
- release ordering is uncertain,
- a required source is unavailable,
- two primary sources conflict materially,
- a result may be either duplicate or rerun and cannot be distinguished,
- a task requires weakening validation,
- a task would silently rewrite historical Registry data.
