import provenance from "../../migrations/0009_result_provenance.sql?raw";
import direction from "../../migrations/0011_metric_direction.sql?raw";
import effort from "../../migrations/0013_effort_vocabulary.sql?raw";
import configurations from "../../migrations/0014_benchmark_configurations.sql?raw";
import scoreSettings from "../../migrations/0021_score_settings.sql?raw";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import schema from "../../migrations/0001_initial.sql?raw";
import namespaces from "../../migrations/0002_seed_namespaces.sql?raw";
import attestations from "../../migrations/0004_provider_attestations.sql?raw";
import units from "../../migrations/0005_standalone_ai_units.sql?raw";
import template from "../index.html?raw";
import worker, { type Env } from "./canonical-reference";
import { asD1Database } from "./search-test-fixtures";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App } from "../src/App";
import type { InitialDocument } from "../src/bootstrap";

const exactKey = "a".repeat(64);
const ambiguousKeys = ["b".repeat(64), "c".repeat(64)];
const versionPath = "/benchmarks/example/4-0";
const exactPath = `${versionPath}?view=history&result=${exactKey}`;
const source = "https://example.com/source";
const checked = "2026-09-01T00:00:00Z";

// Exercise actual repository SQL, migrations, Worker HTML, and client components.
// The fixture includes a route slug differing from its display version, >50
// models, a unique retained result, and two retained reasoning variants.
describe("P11.7 initial document crawlability", () => {
  let db: DatabaseSync;
  let env: Env;
  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec(schema + namespaces + attestations + units + provenance + direction + effort + configurations + scoreSettings);
    db.prepare(`INSERT INTO companies (id, name, normalized_name, slug, source_url, normalized_source_url, source_checked_at)
      VALUES (1, 'Example Company', 'example company', 'example-company', ?, ?, ?)`).run(source, source, checked);
    const namespace = (db.prepare("SELECT id FROM namespaces WHERE prefix = '10'").get() as { id: number }).id;
    db.prepare("INSERT INTO namespace_companies VALUES (?, 1, ?, ?, ?)").run(namespace, source, source, checked);
    for (let number = 1; number <= 52; number++) {
      db.prepare(`INSERT INTO models (id, canonical_name, normalized_name, company_id, namespace_id, sequence, registry_no,
        release_at, release_precision, release_source_url, release_source_normalized_url, source_checked_at, published_at, status)
        VALUES (?, ?, ?, 1, ?, ?, ?, '2026-09-01', 'date', ?, ?, ?, ?, 'active')`)
        .run(number, `Model ${String(number).padStart(2, "0")}`, `model ${String(number).padStart(2, "0")}`,
          namespace, number, `10${String(number).padStart(3, "0")}`, source, source, checked, checked);
    }
    db.prepare(`INSERT INTO benchmarks (id, canonical_name, normalized_name, slug, source_url, normalized_source_url, source_checked_at)
      VALUES (1, 'Example Benchmark', 'example benchmark', 'example', ?, ?, ?)`).run(source, source, checked);
    db.prepare(`INSERT INTO metrics (id, name, key, storage_kind, unit, display_precision, source_url, normalized_source_url, source_checked_at)
      VALUES (1, 'Accuracy', 'accuracy', 'decimal', 'percent', 1, ?, ?, ?)`).run(source, source, checked);
    for (const [id, version, slug] of [[1, "4.0", "4-0"], [2, "1.0", "1.0"]] as const) {
      db.prepare(`INSERT INTO benchmark_versions (id, benchmark_id, version, version_slug, release_at, release_precision,
        metric_id, source_url, normalized_source_url, source_checked_at)
        VALUES (?, 1, ?, ?, '2026-09-01', 'date', 1, ?, ?, ?)`).run(id, version, slug, source, source, checked);
    }
    for (const [model, reasoning, key] of [[1, "", exactKey], [2, "medium", ambiguousKeys[0]], [2, "max", ambiguousKeys[1]]] as const) {
      db.prepare(`INSERT INTO results (model_id, reasoning_level, benchmark_version_id, metric_id, run_ref, result_key,
        score_value, score_raw, reported_at, reported_precision, evaluator_set_key,
        primary_source_url, primary_source_normalized_url, primary_source_checked_at)
        VALUES (?, ?, 1, 1, 'fixture-run', ?, '72.5', '72.5%', '2026-09-01', 'date', ?, ?, ?, ?)`)
        .run(model, reasoning, key, "d".repeat(64), source, source, checked);
    }
    env = { DB: asD1Database(db), ASSETS: { fetch: async () => new Response(template,
      { headers: { "Content-Type": "text/html" } }) } as unknown as Fetcher };
  });
  afterEach(() => db.close());

  async function page(path: string, host = "benchmarkregistry.org") {
    const response = await worker.fetch(new Request(`https://${host}${path}`), env);
    expect(response.status, path).toBe(200);
    expect(response.headers.has("Location"), path).toBe(false);
    return response.text();
  }
  function links(html: string): string[] {
    return [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gu)].map((match) => match[1].replaceAll("&amp;", "&"));
  }

  it.each(["/", "/models", "/models/10001", "/benchmarks", "/benchmarks/example", versionPath,
    "/companies", "/companies/example-company", exactPath, "/models/missing"])(
    "supplies hydration-compatible visible initial HTML for %s", async (path) => {
      const response = await worker.fetch(new Request(`https://benchmarkregistry.org${path}`), env);
      expect(response.status).toBe(path === "/models/missing" ? 404 : 200);
      const html = await response.text();
      const serialized = /<script id="registry-initial-document" type="application\/json">([\s\S]*?)<\/script>/u.exec(html)?.[1];
      expect(serialized).toBeTruthy();
      const initial = JSON.parse(serialized!) as InitialDocument;
      const client = renderToString(createElement(App, { initial }));
      expect(html).toContain(`<div id="root">${client}</div>`);
      expect(client).not.toContain("loading-state");
      expect(client).not.toContain("home-page--loading");
    },
  );

  it("renders every homepage model directory href in initial HTML", async () => {
    const html = await page("/");
    for (let number = 1; number <= 52; number++) {
      expect(links(html)).toContain(`/models/10${String(number).padStart(3, "0")}`);
    }
    expect(links(html)).toEqual(expect.arrayContaining(["/models", "/companies", "/benchmarks"]));
    expect(html).toContain("All Models");
  });

  it("renders model/company/version relationships and approved exact scores in the existing tables", async () => {
    const model = await page("/models/10001");
    expect(links(model)).toEqual(expect.arrayContaining(["/companies/example-company", versionPath, exactPath]));
    expect(model).toContain('class="data-table"');
    const company = await page("/companies/example-company");
    expect(links(company)).toEqual(expect.arrayContaining(["/models/10001", "/models/10002", versionPath, exactPath]));
  });

  it("links every family version by immutable slug and exact display label", async () => {
    const html = await page("/benchmarks/example");
    expect(links(html)).toEqual(expect.arrayContaining([versionPath, "/benchmarks/example/1.0"]));
    expect(html).toContain(">Example Benchmark 4.0</a>");
    expect(html).not.toContain('href="/benchmarks/example/4.0"');
  });

  it("links versions to models/companies/family and exact results to all four parents", async () => {
    const html = await page(versionPath);
    expect(links(html)).toEqual(expect.arrayContaining(["/models/10001", "/companies/example-company", "/benchmarks/example", exactPath]));
    const exact = await page(exactPath);
    expect(links(exact)).toEqual(expect.arrayContaining(["/models/10001", "/companies/example-company", "/benchmarks/example", versionPath]));
  });

  it("links retained records for sharing while keeping ambiguous result documents noindex", async () => {
    for (const path of [versionPath, versionPath + "?view=history", "/models/10002", "/companies/example-company"]) {
      const html = await page(path);
      for (const key of ambiguousKeys) expect(links(html).some((href) => href.includes(`result=${key}`))).toBe(true);
    }
    for (const key of ambiguousKeys) {
      const html = await page(`${versionPath}?view=history&result=${key}`);
      expect(html).toContain('name="robots" content="noindex, follow"');
      expect(html).toContain(`rel="canonical" href="https://benchmarkregistry.org${versionPath}"`);
    }
  });

  it("counts retained historical runs even when Latest shows just one row", async () => {
    db.prepare(`INSERT INTO results (model_id, reasoning_level, benchmark_version_id, metric_id, run_ref, result_key,
      score_value, score_raw, reported_at, reported_precision, evaluator_set_key,
      primary_source_url, primary_source_normalized_url, primary_source_checked_at)
      VALUES (1, '', 1, 1, 'older-run', ?, '70', '70%', '2026-08-01', 'date', ?, ?, ?, ?)`)
      .run("e".repeat(64), "d".repeat(64), source, source, checked);
    const latest = await page("/models/10001");
    expect(latest).toContain("1 result");
    expect(links(latest).some((href) => href.includes("result="))).toBe(true);
    const selected = await page(exactPath);
    expect(selected).toContain('name="robots" content="noindex, follow"');
    expect(await page("/sitemap.xml")).not.toContain(exactKey);
  });

  it("exposes index pagination with real links and retains noindex/base canonicals", async () => {
    const first = await page("/models");
    expect(links(first)).toContain("/models?page=2");
    expect(links(first)).not.toContain("/models/10052");
    const second = await page("/models?page=2");
    expect(links(second)).toContain("/models/10052");
    expect(second).toContain('name="robots" content="noindex, follow"');
    expect(second).toContain('rel="canonical" href="https://benchmarkregistry.org/models"');
  });

  it("serves representative canonical links directly without redirects/404 or alternate origins", async () => {
    for (const path of ["/", "/models", "/benchmarks", "/companies", "/models/10001", "/companies/example-company", "/benchmarks/example", versionPath, exactPath]) {
      const html = await page(path);
      for (const href of links(html)) expect(href).not.toMatch(/staging\.|www\.|workers\.dev/u);
      expect(html).toContain(`rel="canonical" href="https://benchmarkregistry.org${path.split("?")[0].replaceAll("&", "&amp;")}"`);
    }
  });

  it("keeps exact result UI links while excluding all parameterized URLs from the sitemap", async () => {
    const response = await worker.fetch(new Request(`https://benchmarkregistry.org/api${versionPath}?view=history`), env);
    const payload = await response.json() as { data: { results: Array<{ result_key: string; exact_result_href: string | null; benchmark_version_slug: string }> } };
    for (const row of payload.data.results) {
      expect(row.benchmark_version_slug).toBe("4-0");
      expect(row.exact_result_href).toBe(row.result_key === exactKey ? exactPath : null);
    }
    const xml = await page("/sitemap.xml");
    expect(xml).not.toContain(exactKey);
    for (const key of ambiguousKeys) expect(xml).not.toContain(key);
  });

  it("keeps malformed query documents controlled without weakening API validation", async () => {
    const html = await page(versionPath + "?result=invalid&ui=anything");
    expect(html).toContain('name="robots" content="noindex, follow"');
    expect(links(html)).toContain("/models/10001");
    const api = await worker.fetch(new Request(`https://benchmarkregistry.org/api${versionPath}?result=invalid`), env);
    expect(api.status).toBe(400);
  });

  it("shows the benchmark setting a score covers and the family's setting definitions", async () => {
    // The fixture's schema predates the revision table that the setting triggers update.
    db.exec("CREATE TABLE registry_revision (id INTEGER PRIMARY KEY, token TEXT NOT NULL); INSERT INTO registry_revision VALUES (1, 'fixture');");
    db.prepare(`INSERT INTO score_settings (key, benchmark_id, label, definition, source_url, normalized_source_url, source_checked_at)
      VALUES ('example-overall', 1, 'Overall', 'The average of both settings.', ?, ?, ?)`).run(source, source, checked);
    db.prepare(`INSERT INTO result_score_settings (result_id, score_setting_key, source_url, normalized_source_url, source_checked_at)
      SELECT id, 'example-overall', ?, ?, ? FROM results WHERE result_key = ?`).run(source, source, checked, exactKey);
    const response = await worker.fetch(new Request(`https://benchmarkregistry.org/api${versionPath}?view=history`), env);
    const payload = await response.json() as { data: { results: Array<{ result_key: string; score_setting: { key: string; label: string } | null }> } };
    for (const row of payload.data.results) {
      expect(row.score_setting).toEqual(row.result_key === exactKey ? { key: "example-overall", label: "Overall" } : null);
    }
    expect(await page(versionPath)).toContain("Setting: Overall");
    const family = await page("/benchmarks/example");
    expect(family).toContain("Settings</h2>");
    expect(family).toContain("The average of both settings.");
  });

  it("preserves staging protection on the rendered documents", async () => {
    env.STAGING_CRAWLER_PROTECTION = "enabled";
    const response = await worker.fetch(new Request(`https://staging.benchmarkregistry.org${versionPath}`), env);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect(await response.text()).not.toContain("https://staging.");
    expect(await page("/robots.txt", "staging.benchmarkregistry.org")).toBe("User-agent: *\nDisallow: /\n");
  });
});
