import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stdout } from "node:process";

const workerName = "benchmark-registry-staging";
const databaseName = "benchmark-registry-staging";
const hostname = "staging.benchmarkregistry.org";

const source = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const staging = source.env?.staging;
assert.equal(source.name, "benchmark-registry");
assert.equal(source.vars?.STAGING_CRAWLER_PROTECTION, undefined);
assert.deepEqual(source.assets?.run_worker_first, ["/api/*", "/models/*"]);
assert.equal(staging?.workers_dev, false);
assert.equal(staging?.preview_urls, false);
assert.deepEqual(staging?.routes, [{ pattern: hostname, custom_domain: true }]);
assert.deepEqual(staging?.vars, { STAGING_CRAWLER_PROTECTION: "enabled" });
assert.deepEqual(staging?.assets, {
  binding: "ASSETS",
  not_found_handling: "single-page-application",
  run_worker_first: true,
});
assert.deepEqual(staging?.d1_databases, [
  { binding: "DB", database_name: databaseName, migrations_dir: "../migrations" },
]);

const configs = readdirSync("dist", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join("dist", entry.name, "wrangler.json"))
  .filter(existsSync);
assert.equal(configs.length, 1, "Expected one built Worker configuration");

const deployment = JSON.parse(readFileSync(configs[0], "utf8"));
assert.equal(deployment.name, workerName);
assert.equal(deployment.workers_dev, false);
assert.equal(deployment.preview_urls, false);
assert.deepEqual(deployment.routes, [{ pattern: hostname, custom_domain: true }]);
assert.deepEqual(deployment.vars, { STAGING_CRAWLER_PROTECTION: "enabled" });
assert.equal(deployment.assets?.binding, "ASSETS");
assert.equal(deployment.assets?.run_worker_first, true);
assert.equal(deployment.d1_databases?.length, 1);
assert.equal(deployment.d1_databases[0].binding, "DB");
assert.equal(deployment.d1_databases[0].database_name, databaseName);
assert.notEqual(deployment.d1_databases[0].database_id, source.d1_databases[0].database_id);
assert.ok(existsSync(join(configs[0], "..", deployment.main)));
assert.ok(existsSync(join(configs[0], "..", deployment.d1_databases[0].migrations_dir)));

stdout.write(`Verified ${workerName}, ${hostname}, and isolated ${databaseName} binding.\n`);
