import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stdout } from "node:process";

export function verifyUiBuild(staging, workerPath) {
  const html = readFileSync("dist/client/index.html", "utf8");
  const clientFiles = readdirSync("dist/client/assets").filter((file) => file.endsWith(".js"));
  const client = clientFiles.map((file) => readFileSync(join("dist/client/assets", file), "utf8")).join("\n");
  const worker = readFileSync(workerPath, "utf8");
  const timestamp = /\b\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\b/u.exec(client)?.[0];
  assert.ok(timestamp, "Build timestamp must be injected in client assets");
  assert.ok(worker.includes(timestamp), "Worker and client must share the same build timestamp");
  assert.ok(client.includes("hydrateRoot"), "Initial documents must hydrate");
  assert.ok(worker.includes("registry-initial-document"), "Worker must supply the matching initial document");
  assert.ok(html.includes("registryTheme"), "Stored palette must apply before first paint");
  const icons = [...html.matchAll(/<link\b[^>]*rel="icon"[^>]*>/gu)].map(([tag]) => tag);
  if (staging) {
    assert.ok(html.includes("<title>STAGING | Benchmark Registry</title>"));
    assert.equal(icons.length, 1);
    assert.ok(icons[0].includes("/favicon-staging.svg"));
    const favicon = readFileSync("dist/client/favicon-staging.svg", "utf8");
    assert.ok(favicon.includes("#d13636"));
    assert.ok(!favicon.includes("prefers-color-scheme"));
    assert.ok(client.includes("[Benchmark Registry] STAGING"));
    assert.ok(worker.includes("STAGING | Last update:"));
  } else {
    // Existing Worker staging crawler guards remain; visible identity is stripped.
    for (const text of ["STAGING |", "[Benchmark Registry] STAGING", "favicon-staging.svg", "[Benchmark Registry] route", "[Benchmark Registry] theme", "staging-banner"]) {
      assert.ok(!html.includes(text) && !client.includes(text) && !worker.includes(text), `Production must not contain ${text}`);
    }
    assert.equal(icons.length, 3);
    assert.ok(icons.some((icon) => icon.includes('/favicon-light.svg') && icon.includes('(prefers-color-scheme: light)')));
    assert.ok(icons.some((icon) => icon.includes('/favicon-dark.svg') && icon.includes('(prefers-color-scheme: dark)')));
    for (const file of ["favicon.svg", "favicon-light.svg", "favicon-dark.svg"]) assert.ok(existsSync(join("dist/client", file)));
    assert.ok(!existsSync("dist/client/favicon-staging.svg"));
  }
  stdout.write(`Verified ${staging ? "staging" : "production"} UI identity, favicons, hydration, and build timestamp ${timestamp} UTC.\n`);
}
