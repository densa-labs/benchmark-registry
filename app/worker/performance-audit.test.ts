import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { expect, it } from "vitest";
import worker, { type Env } from "./canonical-reference";
import template from "../index.html?raw";
import { buildGeneration } from './materializer';

// Opt-in, disposable local D1 only. Never requests staging/production.
it.skipIf(!process.env.P119_AUDIT_FIXTURE)("bounded representative local D1 audit", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(process.env.P119_AUDIT_FIXTURE!, "utf8"));
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: "export default {fetch(){return new Response('audit')}}", d1Databases: ["DB"] }));
  try {
    const db = await mf.getD1Database("DB");
    const schema = sqlite.prepare("SELECT type, name, sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type DESC").all() as {type: string; name: string; sql: string}[];
    for (const item of schema.filter((s) => s.type === "table")) await db.prepare(item.sql).run();
    for (const item of schema.filter((s) => s.type === "table")) {
      const rows = sqlite.prepare(`SELECT * FROM "${item.name}"`).all() as Record<string, string | number | null>[];
      for (let start = 0; start < rows.length; start += 100) {
        await db.batch(rows.slice(start, start + 100).map((row) => db.prepare(`INSERT INTO "${item.name}" (${Object.keys(row).map((k) => `"${k}"`).join(",")}) VALUES (${Object.keys(row).map(() => "?").join(",")})`).bind(...Object.values(row))));
      }
    }
    for (const item of schema.filter((s) => s.type !== "table")) await db.prepare(item.sql).run();
    if (process.env.P119_AUDIT_MIGRATION) {
      sqlite.exec(readFileSync(process.env.P119_AUDIT_MIGRATION, "utf8"));
      const statements = JSON.parse(execFileSync("python3", ["-c", "import sqlite3,json,sys; s=''; out=[]\nfor line in open(sys.argv[1]):\n s+=line\n if sqlite3.complete_statement(s): out.append(s); s=''\nprint(json.dumps(out))", process.env.P119_AUDIT_MIGRATION], {encoding: "utf8"})) as string[];
      for (const sql of statements) await db.prepare(sql).run();
    }
    const chosen = sqlite.prepare("SELECT b.slug, bv.version_slug, r.result_key, m.registry_no, c.slug AS company FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE (SELECT count(*) FROM results p WHERE p.model_id=r.model_id AND p.benchmark_version_id=r.benchmark_version_id)=1 ORDER BY r.id LIMIT 1").get() as {slug:string; version_slug:string; result_key:string; registry_no:string; company:string};
    const version = `/benchmarks/${chosen.slug}/${chosen.version_slug}`;
    const counts=sqlite.prepare("SELECT (SELECT count(*) FROM models) AS models,(SELECT count(*) FROM benchmarks) AS benchmarks,(SELECT count(*) FROM benchmark_versions) AS versions,(SELECT count(*) FROM results) AS results").get();
    const routes = ["/", "/models", `/models/${chosen.registry_no}`, "/models/10005", "/benchmarks", `/benchmarks/${chosen.slug}`, version, "/companies", `/companies/${chosen.company}`, `${version}?view=history&result=${chosen.result_key}`, "/api/search?q=gpt", "/models?sort=name&order=asc", "/models?page=2", `${version}?company=${chosen.company}`, `/models/${chosen.registry_no}?q=gpqa`];
    const evidence: unknown[] = [];
    const entries = new Map<string, Response>();
    const cache = {async match(key: Request) {return entries.get(key.url)?.clone();}, async put(key: Request, response: Response) {entries.set(key.url,response.clone());}} as unknown as Cache;
    for (const route of routes) {
      const queries: unknown[] = [];
      let reads = 0, writes = 0;
      const measured = { prepare(sql: string) {
        let bindings: (string|number|null)[] = [];
        return {bind(...values: (string|number|null)[]) {bindings=values; return this;}, async all() {
          const result = await db.prepare(sql).bind(...bindings).all();
          reads += result.meta.rows_read; writes += result.meta.rows_written;
          const plan = sqlite.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...bindings);
          queries.push({class: /\/\* ([^*]+) \*\//u.exec(sql)?.[1], rows_read:result.meta.rows_read, rows_written:result.meta.rows_written, duration_ms:result.meta.duration, plan});
          return result;
        }, async first() {return (await this.all()).results[0] ?? null;}};
      }} as unknown as D1Database;
      const env: Env = {DB:measured, REGISTRY_CACHE:process.env.P119_AUDIT_CACHE ? cache : undefined, ASSETS:{fetch:async () => new Response(template,{headers:{"Content-Type":"text/html"}})} as unknown as Fetcher};
      const start = performance.now();
      const response = await worker.fetch(new Request(`https://benchmarkregistry.org${route}`),env);
      const text = await response.text();
      expect(response.status,route).toBe(200);
      const cold = {route,status:response.status,queries:queries.length,rows_read:reads,rows_written:writes,response_ms:Number((performance.now()-start).toFixed(2)),bytes:new TextEncoder().encode(text).length,query_details:[...queries],cache:response.headers.get("X-Registry-Cache")};
      let warm;
      if (process.env.P119_AUDIT_CACHE) {
        reads=0;writes=0;queries.length=0;
        const warmStart=performance.now();
        const response=await worker.fetch(new Request(`https://benchmarkregistry.org${route}`),env);
        await response.text();
        warm={status:response.status,queries:queries.length,rows_read:reads,rows_written:writes,response_ms:Number((performance.now()-warmStart).toFixed(2)),cache:response.headers.get("X-Registry-Cache")};
        if (!route.includes("q=")) {expect(reads).toBe(0);expect(warm.cache).toBe("hit");}
      }
      evidence.push({...cold,warm});
    }
    let materialization;
    if(process.env.P119_AUDIT_MATERIALIZE) {
      const cost={queries:0,rows_read:0,rows_written:0};
      const trace:{class:string|undefined;rows_read:number;plan:unknown}[]=[];
      const producerDb={prepare(sql:string){let params:(string|number|null)[]=[];return {bind(...values:(string|number|null)[]){params=values;return this;},async all(){const result=await db.prepare(sql).bind(...params).all();cost.queries++;cost.rows_read+=result.meta.rows_read;cost.rows_written+=result.meta.rows_written;trace.push({class:/\/\* ([^*]+) \*\//u.exec(sql)?.[1],rows_read:result.meta.rows_read,plan:sqlite.prepare('EXPLAIN QUERY PLAN '+sql).all(...params)});return result;},async first(){return (await this.all()).results[0]??null;}};}} as unknown as D1Database;
      const reset=()=>{cost.queries=0;cost.rows_read=0;cost.rows_written=0;trace.length=0;};
      const full=(await buildGeneration(producerDb,'local'))!;
      const fullCost={...cost,objects:full.rebuilt.length,bytes:[...full.objects.values()].reduce((sum,value)=>sum+new TextEncoder().encode(value).length,0)};
      const originals=sqlite.prepare('SELECT * FROM results ORDER BY id LIMIT 50').all() as Record<string,string|number|null>[];
      let id=Number((sqlite.prepare('SELECT max(id) AS n FROM results').get() as {n:number}).n);
      const insert=async(row:Record<string,string|number|null>)=>{
        id++;const result_key=(id.toString(16)).padStart(64,'0');
        const next={...row,id,result_key,run_ref:`p119-audit-${id}`,reported_at:'2030-01-01T12:00:00Z',reported_precision:'timestamp'};
        await db.prepare(`INSERT INTO results(${Object.keys(next).join(',')}) VALUES(${Object.keys(next).map(()=>'?').join(',')})`).bind(...Object.values(next)).run();
        await db.prepare('INSERT INTO result_evaluators SELECT ?,evaluator_organization_id FROM result_evaluators WHERE result_id=?').bind(id,row.id).run();
      };
      await insert(originals[0]);reset();
      const small=(await buildGeneration(producerDb,'local',full.manifest))!;
      const smallCost={...cost,objectsRebuilt:small.rebuilt.length,logicalKeys:small.rebuilt,payloadsChanged:small.objects.size,manifestBytes:new TextEncoder().encode(JSON.stringify(small.manifest)).length,query_details:[...trace]};
      const saved=new Map([...full.objects,...small.objects]);
      for(const row of originals) await insert(row);reset();
      const large=(await buildGeneration(producerDb,'local',small.manifest,async(key)=>JSON.parse(saved.get(small.manifest.objects[key])!)))!;
      const largeCost={...cost,newResults:originals.length,objectsRebuilt:large.rebuilt.length,payloadsChanged:large.objects.size,manifestBytes:new TextEncoder().encode(JSON.stringify(large.manifest)).length};
      reset();expect(await buildGeneration(producerDb,'local',large.manifest)).toBeNull();
      materialization={fullCanonicalProjection:fullCost,smallUpdate:smallCost,largeBatch:largeCost,noOp:{...cost,objectsRebuilt:0}};
    }
    writeFileSync(process.env.P119_AUDIT_OUTPUT ?? "/private/tmp/p119-audit.json", JSON.stringify({fixture:counts,runtime:"Miniflare local D1; remote latency excluded",routes:evidence,materialization},null,2));
  } finally {sqlite.close(); await mf.dispose();}
}, 120_000);
