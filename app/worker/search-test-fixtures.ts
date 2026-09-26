import { DatabaseSync } from "node:sqlite";

export function asD1Database(database: DatabaseSync): D1Database {
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

export function seedSearchFixtures(database: DatabaseSync) {
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

    CREATE TABLE benchmark_versions (id INTEGER PRIMARY KEY, benchmark_id INTEGER, version TEXT, version_slug TEXT);
    CREATE TABLE results (model_id INTEGER, benchmark_version_id INTEGER, reasoning_level TEXT, result_key TEXT);

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
