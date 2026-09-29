import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stdout } from "node:process";
import { verifyUiBuild } from "./verify-ui-build.mjs";

const workerName = "benchmark-registry-staging";

const hostname = "staging.benchmarkregistry.org";

const source = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const staging = source.env?.staging;
assert.equal(source.name, "benchmark-registry");
assert.equal(source.vars?.STAGING_CRAWLER_PROTECTION, undefined);
assert.equal(source.assets?.run_worker_first, true);
assert.equal(staging?.workers_dev, false);
assert.equal(staging?.preview_urls, false);
assert.deepEqual(staging?.routes, [{ pattern: hostname, custom_domain: true }]);
assert.deepEqual(staging?.vars, { STAGING_CRAWLER_PROTECTION: "enabled", READ_ENVIRONMENT:"staging" });
assert.deepEqual(staging?.assets, {
  binding: "ASSETS",
  not_found_handling: "single-page-application",
  run_worker_first: true,
});
assert.equal(staging?.d1_databases, undefined);

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
assert.deepEqual(deployment.vars, { STAGING_CRAWLER_PROTECTION: "enabled", READ_ENVIRONMENT:"staging" });
assert.equal(deployment.assets?.binding, "ASSETS");
assert.equal(deployment.assets?.run_worker_first, true);
assert.equal(deployment.d1_databases?.length ?? 0,0);
assert.equal(deployment.kv_namespaces.length,1);
assert.equal(deployment.kv_namespaces[0].binding,"READ_STORE");
assert.equal(deployment.kv_namespaces[0].id,source.env.staging.kv_namespaces[0].id);
assert.notEqual(source.env.staging.kv_namespaces[0].id,source.env.production.kv_namespaces[0].id);
assert.ok(existsSync(join(configs[0], "..", deployment.main)));

stdout.write(`Verified ${workerName}, ${hostname}, and isolated KV binding without D1.\n`);
verifyUiBuild(true, join(configs[0], "..", deployment.main));

// Validate the privacy controls in the actual generated deployment config.
assert.deepEqual(deployment.observability, source.env.staging.observability);
assert.equal(deployment.observability.logs.invocation_logs, false);
assert.equal(deployment.observability.logs.persist, false);
assert.equal(deployment.observability.redact_query_string, true);
assert.equal(deployment.observability.traces.enabled, false);
assert.equal(deployment.observability.traces.persist, false);
assert.deepEqual(deployment.observability.logs.destinations, []);
assert.deepEqual(deployment.observability.traces.destinations, []);
