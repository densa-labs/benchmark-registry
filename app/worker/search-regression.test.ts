import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";

import { parseParameters } from "./params";
import { RegistryRepository } from "./repository";

function asD1Database(database: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      const statement = database.prepare(sql);
      let bindings: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          bindings = values;
          return this;
        },
        async first<T>() {
          return (statement.get(...bindings) ?? null) as T | null;
        },
        async all<T>() {
          return {
            success: true,
            results: statement.all(...bindings) as T[],
            meta: {},
          };
        },
      };
    },
  } as unknown as D1Database;
}

function seedSearchFixtures(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE companies (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE models (
      id INTEGER PRIMARY KEY,
      canonical_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      registry_no TEXT NOT NULL UNIQUE
    );
    CREATE TABLE model_aliases (
      id INTEGER PRIMARY KEY,
      model_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE benchmarks (
      id INTEGER PRIMARY KEY,
      canonical_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE benchmark_aliases (
      id INTEGER PRIMARY KEY,
      benchmark_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE
    );

    CREATE INDEX idx_models_normalized_name ON models(normalized_name);
    CREATE INDEX idx_benchmarks_normalized_name ON benchmarks(normalized_name);
    CREATE INDEX idx_companies_normalized_name ON companies(normalized_name);

    INSERT INTO companies VALUES (1, 'OpenAI', 'openai', 'openai');
    INSERT INTO companies VALUES (2, 'Google', 'google', 'google');

    INSERT INTO models VALUES (1, 'GPT-6 Astra', 'gpt-6 astra', '10006');
    INSERT INTO models VALUES (2, 'DeepSWE', 'deepswe', '00001');
    INSERT INTO models VALUES (3, 'Straße Model', 'strasse model', '30001');
    INSERT INTO models VALUES (4, 'HLE Preview', 'hle preview', '20001');
    INSERT INTO models VALUES (5, 'OpenAI o3', 'openai o3', '10003');
    INSERT INTO models VALUES (6, 'Astra', 'astra', '30002');
    INSERT INTO models VALUES (7, 'Astra', 'astra', '30003');

    INSERT INTO model_aliases VALUES (
      1, 1, 'gpt-6-astra-2026', 'gpt-6-astra-2026'
    );
    INSERT INTO model_aliases VALUES (
      2, 3, 'STRASSE MODEL', 'strasse model'
    );

    INSERT INTO benchmarks VALUES (
      1, 'Humanity''s Last Exam', 'humanity''s last exam',
      'humanitys-last-exam'
    );
    INSERT INTO benchmark_aliases VALUES (1, 1, 'HLE', 'hle');
    INSERT INTO benchmarks VALUES (
      2, 'Massive Multi-discipline Multimodal Understanding',
      'massive multi-discipline multimodal understanding', 'mmmu'
    );
    INSERT INTO benchmark_aliases VALUES (2, 2, 'MMMU', 'mmmu');
    INSERT INTO benchmarks VALUES (
      3, 'Massive Multitask Language Understanding',
      'massive multitask language understanding', 'mmlu'
    );
    INSERT INTO benchmark_aliases VALUES (3, 3, 'MMLU', 'mmlu');
    INSERT INTO benchmarks VALUES (
      4, 'Graduate-Level Google-Proof Q&A',
      'graduate-level google-proof q&a', 'gpqa'
    );
    INSERT INTO benchmark_aliases VALUES (4, 4, 'GPQA', 'gpqa');
  `);
}

describe("P8 fixed global search regression suite", () => {
  let database: DatabaseSync;
  let repository: RegistryRepository;

  beforeEach(() => {
    database = new DatabaseSync(":memory:");
    seedSearchFixtures(database);
    repository = new RegistryRepository(asD1Database(database));
  });

  afterEach(() => database.close());

  async function search(query: string) {
    const params = parseParameters(new URLSearchParams({ q: query }), {
      allowed: ["q"],
      requireQuery: true,
    });
    return repository.search(params);
  }

  it.each([
    ["GPT-6 Astra", [["model", "GPT-6 Astra", "/models/10006"]]],
    ["10006", [["model", "GPT-6 Astra", "/models/10006"]]],
    ["OpenAI", [
      ["company", "OpenAI", "/companies/openai"],
      ["model", "OpenAI o3", "/models/10003"],
    ]],
    ["DeepSWE", [["model", "DeepSWE", "/models/00001"]]],
    ["HLE", [
      ["benchmark", "Humanity's Last Exam", "/benchmarks/humanitys-last-exam"],
      ["model", "HLE Preview", "/models/20001"],
    ]],
    ["gpt-6-astra-2026", [["model", "GPT-6 Astra", "/models/10006"]]],
    ["00001", [["model", "DeepSWE", "/models/00001"]]],
  ])("recognizes %s", async (query, expected) => {
    const response = await search(query as string);
    expect(response.data.map((result) => [
      result.entity_type,
      result.canonical_name,
      result.href,
    ])).toEqual(expected);
  });

  it.each([
    ["MMMU", "Massive Multi-discipline Multimodal Understanding", "/benchmarks/mmmu"],
    ["MMLU", "Massive Multitask Language Understanding", "/benchmarks/mmlu"],
    ["GPQA", "Graduate-Level Google-Proof Q&A", "/benchmarks/gpqa"],
  ])("resolves %s and its canonical name to one benchmark family", async (alias, canonical, href) => {
    const byAlias = await search(alias);
    const byCanonical = await search(canonical);
    const aliasResult = byAlias.data.find((result) => result.href === href);
    const canonicalResult = byCanonical.data.find((result) => result.href === href);

    expect(aliasResult).toMatchObject({
      entity_type: "benchmark",
      canonical_name: canonical,
      matched_text: alias,
      aliases: [alias],
      href,
    });
    expect(canonicalResult).toMatchObject({
      entity_type: "benchmark",
      canonical_name: canonical,
      matched_text: canonical,
      aliases: [alias],
      href,
    });
  });

  it("finds the 49 byte MMMU expansion under D1's 50 byte LIKE-pattern limit", async () => {
    database.function("like", { varargs: true }, (pattern) => {
      if (new TextEncoder().encode(pattern).byteLength > 50) {
        throw new Error("LIKE or GLOB pattern too complex");
      }
      return 0;
    });

    const response = await search("Massive Multi-discipline Multimodal Understanding");
    expect(response.data).toMatchObject([{
      canonical_name: "Massive Multi-discipline Multimodal Understanding",
      href: "/benchmarks/mmmu",
    }]);
  });

  it.each(["%", "_", "\\"])("treats %s as literal search text", async (query) => {
    expect((await search(query)).data).toEqual([]);
  });

  it("Unicode-case-folds queries and de-duplicates a canonical-name/alias collision", async () => {
    const response = await search("STRAẞE MODEL");

    expect(response.data).toEqual([{
      entity_type: "model",
      canonical_name: "Straße Model",
      matched_text: "Straße Model",
      href: "/models/30001",
    }]);
  });

  it("orders an exact match before partial matches", async () => {
    const response = await search("Astra");

    expect(response.data.map((result) => `${result.canonical_name}:${result.href}`)).toEqual([
      "Astra:/models/30002",
      "Astra:/models/30003",
      "GPT-6 Astra:/models/10006",
    ]);
  });
});
