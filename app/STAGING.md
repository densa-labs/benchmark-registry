# Staging (S1.1)

Staging uses the existing Vite-built Worker and static assets. The Wrangler
`staging` environment builds `benchmark-registry-staging`, binds `DB` to the
separate `benchmark-registry-staging` D1 database, and assigns only
`staging.benchmarkregistry.org` as a Custom Domain. The top-level configuration
remains the local/future production configuration. Staging disables its
`workers.dev` and preview URLs so the custom hostname is its only public entry.

The staging D1 binding resolves by **database name**; no account or database ID
is stored in this repository. The Cloudflare account used below must own the
`benchmarkregistry.org` zone. Do not use a production D1 database for staging.

From the repository root, after authenticating Wrangler to the correct
Cloudflare account:

```sh
cd app

# Create once. Omit this command if the exact staging database already exists.
npx wrangler d1 create benchmark-registry-staging --update-config=false

# Both commands explicitly select the staging environment and remote D1.
npm run db:migrations:list:staging
npm run db:migrate:staging
npm run db:migrations:list:staging

# Builds the staging environment, checks the generated Worker config, then deploys.
npm run deploy:staging
```

The migration chain is `../migrations/0001_initial.sql`,
`0002_seed_namespaces.sql`, then `0003_search_indexes.sql`. The namespace rows
are schema reference data; the launch dataset belongs to S1.2. Repeating the
migration command applies only pending migrations.

The deployment creates the Custom Domain's DNS record and certificate when the
zone is active and the hostname is available. If Cloudflare reports an existing
conflicting CNAME or a domain approval requirement, resolve that in the
Cloudflare dashboard for **only** `staging.benchmarkregistry.org`, then rerun
`npm run deploy:staging`.

Cloudflare cannot attach the configured Custom Domain until an active
Cloudflare zone covers the hostname. If domain setup is pending, finish the
zone's DNS authorization and rerun the staging deploy command. Review existing
DNS records before any nameserver change because it affects the entire domain.

For a private staging site, create a Cloudflare Access self-hosted application
for the full `staging.benchmarkregistry.org` hostname and add the intended Allow
policy and identity provider in Cloudflare Zero Trust. This is an account-side
control; no application secret or in-app login is required. Check that both `/`
and `/api/models` require Access authentication before treating staging as
private. The repository does not specify an authorized audience, so the policy
must be chosen by the account owner.

The staging environment sets `STAGING_CRAWLER_PROTECTION=enabled` and routes all
static asset requests through the existing Worker. The Worker adds
`X-Robots-Tag: noindex, nofollow, noarchive` to staging responses and serves
`/robots.txt` with `User-agent: *` and `Disallow: /`. The top-level environment
does not set this variable or change its asset routing. Cloudflare Access may
redirect unauthenticated requests before they reach the Worker; inspect these
responses after signing in to Access.

After deployment, verify the hostname in a browser and check the read API:

```sh
curl -i https://staging.benchmarkregistry.org/api/models
```

With an empty staging database, the API should return a successful response
with an empty `data` array. With Access enabled, an unauthenticated request
should instead be intercepted by Access. Do not load the launch dataset in S1.1.
