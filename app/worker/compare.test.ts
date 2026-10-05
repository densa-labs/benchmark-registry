import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import template from "../index.html?raw";
import { handleRequest, type Env } from "./index";
import { MaterializedRepository } from "./materialized-repository";
import type { ReadData } from "./read-model";
import { buildGeneration } from "./materializer";
import { normalizedResource } from "./request-policy";
import type { InitialDocument } from "../src/bootstrap";

describe("materialized comparison documents", () => {
  let sqlite: DatabaseSync;
  let env: Env;
  let repository: MaterializedRepository;
  let forbiddenDb: { prepare: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    sqlite = new DatabaseSync(":memory:");
    const directory = new URL("../../migrations/", import.meta.url);
    for (const name of readdirSync(directory).filter(name => name.endsWith(".sql")).sort()) sqlite.exec(readFileSync(new URL(name, directory), "utf8"));
    sqlite.exec(readFileSync(new URL("./fixtures/p4-read-producer.sql", import.meta.url), "utf8"));
    const db = { prepare(sql: string) {
      let bindings: (string | number | null)[] = [];
      return {
        bind(...values: (string | number | null)[]) { bindings = values; return this; },
        async all() { return { results: sqlite.prepare(sql).all(...bindings) }; },
        async first() { return (await this.all()).results[0] ?? null; },
      };
    } } as unknown as D1Database;
    const generation = await buildGeneration(db, "local");
    repository = new MaterializedRepository(generation.manifest, async <K extends keyof ReadData>(key: string) => (JSON.parse(generation.objects.get(generation.manifest.objects[key])!) as { data: ReadData[K] }).data);
    forbiddenDb = { prepare: vi.fn(() => { throw new Error("Page renders must not query D1"); }) };
    env = {
      DB: forbiddenDb,
      ASSETS: { fetch: async () => new Response(template, { headers: { "Content-Type": "text/html" } }) } as unknown as Fetcher,
    } as unknown as Env;
  });
  afterEach(() => sqlite.close());
  async function page(path: string, method = "GET") {
    const response = await handleRequest(new Request("https://benchmarkregistry.org" + path, { method }), env, repository);
    const html = await response.text();
    const serialized = /<script id="registry-initial-document" type="application\/json">([\s\S]*?)<\/script>/u.exec(html)?.[1];
    return { response, html, initial: serialized ? JSON.parse(serialized) as InitialDocument : undefined };
  }

  it("serves the clean index with selectors and crawlable navigation, using zero public D1 reads", async () => {
    const { response, html, initial } = await page("/compare");
    expect(response.status).toBe(200);
    expect(initial?.loaded.kind).toBe("compare");
    expect(html).toContain("Choose two models to compare");
    expect(html).toContain('<title>Compare AI Model Benchmark Results | Benchmark Registry</title>');
    expect(html).toContain('href="/compare" aria-current="page"');
    expect(html).not.toContain('name="robots" content="noindex');
    expect(forbiddenDb.prepare).not.toHaveBeenCalled();
  });

  it("renders saved selections in initial HTML with source details and a clean builder canonical", async () => {
    const { response, html, initial } = await page("/compare?models=10001,20002");
    expect(response.status).toBe(200);
    expect(html).toContain("GPT-4.5 Preview vs Claude Opus 4");
    expect(html).toContain("Shared benchmarks");
    expect(html).toContain("Evaluator sets differ.");
    expect(html).toContain('name="robots" content="noindex, follow"');
    expect(html).toContain('rel="canonical" href="https://benchmarkregistry.org/compare"');
    expect(initial?.loaded).toMatchObject({ kind: "compare", payload: { selected: [expect.objectContaining({ data: expect.objectContaining({ model: expect.objectContaining({ registry_no: "10001" }) }) }), expect.objectContaining({ data: expect.objectContaining({ model: expect.objectContaining({ registry_no: "20002" }) }) })] } });
    expect(forbiddenDb.prepare).not.toHaveBeenCalled();
  });

  it("supports native form parameters, unknown models, invalid selection recovery, and HEAD", async () => {
    const native = await page("/compare?model_a=10001&model_b=20002");
    expect(native.response.status).toBe(200);
    expect(native.html).toContain("Shared benchmarks");
    const missing = await page("/compare?models=99999,20002");
    expect(missing.response.status).toBe(200);
    expect(missing.html).toContain("99999) was not found");
    expect(missing.html).toContain("Claude Opus 4");
    const invalid = await page("/compare?models=10001,20002,30001");
    expect(invalid.response.status).toBe(200);
    expect(invalid.html).toContain("Choose up to two models");
    expect(invalid.html).toContain("Reset comparison");
    const head = await page("/compare?models=10001,20002", "HEAD");
    expect(head.response.status).toBe(200);
    expect(head.html).toBe("");
  });

  it("redirects trailing slashes while retaining selection and keeps the public API strict", async () => {
    const redirect = await page("/compare/?models=10001,20002&reasoning=,extended");
    expect(redirect.response.status).toBe(308);
    expect(redirect.response.headers.get("Location")).toBe("https://benchmarkregistry.org/compare?models=10001,20002&reasoning=,extended");
    const api = await handleRequest(new Request("https://benchmarkregistry.org/api/models?models=10001,20002"), env, repository);
    expect(api.status).toBe(400);
    expect(await api.json()).toMatchObject({ error: { code: "unsupported_parameter" } });
  });

  it("keys cached documents by both models and reasoning without caching searches", () => {
    const key = (query: string) => normalizedResource(new Request("https://benchmarkregistry.org/compare" + query));
    expect(key("?models=10001,20002&reasoning=high,max")).toBe(key("?reasoning=high,max&models=10001,20002"));
    expect(key("?models=10001,20002&reasoning=high,max")).not.toBe(key("?models=10001,20002&reasoning=max,high"));
    expect(key("?models=10001,20002&q=GPQA")).toBeNull();
  });
});
