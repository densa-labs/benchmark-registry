// Pre-upload checks for the static deployment in dist/client.
//   node scripts/verify-static-deployment.mjs --environment staging|production
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stdout } from "node:process";
import { parseArgs } from "node:util";
import { verifyUiBuild } from "./verify-ui-build.mjs";

const { values } = parseArgs({ options: { environment: { type: "string" } } });
const environment = values.environment;
assert.ok(["staging", "production"].includes(environment), "Explicit --environment staging|production is required.");
const staging = environment === "staging";
const assets = { directory: "./dist/client", html_handling: "auto-trailing-slash", not_found_handling: "404-page" };

const source = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const target = source.env?.[environment];
assert.equal(source.name, "benchmark-registry");
// No Worker script: every request is a static asset request, so the Worker request quota is never used.
assert.equal(source.main, undefined);
assert.equal(target?.main, undefined);
assert.deepEqual(target?.assets, assets);
for (const binding of ["d1_databases", "kv_namespaces", "vars", "observability"]) assert.equal(target?.[binding], undefined, binding);
assert.equal(target?.workers_dev, false);
assert.equal(target?.preview_urls, false);
assert.deepEqual(target?.routes, staging
  ? [{ pattern: "staging.benchmarkregistry.org", custom_domain: true }]
  : [{ pattern: "benchmarkregistry.org", custom_domain: true }, { pattern: "www.benchmarkregistry.org", custom_domain: true }]);
if (!staging) assert.equal(target.account_id, "1aed6fdb33b34b24c2914fcaaf48786b");

const out = "dist/client";
for (const file of ["index.html", "404.html", "sitemap.xml", "feed.xml", "robots.txt", "_headers", "_redirects", "data/manifest.json", "version.json"]) assert.ok(existsSync(join(out, file)), `Missing ${file}; run scripts/build-static.mjs`);
assert.ok(!readFileSync(join(out, "index.html"), "utf8").includes('<div id="root"></div>'), "Home page was not prerendered");
const robots = readFileSync(join(out, "robots.txt"), "utf8");
const headers = readFileSync(join(out, "_headers"), "utf8");
const sitemap = readFileSync(join(out, "sitemap.xml"), "utf8");
assert.ok(!sitemap.includes("staging."), "Sitemap must list canonical production URLs only");
if (staging) {
  assert.equal(robots, "User-agent: *\nDisallow: /\n");
  assert.match(headers, /\/\*\n {2}X-Robots-Tag: noindex, nofollow, noarchive\n {2}Strict-Transport-Security: /u);
  assert.ok(!headers.includes("cloudflareinsights"), "Staging must not allow the Web Analytics beacon");
} else {
  assert.match(robots, /^User-agent: \*\nAllow: \/\n\nSitemap: https:\/\/benchmarkregistry\.org\/sitemap\.xml\n$/u);
  assert.ok(!headers.includes("nofollow"), "Production must not carry staging crawler headers");
  assert.ok(headers.includes("https://static.cloudflareinsights.com/beacon.min.js"), "Production CSP must allow the Web Analytics beacon");
}
// One security block for every path; scripts are hashed, never 'unsafe-inline'.
for (const name of ["Strict-Transport-Security: max-age=31536000; includeSubDomains", "X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin"]) assert.equal(headers.split(name).length, 2, name);
const csp = /Content-Security-Policy: ([^\n]+)/u.exec(headers)?.[1] ?? "";
assert.match(csp, /script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/u);
for (const directive of ["frame-ancestors 'none'", "base-uri 'none'", "form-action 'self'"]) assert.ok(csp.includes(directive), directive);
assert.ok(!/script-src[^;]*unsafe-inline/u.test(csp), "Scripts must be hashed, not unsafe-inline");
assert.ok(!/x-registry-|server-timing/iu.test(headers), "Diagnostics headers must not be public");
assert.match(headers, /\/assets\/\*\n {2}Cache-Control: public, max-age=31536000, immutable/u);
assert.match(headers, /\/models\/\*\n {2}Cache-Control: public, max-age=300, must-revalidate/u);
assert.match(headers, /\/version\.json\n {2}Cache-Control: no-store\n/u);
const version = JSON.parse(readFileSync(join(out, "version.json"), "utf8"));
assert.match(version.commit, /^[0-9a-f]{40}$/u, "version.json must name the built commit");
assert.equal(version.environment, environment);
for (const key of ["models", "benchmarks", "benchmark_versions", "results"]) assert.ok(Number.isInteger(version.counts[key]) && version.counts[key] > 0, `version.json ${key}`);

let files = 0;
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(join(directory, entry.name));
    else if (!entry.name.startsWith("_")) files++;
  }
};
walk(out);
assert.ok(files < 15_000, `${files} files exceed the static asset budget`);

stdout.write(`Verified assets-only ${environment} deployment: ${files} files, no Worker script or bindings.\n`);
verifyUiBuild(staging);
