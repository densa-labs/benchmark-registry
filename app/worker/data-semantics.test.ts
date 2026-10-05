import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { RegistryRepository } from "./repository";
import type { ParsedListParams } from "./params";

// Real migrations and the P4 fixture: the read path labels results with the
// normalized effort while reasoning_level stays the provider's raw label.
const databases: DatabaseSync[] = [];
afterEach(() => databases.splice(0).forEach((db) => db.close()));
const params: ParsedListParams = { page: 1, limit: 500, view: "history" };

function semanticsFixture() {
  const sqlite = new DatabaseSync(":memory:");
  databases.push(sqlite);
  const directory = new URL("../../migrations/", import.meta.url);
  for (const name of readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(new URL(name, directory), "utf8"));
  }
  sqlite.exec(readFileSync(new URL("./fixtures/p4-read-producer.sql", import.meta.url), "utf8"));
  const db = {
    prepare(sql: string) {
      let bound: (string | number | null)[] = [];
      return {
        bind(...values: (string | number | null)[]) { bound = values; return this; },
        async all() { return { results: sqlite.prepare(sql).all(...bound), meta: { rows_read: 0, rows_written: 0 } }; },
        async first() { return (await this.all()).results[0] ?? null; },
      };
    },
  } as unknown as D1Database;
  return { sqlite, repository: new RegistryRepository(db) };
}

it("adds the normalized effort beside the unchanged raw label", async () => {
  const { sqlite, repository } = semanticsFixture();
  const { registry_no } = sqlite.prepare("SELECT registry_no FROM models WHERE id = 5").get() as { registry_no: string };
  const response = await repository.model(registry_no, params);
  const labels = new Map(response.data.results.map((row) => [row.reasoning_level, row.effort]));
  expect(labels.get("low (no tools)")).toBe("low");
  expect(labels.get("high (with tools)")).toBe("high");
  expect(labels.get("medium")).toBe("medium");
});
