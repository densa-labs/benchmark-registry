# AGENTS.md — Benchmark Registry v2

Benchmark Registry v2 is a curated, source-backed registry of AI models and benchmark results.

The project optimizes for:

1. correctness,
2. provenance,
3. reproducibility,
4. simple presentation,
5. bounded implementation.

This is **not** a leaderboard, community submission platform, ranking engine, social product, or general-purpose AI directory.

---

## 1. Instruction hierarchy

When working in this repository, use this authority order:

1. Explicit task/user instructions
2. Frozen root project contracts (`product-contract.md`, `data-contract.md`, and
   `registry-numbering.md`)
3. This root `AGENTS.md`
4. Any deeper `AGENTS.md` applying to the files being changed
5. Existing tests and code behavior
6. Inference

If two higher-priority sources conflict, **stop and report the conflict**. Do not silently choose one.

---

## 2. Read before changing architecture

Before making architectural or cross-cutting changes, read:

- `development-roadmap.md`
- `product-contract.md`
- `data-contract.md`
- `registry-numbering.md`

Do not duplicate those documents into code comments or additional specs unless explicitly requested.

---

## 3. Frozen product invariants

The complete, canonical frozen contracts are:

- `product-contract.md` for product behavior and routes,
- `data-contract.md` for entities, provenance, result identity, and write boundaries,
- `registry-numbering.md` for namespace and Registry No. assignment.

Treat them as hard constraints unless explicitly revised. Summaries in the roadmap
and scoped instructions are operational guidance; they do not override the
canonical contracts.

If a requested change would violate one of these, stop and surface it.

---

## 4. Frozen routes

The canonical route families and redirect behavior are defined only in
`product-contract.md`. Do not invent alternate canonical routes without explicit
approval.

---

## 5. Repository map

Expected structure:

```text
/
├── app/                    # frontend + read-only Worker/API
├── ingestor/               # Python ingestion CLI
├── data/                   # tracked ingestion/source data
├── migrations/             # D1 migrations
├── tests/
├── scripts/
└── README.md
```

Do not add new top-level directories without a concrete implementation need.

Scoped rules:

- `app/AGENTS.md`
- `ingestor/AGENTS.md`
- `data/AGENTS.md`
- `migrations/AGENTS.md`

Always read the deepest applicable `AGENTS.md` before editing files in that subtree.

---

## 6. Development behavior

Use the smallest complete change that satisfies the task.

Prefer:

- explicit code,
- small modules,
- deterministic behavior,
- typed interfaces where practical,
- tests that exercise real behavior,
- schema constraints over application-only assumptions,
- boring implementations over speculative abstractions.

Avoid:

- premature plugin systems,
- unnecessary abstraction layers,
- generic repository frameworks,
- hidden fallback behavior,
- silent data coercion,
- feature additions not required by the frozen contract.

Do not redesign neighboring systems just because a local implementation could be “cleaner.”

---

## 7. Dependency rule

The implementation dependency order is:

```text
schema
  ↓
ingestor
  ↓
real data
  ↓
schema validation
  ↓
API
  ↓
UI
```

Do not compensate for an earlier-layer defect in a later layer.

Examples:

- If seed data exposes a schema flaw, fix the schema.
- If the ingestor cannot represent a result cleanly, do not manually insert it.
- If the API shape is wrong, do not add a frontend workaround.
- If source provenance is incomplete, do not guess in presentation code.

---

## 8. Data accuracy

Accuracy is a product feature.

Never invent or infer a factual Registry value when the source does not establish it.

Primary-source priority:

1. benchmark/evaluator primary source,
2. model developer model card or official primary source.

If two primary sources materially disagree, preserve the disagreement or stop for review. Do not silently merge conflicting values.

Do not use search-result snippets, secondary articles, or unsourced posts when an accessible primary source exists.

---

## 9. Testing and verification

Every implementation task must leave deterministic evidence.

Before marking work complete:

1. run the most relevant targeted tests,
2. run broader checks required by the affected subtree,
3. inspect the diff,
4. verify no frozen invariant was changed,
5. report any unresolved risk.

Do not claim tests passed unless they were actually run.

If the repo does not yet contain the expected verification commands, add them only when that is within task scope.

---

## 10. Agent task shape

Prefer work units with:

```text
Goal
Inputs
Scope
Out of scope
Implementation requirements
Verification
Deliverables
Stop conditions
```

If a task is too broad to verify as one unit, split it.

---

## 11. Stop conditions

Stop and report instead of guessing when:

- a frozen requirement conflicts with implementation,
- Registry numbering cannot be determined confidently,
- release ordering is ambiguous,
- two primary sources materially disagree,
- a schema migration would renumber public records,
- completing the task requires weakening validation,
- completing the task requires losing provenance,
- a task implicitly requires a feature explicitly excluded from v2,
- a result cannot be distinguished from a duplicate or legitimate rerun,
- destructive migration behavior is not explicitly approved.

A concise blocker report is better than a speculative implementation.

---

## 12. Git and commits

Prefer small commits aligned to complete work units.
Use the Conventional Commits naming standard.

Good examples:

```text
feat(db): add initial registry schema
feat(ingestor): validate registry numbers
test(ingestor): cover result conflicts
feat(api): add benchmark version endpoint
feat(ui): add result page-size selector
```

Avoid:

```text
update stuff
misc fixes
phase 3
big frontend changes
```

Do not mix unrelated roadmap phases unless unavoidable.

---

## 13. Agent handoff

When handing work to another agent, leave:

```text
What changed
Why
Files changed
Tests run
Known limitations
Unresolved questions
Next expected task
```

Keep the handoff concise and factual.

Do not require the next agent to reconstruct context from chat history.

---

## 14. Change control

If a frozen contract must change:

1. stop the affected work,
2. state the exact contradiction,
3. propose the smallest viable revision,
4. describe migration/backward-compatibility impact,
5. wait for explicit approval.

Do not reinterpret a frozen rule as “close enough.”

---

## 15. Definition of good agent behavior

A good agent in this repository:

- reads the relevant contracts,
- changes only what is necessary,
- preserves provenance,
- adds or updates tests,
- verifies its work,
- reports uncertainty,
- leaves the repository easier for the next agent to understand.

Optimize for correctness and bounded completion, not activity volume.

---

## 16. Owner decisions

Approved by the owner on 2026-10-04 in response to `docs/audit/audit-2026-10.md`.
Treat these as explicit task instructions; do not reopen them.

1. The GPT-6.1 Sol × exploitbench-internal-port record in
   `data/batches/expansion-2026-09-30-cohort-07.json` stays off production. It
   must be moved out of `data/batches` so that no replay can publish it.
2. Approved, but deferred to later batches. Do not implement any of these
   before their batch, and do not make changes that would make them harder:
   - effort uses a fixed vocabulary (`none`, `low`, `medium`, `high`, `xhigh`,
     `max`), and the provider's raw label is kept separately;
   - tool and harness settings become their own dimension;
   - Terminal-Bench Science becomes its own benchmark;
   - company establishment dates stay hidden until sourced;
   - Hugging Face scores attributed to Artificial Analysis are not primary.

---

## 17. Extra development information

- Do not use, unless explicitly stated, the `superpowers` skill and any related skill alongside it.
