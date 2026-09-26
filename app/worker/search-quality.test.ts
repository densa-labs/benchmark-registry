import seed from "../../data/batches/p4-seed.json";
import launch from "../../data/batches/launch-dataset.json";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RegistryRepository } from "./repository";
import { normalizeSearch, parseParameters } from "./params";
import { asD1Database, seedSearchFixtures } from "./search-test-fixtures";
import { lookupTokens } from "./search";

type RecordEntry = { operation: string; record: {
  name: string; slug: string; canonical_name: string; registry_no: string;
  aliases: { name: string }[];
  versions: { version: string; version_slug: string }[];
  model_registry_no: string; benchmark_slug: string; benchmark_version: string;
  reasoning_level: string; metric_key: string; run_ref?: string; reported_at: string;
  sources: { primary?: boolean; url: string }[];
} };
const records = [...seed.records, ...launch.records] as unknown as RecordEntry[];

// Search fixtures are projections of tracked Registry data, not invented names,
// aliases, versions, or relationships. Scores/provenance are not searched.
async function seedRealNames(db: DatabaseSync) {
  seedSearchFixtures(db);
  db.exec("DELETE FROM model_aliases; DELETE FROM models; DELETE FROM benchmark_aliases; DELETE FROM benchmarks; DELETE FROM companies;");
  const companies = new Set<string>();
  const models = new Map<string, number>();
  const benchmarks = new Map<string, number>();
  const versions = new Map<string, number>();
  let companyId = 1;
  let aliasId = 1;
  let versionId = 1;
  for (const { operation, record: r } of [...records.filter((r) => r.operation !== "result"), ...records.filter((r) => r.operation === "result")]) {
    if (operation === "company" && !companies.has(r.slug)) {
      companies.add(r.slug);
      db.prepare("INSERT INTO companies VALUES (?, ?, ?, ?)").run(companyId++, r.name, normalizeSearch(r.name), r.slug);
    }
    if (operation === "model" && !models.has(r.registry_no)) {
      const id = models.size + 1;
      models.set(r.registry_no, id);
      db.prepare("INSERT INTO models VALUES (?, ?, ?, ?)").run(id, r.canonical_name, normalizeSearch(r.canonical_name), r.registry_no);
      for (const alias of r.aliases) db.prepare("INSERT INTO model_aliases VALUES (?, ?, ?, ?)").run(aliasId++, id, alias.name, normalizeSearch(alias.name));
    }
    if (operation === "benchmark") {
      const id = benchmarks.get(r.slug) ?? benchmarks.size + 1;
      if (!benchmarks.has(r.slug)) {
        benchmarks.set(r.slug, id);
        db.prepare("INSERT INTO benchmarks VALUES (?, ?, ?, ?)").run(id, r.canonical_name, normalizeSearch(r.canonical_name), r.slug);
        for (const alias of r.aliases) db.prepare("INSERT INTO benchmark_aliases VALUES (?, ?, ?, ?)").run(aliasId++, id, alias.name, normalizeSearch(alias.name));
      }
      for (const v of r.versions) {
        if (versions.has(`${r.slug}:${v.version}`)) continue;
        versions.set(`${r.slug}:${v.version}`, versionId);
        db.prepare("INSERT INTO benchmark_versions VALUES (?, ?, ?, ?)").run(versionId++, id, v.version, v.version_slug);
      }
    }
    if (operation === "result") {
      const primary = r.sources.find((s) => s.primary)!;
      const identity = ["v1", r.model_registry_no, r.reasoning_level, r.benchmark_slug, r.benchmark_version, r.metric_key, r.run_ref ?? `source:${primary.url}#${r.reported_at}`].join("\0");
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
      const key = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      db.prepare("INSERT INTO results VALUES (?, ?, ?, ?)").run(models.get(r.model_registry_no), versions.get(`${r.benchmark_slug}:${r.benchmark_version}`), r.reasoning_level, key);
    }
  }
}

describe("P11.4 search quality against tracked Registry data", () => {
  let db: DatabaseSync;
  let repository: RegistryRepository;
  beforeEach(async () => { db = new DatabaseSync(":memory:"); await seedRealNames(db); repository = new RegistryRepository(asD1Database(db)); });
  afterEach(() => db.close());
  const search = (q: string, page = 1) => repository.search(parseParameters(new URLSearchParams({ q, page: String(page) }), { allowed: ["q", "page"], requireQuery: true }));

  it.each([
    ["openai", "/companies/openai"], ["open ai", "/companies/openai"], ["OpenAI", "/companies/openai"],
    ["  OPEN   AI  ", "/companies/openai"], ["z.ai", "/companies/z-ai"], ["z ai", "/companies/z-ai"], ["zai", "/companies/z-ai"],
    ["deepseek", "/companies/deepseek"], ["deep seek", "/companies/deepseek"],
    ["x ai", "/companies/spacexai"], ["xai", "/companies/spacexai"],
    ["opneai", "/companies/openai"], ["antropic", "/companies/anthropic"],
    ["6 sol", "/models/10014"], ["gpt 6 sol", "/models/10014"], ["GPT-6 Sol", "/models/10014"], ["gpt-6-sol", "/models/10014"],
    ["opus 5.5", "/models/20015"], ["cursor bench", "/benchmarks/cursorbench"],
    ["HLE", "/benchmarks/humanitys-last-exam"], ["MMMU", "/benchmarks/mmmu"],
    ["Massive Multi-discipline Multimodal Understanding", "/benchmarks/mmmu"],
    ["AI2D TEST", "/benchmarks/ai2d/test"],
    ["CursorBench 4", "/benchmarks/cursorbench/4-0"], ["DeepSWE 1.1", "/benchmarks/deep-swe/1.1"],
  ])("recognizes %s", async (q, href) => {
    const response = await search(q);
    expect(response.data[0]?.href).toBe(href);
    expect(response.direct_href).toBeUndefined();
  });

  it("finds gemni through a single typo without a redirect", async () => {
    const response = await search("gemni");
    expect(response.data.some((hit) => hit.canonical_name.startsWith("Gemini"))).toBe(true);
    expect(response.direct_href).toBeUndefined();
  });
  it.each(["cursorbench 4 opus 5.5", "opus 5.5 cursorbench 4", "cursorbench 4 claude opus 5.5", "Claude Opus 5.5 CursorBench 4.0"])("preserves the two reasoning results for %s", async (q) => {
    const response = await search(q);
    const results = response.data.filter((hit) => hit.entity_type === "result");
    expect(results).toHaveLength(2);
    expect(results.every((hit) => hit.href.startsWith("/benchmarks/cursorbench/4-0?view=history&result="))).toBe(true);
    expect(results.map((hit) => hit.matched_text).sort()).toEqual(["Reasoning: max", "Reasoning: medium"]);
    expect(response.data[0].entity_type).toBe("result");
    expect(response.direct_href).toBeUndefined();
  });
  it("is independent of word order", async () => {
    expect((await search("opus 5.5 cursorbench 4")).data).toEqual((await search("cursorbench 4 opus 5.5")).data);
  });
  it.each(["6 sol cursorbench", "cursorbench 6 sol"])("keeps known entities when no relationship exists: %s", async (q) => {
    const response = await search(q);
    expect(response.data.map((hit) => hit.href)).toEqual(expect.arrayContaining(["/models/10014", "/benchmarks/cursorbench"]));
    expect(response.data.some((hit) => hit.entity_type === "result")).toBe(false);
    expect(response.direct_href).toBeUndefined();
  });
  it.each(["DeepSWE 1.1 GPT-6 Sol", "6 sol deepswe 1.1", "deepswe 6 sol", "gpt-6-sol DeepSWE"])("directs only a unique exact relationship: %s", async (q) => {
    const response = await search(q);
    expect(response.direct_href).toMatch(/^\/benchmarks\/deep-swe\/1\.1\?view=history&result=[a-f0-9]{64}$/u);
    expect(response.data[0].href).toBe(response.direct_href);
  });
  it.each(["opus", "opus cursorbench", "cursorbench opus 5.5", "opuz 5.5 cursorbench 4", "deepswe gemni", "random qzx", "OSWorld 2.0 GPT-6 Sol", "DeepSWE 1.2 GPT-6 Sol", "Terminal-Bench 2.0 Opus 5.5", "6 sol deepswe please"])("does not redirect ambiguous, unsupported, or fuzzy input: %s", async (q) => {
    expect((await search(q)).direct_href).toBeUndefined();
  });
  it("does not change decimal model/version identities", async () => {
    const response = await search("opus 5");
    expect(response.data[0].href).toBe("/models/20014");
    expect(response.data.some((hit) => hit.href === "/models/20015")).toBe(false);
    expect(lookupTokens("DeepSWE 1.1")).toContain("1.1");
    expect((await search("DeepSWE 1.2")).data.some((hit) => hit.href.endsWith("/1.1"))).toBe(false);
  });
  it("withholds navigation when an exact natural suffix identifies two models", async () => {
    db.prepare("INSERT INTO models VALUES (?, ?, ?, ?)").run(999, "GPT-6 Sol", "gpt-6 sol", "99901");
    expect((await search("6 sol deepswe 1.1")).direct_href).toBeUndefined();
  });
  it("withholds navigation across historical reruns", async () => {
    const existing = db.prepare("SELECT * FROM results WHERE model_id = (SELECT id FROM models WHERE registry_no = '10014') AND benchmark_version_id = (SELECT id FROM benchmark_versions WHERE benchmark_id = (SELECT id FROM benchmarks WHERE slug = 'deep-swe') AND version = '1.1')").get() as { model_id: number; benchmark_version_id: number; reasoning_level: string };
    db.prepare("INSERT INTO results VALUES (?, ?, ?, ?)").run(existing.model_id, existing.benchmark_version_id, existing.reasoning_level, "f".repeat(64));
    expect((await search("6 sol deepswe 1.1")).direct_href).toBeUndefined();
  });
  it("withholds navigation when a benchmark family has several relevant versions", async () => {
    const response = await search("GPT-6 Astra terminal-bench");
    expect(new Set(response.data.filter((hit) => hit.entity_type === "result").map((hit) => hit.canonical_name)).size).toBeGreaterThan(1);
    expect(response.direct_href).toBeUndefined();
  });
  it("keeps weak fuzzy suggestions below strong known matches", async () => {
    const response = await search("gem");
    expect(response.data[0].canonical_name.startsWith("Gem" )).toBe(true);
    expect((await search("qzxzz")).data).toEqual([]);
  });
  it("does not promote the deferred version-like OSWorld alias", async () => {
    const response = await search("OSWorld 2.0");
    expect(response.data[0].href).toBe("/benchmarks/osworld");
    expect(response.direct_href).toBeUndefined();
  });
  it.each([".", "---", "’"])("does not treat punctuation-only %s as a wildcard", async (q) => {
    const response = await search(q);
    expect(response.data).toEqual([]);
    expect(response.direct_href).toBeUndefined();
  });
  it("omits similar acronym typo suggestions when the query is already an exact alias", async () => {
    const response = await search("MMMU");
    expect(response.data.some((hit) => hit.href === "/benchmarks/mmmu")).toBe(true);
    expect(response.data.some((hit) => hit.href === "/benchmarks/mmlu" || hit.href === "/benchmarks/mmlu-pro")).toBe(false);
  });
  it("does not navigate on later search pages", async () => {
    expect((await search("6 sol deepswe 1.1", 2)).direct_href).toBeUndefined();
  });
});
