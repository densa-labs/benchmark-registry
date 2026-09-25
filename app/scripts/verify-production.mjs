import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stdout } from "node:process";

const workerName = "benchmark-registry-production";
const databaseName = "benchmark-registry-production";
const databaseId = "a7b3e1d1-34d6-432b-bd31-8ec4636916ab";
const accountId = "1aed6fdb33b34b24c2914fcaaf48786b";
const routes = [
  { pattern: "benchmarkregistry.org", custom_domain: true },
  { pattern: "www.benchmarkregistry.org", custom_domain: true },
];

const source = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const production = source.env?.production;
const staging = source.env?.staging;
assert.equal(source.name, "benchmark-registry");
assert.equal(production?.account_id, accountId);
assert.equal(production?.workers_dev, false);
assert.equal(production?.preview_urls, false);
assert.equal(production?.vars?.STAGING_CRAWLER_PROTECTION, undefined);
assert.deepEqual(production?.routes, routes);
assert.deepEqual(production?.assets, {
  binding: "ASSETS",
  not_found_handling: "single-page-application",
  run_worker_first: true,
});
assert.deepEqual(production?.d1_databases, [
  {
    binding: "DB",
    database_name: databaseName,
    database_id: databaseId,
    migrations_dir: "../migrations",
  },
]);
assert.deepEqual(staging?.d1_databases, [
  {
    binding: "DB",
    database_name: "benchmark-registry-staging",
    migrations_dir: "../migrations",
  },
]);
assert.deepEqual(staging?.routes, [
  { pattern: "staging.benchmarkregistry.org", custom_domain: true },
]);

const configs = readdirSync("dist", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join("dist", entry.name, "wrangler.json"))
  .filter(existsSync);
assert.equal(configs.length, 1, "Expected one built Worker configuration");

const deployment = JSON.parse(readFileSync(configs[0], "utf8"));
assert.equal(deployment.name, workerName);
assert.equal(deployment.account_id, accountId);
assert.equal(deployment.workers_dev, false);
assert.equal(deployment.preview_urls, false);
assert.deepEqual(deployment.routes, routes);
assert.equal(deployment.vars?.STAGING_CRAWLER_PROTECTION, undefined);
assert.equal(deployment.assets?.binding, "ASSETS");
assert.equal(deployment.assets?.run_worker_first, true);
assert.equal(deployment.d1_databases?.length, 1);
assert.equal(deployment.d1_databases[0].binding, "DB");
assert.equal(deployment.d1_databases[0].database_name, databaseName);
assert.equal(deployment.d1_databases[0].database_id, databaseId);
assert.notEqual(deployment.d1_databases[0].database_name, staging.d1_databases[0].database_name);
assert.ok(existsSync(join(configs[0], "..", deployment.main)));
assert.ok(existsSync(join(configs[0], "..", deployment.d1_databases[0].migrations_dir)));

stdout.write(`Verified ${workerName}, apex and www, and isolated ${databaseName} binding.\n`);
