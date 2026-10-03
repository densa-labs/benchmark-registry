// Test-only canonical database and asset adapter shared by SEO integration checks.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { asD1Database } from "./search-test-fixtures";
import template from "../index.html?raw";
export function seoFixture() {
  const sqlite = new DatabaseSync(":memory:");
  const migrations = new URL("../../migrations/", import.meta.url);
  for (const file of readdirSync(migrations).filter(file=>file.endsWith(".sql")).sort()) sqlite.exec(readFileSync(new URL(file,migrations),"utf8"));
  sqlite.exec(readFileSync(new URL("./fixtures/p4-read-producer.sql",import.meta.url),"utf8"));
  const db=asD1Database(sqlite);
  const env={DB:db,ASSETS:{fetch:async()=>new Response(template,{headers:{"Content-Type":"text/html; charset=utf-8"}})} as unknown as Fetcher};
  return {sqlite,db,env};
}
