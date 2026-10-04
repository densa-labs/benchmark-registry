import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./canonical-reference";
import { RegistryRepository } from "./repository";
import { generateComparisonPairs } from "../src/comparison-pairs";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
function namePair() {
 const pair=f.sqlite.prepare(`SELECT a.registry_no AS a,b.registry_no AS b FROM models a JOIN models b ON b.company_id=a.company_id AND b.id>a.id
 JOIN results ra ON ra.model_id=a.id JOIN results rb ON rb.model_id=b.id AND rb.benchmark_version_id=ra.benchmark_version_id AND rb.metric_id=ra.metric_id
 JOIN benchmark_versions bv ON bv.id=ra.benchmark_version_id GROUP BY a.id,b.id HAVING count(DISTINCT bv.benchmark_id)>=3 LIMIT 1`).get() as {a:string;b:string};
 expect(pair).toBeTruthy();
 f.sqlite.prepare("UPDATE models SET canonical_name='Fixture 1' WHERE registry_no=?").run(pair.a);
 f.sqlite.prepare("UPDATE models SET canonical_name='Fixture 2' WHERE registry_no=?").run(pair.b);
 return pair;
}
it("creates static comparison pages only for eligible consecutive same-provider family versions",async()=>{
 const pair=namePair();const repo=new RegistryRepository(f.db);const snapshot=await repo.seoSnapshot();
 const generated=snapshot.comparisons.find(row=>row.path==="/compare/fixture-1-vs-fixture-2")!;
 expect(generated.models).toEqual([pair.a,pair.b]);expect(generated.sharedBenchmarks).toBeGreaterThanOrEqual(3);
 const response=await worker.fetch(new Request("https://benchmarkregistry.org"+generated.path),f.env);
 const html=await response.text();expect(response.status).toBe(200);expect(html).not.toContain('name="robots" content="noindex');
 expect(html).toContain("Fixture 1 vs Fixture 2: Benchmark Comparison");expect(html).toContain("Evaluation source");expect(html).toContain("Shared benchmarks");
 expect(JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u.exec(html)![1])["@graph"]).toBeInstanceOf(Array);
 const xml=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();expect(xml).toContain(generated.path);
 for(const no of generated.models) expect(await (await worker.fetch(new Request("https://benchmarkregistry.org/models/"+no),f.env)).text()).toContain(`href="${generated.path}"`);
});
it("requires three shared benchmark families with the same version and metric",async()=>{
 namePair();const repo=new RegistryRepository(f.db);const snapshot=await repo.seoSnapshot();
 const data=await repo.model(snapshot.comparisons.find(row=>row.path==="/compare/fixture-1-vs-fixture-2")!.models[0],{page:1,limit:500,view:"history"});
 expect(generateComparisonPairs(snapshot.models,data.data.results)).toEqual([]);
});
it("does not expose arbitrary comparison slugs",async()=>{
 const response=await worker.fetch(new Request("https://benchmarkregistry.org/compare/arbitrary-vs-missing"),f.env);expect(response.status).toBe(404);
});
