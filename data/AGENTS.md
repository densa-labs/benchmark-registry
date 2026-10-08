# data/AGENTS.md

Applies to tracked Registry data and ingestion source files.

Read the root `AGENTS.md` first, especially its essential rules (section 2).

This directory is evidence-backed project data, not scratch space.

## Layout

```text
batches/manifest.json   ordered list of every batch: file, sha256, and when it
                        was applied to staging and production
batches/*.json          ingestor input documents, one unit of work each
staging-only/           records kept off production; schema-checked, never replayed
evidence/<work-unit>/   research notes and before/after snapshots for a unit
reasoning-labels.json   provider reasoning label → fixed effort vocabulary
corrections.json        curated notes shown on /corrections
```

A new batch is appended to the manifest with the next `order` and its sha256.
Do not edit a batch that has been applied; correct it with a later correction
batch so replay keeps the history. Its `applied` timestamps stay `null` until the
batch is committed to that environment.

Check tracked data from `ingestor/`:

```sh
uv run python ../scripts/validate_data.py   # schema, manifest hashes, cross-batch rules
uv run python ../scripts/check_replay.py    # the manifest replays twice with no change
```

---

## 1. Evidence-first rule

Every factual Registry value must be grounded in an acceptable source.

Source priority:

1. benchmark/evaluator primary source,
2. model developer model card or official primary source.

Do not use:

- search-result snippets as evidence,
- secondary articles when primary evidence exists,
- unsourced posts,
- guessed release dates,
- guessed evaluator names,
- inferred reasoning levels,
- inferred benchmark versions.

A metric direction needs a primary source that states it in words or marks that
metric with an up or down arrow in the benchmark's own results table (owner
decision, 2026-10-08). Never take it from the metric's name or a table's sort order.

---

## 2. Preserve provenance

Each result must retain:

- logical run reference,
- every exact source URL and one identity-bearing primary source,
- reported date,
- complete evaluator set,
- benchmark version,
- metric,
- reasoning level when applicable.

Do not simplify tracked source files in ways that make provenance unrecoverable.

---

## 3. Registry numbering

Never assign a Registry No. until namespace and release order are verified.

Registry number assignment follows the registry numbering rules in the root `AGENTS.md`, including release
precision, immutable published numbers, append-only late backfills, and namespace
exhaustion.

Marketing model numbers do not dictate Registry sequence.

Do not renumber a published record.

Stealth `00` identifiers may later redirect to confirmed permanent records; do not rewrite history silently.

---

## 4. Benchmark versions

Treat benchmark family and benchmark version as distinct concepts.

A version-specific record may differ in:

- release date,
- evaluator organizations,
- metric,
- source.

Do not merge version-specific metadata into the family merely for convenience.

Each v2 benchmark version has exactly one metric. Stop for owner review rather
than silently selecting among multiple published metrics.

---

## 5. Conflicting evidence

If two acceptable primary sources disagree:

1. preserve both sources,
2. determine whether they are separate eval runs,
3. do not silently choose the higher/newer score,
4. escalate if the distinction cannot be established.

Do not invent a different `run_ref` to turn a conflict into a separate run.

---

## 6. File quality

Tracked data files should be:

- deterministic,
- reviewable in Git,
- minimally formatted,
- free of generated noise,
- stable under repeated ingestion.

Avoid storing redundant transformed copies unless required by the ingestion workflow.

---

## 7. Research stop conditions

Stop and report when:

- release ordering is not established,
- company/provider identity is uncertain,
- a benchmark version cannot be verified,
- evaluator attribution is ambiguous,
- a primary source is inaccessible and a secondary source would materially change confidence,
- two primary sources cannot be reconciled.

Do not fill gaps with plausible guesses.
