import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./canonical-reference";
import { RegistryRepository } from "./repository";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("selects the newest records by insertion order, independent of report or evidence date",async()=>{
 const repository=new RegistryRepository(f.db);
 const recent=(await repository.seoSnapshot()).recent;
 const keys=f.sqlite.prepare("SELECT result_key FROM results ORDER BY id DESC LIMIT 100").all() as {result_key:string}[];
 expect(recent.map(record=>record.row.result_key)).toEqual(keys.map(row=>row.result_key));
 expect(recent.length).toBeLessThanOrEqual(100);
});
it("serves an indexable initial document with dated groups, model/benchmark/source anchors and JSON-LD",async()=>{
 const html=await (await worker.fetch(new Request("https://benchmarkregistry.org/recent"),f.env)).text();
 expect(html).toContain("Evidence checked");expect(html).toContain('href="/models/');expect(html).toContain('href="/benchmarks/');
 expect(html.match(/<h1[ >]/gu)).toHaveLength(1);expect(html).not.toContain('name="robots" content="noindex');
 expect(JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u.exec(html)![1])).toBeTruthy();
 const xml=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();expect(xml).toContain("/recent</loc>");
 const home=await (await worker.fetch(new Request("https://benchmarkregistry.org/"),f.env)).text();expect(home).toContain('href="/recent"');
});
