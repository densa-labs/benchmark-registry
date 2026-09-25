# Production deployment (P10)

Production is the `production` Wrangler environment in `wrangler.jsonc`. It
deploys `benchmark-registry-production` to `benchmarkregistry.org` and
`www.benchmarkregistry.org` with the `DB` binding set to the separate
`benchmark-registry-production` D1 database. The same Worker returns a permanent
308 redirect from `www` to the apex, preserving the path and query string.

Cloudflare account: `1aed6fdb33b34b24c2914fcaaf48786b`.
Production D1 ID: `a7b3e1d1-34d6-432b-bd31-8ec4636916ab`.
Staging D1 ID: `59a384d9-5fba-45e4-97be-3bd1e047def1`.

Use a D1 write API token scoped to the production target for ingestion. Keep it
out of Git. The Python ingestor requires these environment variables:

```text
CLOUDFLARE_ACCOUNT_ID=1aed6fdb33b34b24c2914fcaaf48786b
CLOUDFLARE_D1_DATABASE_ID=a7b3e1d1-34d6-432b-bd31-8ec4636916ab
CLOUDFLARE_API_TOKEN=<scoped token>
```

Set `REGISTRY_REMOTE_ATOMICITY_VERIFIED=1` for commits only after the P3
disposable D1 atomicity probe has passed. Never set the production D1 ID to the
staging ID. Run from the repository root unless a command changes directory:

```sh
cd app
npm run db:migrations:list:production
npm run db:migrate:production
npm run db:migrations:list:production
cd ..

PYTHONPATH=ingestor/src python3 -m benchmark_registry_ingestor batch data/batches/p4-seed.json --target remote --dry-run
PYTHONPATH=ingestor/src python3 -m benchmark_registry_ingestor batch data/batches/p4-seed.json --target remote --commit
PYTHONPATH=ingestor/src python3 -m benchmark_registry_ingestor batch data/batches/launch-dataset.json --target remote --dry-run
PYTHONPATH=ingestor/src python3 -m benchmark_registry_ingestor batch data/batches/launch-dataset.json --target remote --commit

cd app
npm run deploy:production
```

Both batches must have no `ERROR` or `CONFLICT` before a commit. Repeating each
dry-run after ingestion should report `SKIPPED` for all records. The deploy
script builds with `CLOUDFLARE_ENV=production` and checks the generated Worker
name, both custom domains, absence of the staging crawler variable, and the
exact production D1 binding before upload. Staging has a separate environment,
database, Worker, and custom domain; do not modify its Access policy or binding.

The first production export was saved locally at
`app/.wrangler/backups/production-initial-2026-09-25.sql` and is ignored by Git.
To make another export from the app directory:

```sh
npx wrangler d1 export benchmark-registry-production --env production --remote --output .wrangler/backups/production.sql --skip-confirmation
```
