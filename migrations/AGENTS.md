# migrations/AGENTS.md

Applies to D1 schema migrations.

Read the root `AGENTS.md`, `data-contract.md`, and `registry-numbering.md` first.

---

## 1. Migration-only schema changes

All production schema changes must be represented by versioned migrations.

Do not manually mutate production schema.

Do not place schema-changing SQL in request handlers or ingestion code.

---

## 2. Reproducibility

Migrations must be:

- ordered,
- deterministic,
- forward reproducible,
- reviewable in Git.

A clean database should be constructible from migrations alone.

---

## 3. Registry stability

Never write a migration that silently:

- renumbers public Registry Nos.,
- reuses identifiers,
- collapses distinct historical results,
- drops provenance fields,
- rewrites benchmark version identity.

Any destructive change requires explicit approval and a documented migration plan.

---

## 4. Constraints

Prefer database-enforced correctness for stable invariants such as:

- unique Registry Nos.,
- unique namespace prefixes,
- unique benchmark slugs,
- unique company slugs,
- unique benchmark family/version route-key pairs,
- normalized alias uniqueness within each entity type,
- unique logical result identities,
- foreign-key integrity.

Also enforce the cross-table invariants required by `data-contract.md`, including
benchmark-version/metric consistency, namespace/company authorization, source
cardinality, and redirect integrity.

Do not rely solely on application code for invariants the database can safely enforce.

---

## 5. Indexes

Add indexes only for demonstrated query patterns or integrity needs.

Avoid indexing every column.

When adding an index, identify the query or constraint it serves.

Do not create a second explicit index when a primary-key or unique constraint
already provides the same leading columns.

---

## 6. Verification

Every migration change must be tested against:

- a clean database,
- the previous schema state when applicable.

Verify:

- migration applies,
- constraints behave as expected,
- seed data remains valid,
- no frozen identifier changes unexpectedly.

If rollback is unsafe or unsupported, document recovery expectations before approval.
