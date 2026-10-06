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
2. Frozen project contracts (`docs/product-contract.md`, `docs/data-contract.md`, and
   `docs/registry-numbering.md`)
3. This root `AGENTS.md`
4. Any deeper `AGENTS.md` applying to the files being changed
5. Existing tests and code behavior
6. Inference

If two higher-priority sources conflict, **stop and report the conflict**. Do not silently choose one.

---

## 2. Read before changing architecture

Before making architectural or cross-cutting changes, read:

- `development-roadmap.md` (local and gitignored; read it when present)
- `docs/product-contract.md`
- `docs/data-contract.md`
- `docs/registry-numbering.md`

Do not duplicate those documents into code comments or additional specs unless explicitly requested.

---

## 3. Frozen product invariants

The complete, canonical frozen contracts are:

- `docs/product-contract.md` for product behavior and routes,
- `docs/data-contract.md` for entities, provenance, result identity, and write boundaries,
- `docs/registry-numbering.md` for namespace and Registry No. assignment.

Treat them as hard constraints unless explicitly revised. Summaries in the roadmap
and scoped instructions are operational guidance; they do not override the
canonical contracts.

If a requested change would violate one of these, stop and surface it.

---

## 4. Frozen routes

The canonical route families and redirect behavior are defined only in
`docs/product-contract.md`. Do not invent alternate canonical routes without explicit
approval.

---

## 5. Repository map

```text
/
├── app/          # React pages, the build-time renderer (worker/), static build and deploy scripts
├── ingestor/     # Python ingestion CLI (the only write path into D1) and its tests
├── data/         # tracked batches, corrections, label mappings and research evidence
├── migrations/   # ordered D1 migrations and their rollbacks
├── scripts/      # repository checks: data validation, replay, backup, SEO check
├── docs/         # the three frozen contracts only
├── assets/       # README logos
└── .github/      # CI workflow and issue templates
```

Tests live next to the code they cover (`app/src/*.test.tsx`,
`app/worker/*.test.ts`, `ingestor/tests/`, `scripts/test_*.py`). Do not add new
top-level directories without a concrete implementation need.

Scoped rules:

- `app/AGENTS.md`
- `ingestor/AGENTS.md`
- `data/AGENTS.md`
- `migrations/AGENTS.md`

Always read the deepest applicable `AGENTS.md` before editing files in that subtree.

### How the site runs

The public site is **Workers static assets only**. There is no deployed Worker
script, no KV store, no public `/api`, and no `/healthz`.

```text
ingestor ──writes──▶ D1 (staging or production, the source of truth)
                       │
npm run deploy:<env> ──┤ reads each table once, prerenders every page and data file
                       ▼
               app/dist/client ──wrangler deploy──▶ static assets
```

- `app/worker/` is the build-time renderer. It runs inside
  `app/scripts/build-static.mjs`, never on a request.
- The read routes in `app/worker/api-router.ts` run at build time and in the
  browser (`app/src/static-api.ts`) against `data/manifest.json` and its
  content-hashed `data/objects/*.json`.
- `/version.json` names the live build (commit, data generation, counts).
- New data appears only after the next deploy of that environment.

Operational detail lives in `app/STATIC-SITE.md` (build, caching, redirects,
rollback), `app/STAGING.md` and `app/PRODUCTION.md` (migrations, ingestion and
deploy order).

Build and deploy from a clean clone outside iCloud Drive. An iCloud-synced
checkout gains `… 2` duplicate files that end up in the build, and its Python
virtualenv `.pth` files can be hidden, which breaks `uv run pytest` (run it as
`PYTHONPATH=src uv run pytest` there).

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
read layer (build-time projections and static data files)
  ↓
UI
```

Do not compensate for an earlier-layer defect in a later layer.

Examples:

- If seed data exposes a schema flaw, fix the schema.
- If the ingestor cannot represent a result cleanly, do not manually insert it.
- If the read data shape is wrong, fix the projection, not the page.
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

The checks CI runs (`.github/workflows/ci.yml`), from the repository root:

```sh
cd app && npm run typecheck && npm run lint && npm test && npm run build && npm run test:seo
cd app && npm run db:migrate:local                        # migrations apply cleanly
cd ingestor && uv run pytest && uv run pytest ../scripts
uv run --project ingestor ruff check ingestor scripts app/scripts
cd ingestor && uv run python ../scripts/validate_data.py  # tracked data
cd ingestor && uv run python ../scripts/check_replay.py   # manifest replays twice
```

Add a new verification command only when that is within task scope.

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

Approved by the owner on 2026-10-04 in response to the October 2026 audit.
Treat these as explicit task instructions; do not reopen them.

1. Done. The GPT-6.1 Sol × exploitbench-internal-port record stays off
   production. Its batch lives in `data/staging-only/`, outside
   `data/batches`, so no replay can publish it. `scripts/validate_data.py`
   still schema-checks it. Do not move it back.
2. Approved for later batches:
   - Done: effort uses a fixed vocabulary (`none`, `low`, `medium`, `high`,
     `xhigh`, `max`), and the provider's raw label is kept separately
     (`data/reasoning-labels.json`, migrations 0013 and 0018).
   - Done: tool and harness settings are their own dimension (benchmark
     configurations, migration 0014).
   - Done: company establishment dates stay hidden until sourced
     (`user_attested` dates are returned as null by the read layer).
   - Done: Hugging Face scores attributed to Artificial Analysis are not
     primary (retracted in `owner-decision-5-retractions-2026-10-06.json`).
   - Pending: Terminal-Bench Science becomes its own benchmark. It is still a
     `science-0.1` version of `terminal-bench`. Do not implement it before its
     batch, and do not make changes that would make it harder.

---

## 17. Extra development information

- Do not use, unless explicitly stated, the `superpowers` skill and any related skill alongside it.
