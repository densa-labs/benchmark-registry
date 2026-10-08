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
2. This root `AGENTS.md`, including the essential rules in section 2
3. Any deeper `AGENTS.md` applying to the files being changed
4. Existing tests and code behavior
5. Inference

If two sources at the same level conflict, stop and report the conflict.

---

## 2. Essential rules

These rules replace the former `docs/` contracts. Change them only when the
owner asks; when a task would break one, say so before writing code.

### Product

- A simple, data-first registry. Not a leaderboard: no rankings, "top models",
  composite or average scores, winners, or sortable score columns anywhere.
- Canonical routes: `/`, `/models`, `/models/{registry_no}`, `/compare`,
  `/benchmarks`, `/benchmarks/{slug}`, `/benchmarks/{slug}/{version_slug}`,
  `/companies`, `/companies/{slug}`. Route keys are the immutable slugs and
  Registry Nos., never display names. Supporting pages (search, recent,
  coverage, corrections, compare pairs, legal pages, badges, sitemap, feed,
  `/version.json`, `/llms.txt`, the results CSV, share cards) must not change
  canonical route meaning. Do not add canonical routes without approval.
- Every page is prerendered at build time from one D1 snapshot and served as
  static assets; no public API. New data appears only after a deploy.
- Homepage: global search, Explore Benchmarks (at most five families, by
  distinct model count, then name, then slug), Latest Additions (at most five
  newest result rows by ingestor id, not by report date), All Models.
  Redirected stealth models are excluded from counts and feeds.
- Result tables: page sizes exactly 50 / 100 / 500, default 50, no "All";
  `Latest` (default) and `History` views; search, filters, view, page and page
  size live in shareable URL state.
- Benchmark versions list by release (precision-aware, descending), then
  version text. "Latest" is the first in that order; no inferred semver.
- Compare: two selections with optional reasoning filters
  (`/compare?models=10001,20001&reasoning=high,max`), latest result per series,
  shared benchmarks first, `—` for missing. Show evaluator, version, metric,
  reasoning, date and source; flag differing versions, metrics or evaluator
  sets as possibly non-equivalent. Parameterized compares are noindex.
- Provider page: "Latest model" is the newest non-redirected model by release
  date (ties: name). `user_attested` establishment dates stay hidden until a
  primary source establishes them.
- A redirected stealth Registry No. returns 308 to the confirmed model; the
  old number stays reserved.
- Design: basic and modern; no heavy cards, gradients, giant heroes or
  dashboard clutter.

### Data

- Entities: companies (providers, `company` or `ai_unit`), namespaces, models,
  model aliases, benchmarks (families), benchmark versions, metrics, results;
  plus integrity tables for evaluators, sources, configurations and redirects.
- Slugs are lowercase ASCII kebab-case and unique. Names and aliases also store
  an NFKC + case-folded normalized form; aliases are unique within their type.
- Dates are ISO 8601 with explicit precision. Model release, version release and
  result report dates must be `date` or `timestamp`; if a source gives only a
  year, stop. Compare dates only at the precision both values have.
- Every fact keeps an exact source URL and a checked timestamp. Source priority:
  benchmark/evaluator primary source, then the developer's primary source.
  Never use snippets or secondary articles when a primary source exists. If
  primary sources disagree and are not shown to be different runs, stop.
- Each benchmark version has exactly one metric, enforced in the schema. Metric
  keys are kebab-case; numeric scores are parsed as `Decimal`, stored as
  canonical decimal text, and the exact source text is kept in `score_raw`.
- A result is one model's observation in one run. Logical identity: model,
  reasoning level, benchmark version, metric, `run_ref`. Reasoning level is
  result metadata (empty string = not stated) and never a model property.
- `run_ref`: the evaluator's stable run id when published; otherwise
  `source:<normalized primary URL>#<reported_at>`. Never invent a `run_ref` to
  get past a conflict.
- `result_key` = lowercase hex SHA-256 of `v1`, Registry No., reasoning level,
  benchmark slug, version label, metric key, `run_ref`, joined by NUL bytes.
  `evaluator_set_key` = SHA-256 of `v1` and the sorted evaluator keys, joined
  by NUL. Both are immutable.
- Conflicts: identical record = SKIPPED; same identity with a different score,
  evaluator set or date = CONFLICT and stop; a proven same-run citation is
  added without replacing provenance; a different `run_ref` is a distinct run.
  Old runs are never overwritten.
- Latest view: one row per (model, reasoning, version, metric, evaluator set),
  the greatest `reported_at`, then `result_key`. History shows every run.
- Writes go only through the Python ingestor (local SQLite, or D1 over the HTTP
  API with credentials from the environment). `--dry-run` writes nothing;
  `--commit` sends one atomic batch. After an ambiguous network response,
  re-query before retrying.

### Registry numbering

- Registry No. = namespace prefix + three-digit sequence (`001`–`999`), stored
  as text. Prefixes: 00 stealth, 10 OpenAI, 15 OpenAI OSS, 20 Anthropic,
  30 Google, 35 Google Gemma, 40 SpaceXAI, 50 Cursor, 60 NVIDIA,
  70 Microsoft, 80 Meta, 90 Mistral, 100 reserved, 110 DeepSeek,
  120 Moonshot AI, 130 Alibaba, 140 MiniMax, 150 Z.ai, 160 Thinking Machines,
  170 SSI.
- Published numbers are permanent: never renumber or reuse. New models take
  the next unused sequence in their namespace; a model released before
  already-numbered ones is appended with `sequence_exception_reason =
  late_backfill`. Same-day releases order by case-folded name, then source URL.
- `release_at` is the earliest official public availability from a primary
  source. Marketing numbers do not set the sequence.
- A new Registry No. is a distinct released artifact; renames and API aliases
  stay aliases. If identity or release order is not established, stop.
- Namespace `00` is only for stealth models; a stealth number may redirect once
  to a confirmed model. A company may publish only in namespaces it is
  authorized for. At sequence 999 a namespace stops until a new prefix is
  approved.

---

## 3. Repository map

```text
/
├── app/          # React pages, the build-time renderer (worker/), static build and deploy scripts
├── ingestor/     # Python ingestion CLI (the only write path into D1) and its tests
├── data/         # tracked batches, corrections, label mappings and research evidence
├── migrations/   # ordered D1 migrations and their rollbacks
├── scripts/      # repository checks: data validation, replay, backup, SEO check
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

## 4. Development behavior

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
- feature additions nobody asked for.

Do not redesign neighboring systems just because a local implementation could be “cleaner.”

---

## 5. Dependency rule

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

## 6. Data accuracy

Accuracy is a product feature.

Never invent or infer a factual Registry value when the source does not establish it.

Primary-source priority:

1. benchmark/evaluator primary source,
2. model developer model card or official primary source.

If two primary sources materially disagree, preserve the disagreement or stop for review. Do not silently merge conflicting values.

Do not use search-result snippets, secondary articles, or unsourced posts when an accessible primary source exists.

---

## 7. Testing and verification

Every implementation task must leave deterministic evidence.

Before marking work complete:

1. run the most relevant targeted tests,
2. run broader checks required by the affected subtree,
3. inspect the diff,
4. verify no essential rule (section 2) was broken,
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

## 8. Agent task shape

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

## 9. Stop conditions

Stop and report instead of guessing when:

- an essential rule conflicts with the implementation,
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

## 10. Git and commits

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

## 11. Agent handoff

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

## 12. Change control

If a task needs an essential rule changed, say which rule and why, propose the
smallest change, and wait for the owner. Do not treat a rule as "close enough".

---

## 13. Definition of good agent behavior

A good agent in this repository:

- reads the essential rules and the scoped `AGENTS.md`,
- changes only what is necessary,
- preserves provenance,
- adds or updates tests,
- verifies its work,
- reports uncertainty,
- leaves the repository easier for the next agent to understand.

Optimize for correctness and bounded completion, not activity volume.

---

## 14. Owner decisions

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

## 15. Extra development information

- Do not use, unless explicitly stated, the `superpowers` skill and any related skill alongside it.
