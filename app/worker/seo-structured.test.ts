import { afterEach, beforeEach, expect, it } from "vitest";
import worker from "./canonical-reference";
import { seoFixture } from "./seo-fixtures";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it.each(["/","/models","/benchmarks","/companies","/models/10001","/benchmarks/gpqa","/benchmarks/gpqa/diamond","/companies/openai","/compare","/legal","/privacy","/terms","/missing"])("renders valid JSON-LD for %s",async path=>{
 const html=await (await worker.fetch(new Request("https://benchmarkregistry.org"+path),f.env)).text();
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)];expect(scripts).toHaveLength(1);
 const schema=JSON.parse(scripts[0][1]);expect(schema["@context"]).toBe("https://schema.org");
 const graph=schema["@graph"] as Array<Record<string,unknown>>;
 expect(graph.some(item=>item["@type"]===(path==="/" ? "Organization" : "BreadcrumbList"))).toBe(true);
 if(path!=="/") expect(html).toContain('aria-label="Breadcrumb"');
 if(path.startsWith("/models/") || path.startsWith("/benchmarks/")) {
  const dataset=graph.find(item=>item["@type"]==="Dataset")!;
  expect(dataset.dateModified).toMatch(/^20/u);expect(dataset.citation).toBeInstanceOf(Array);
  expect(dataset.description).toBeTruthy();expect(dataset.datePublished).toBeUndefined();
 }
 expect(scripts[0][1]).not.toContain("www.benchmarkregistry.org");
});
it("serializes malicious entity names as inert JSON",async()=>{
 f.sqlite.prepare("UPDATE models SET canonical_name=? WHERE registry_no='10001'").run("X </script><script>alert(1)</script>");
 const html=await (await worker.fetch(new Request("https://benchmarkregistry.org/models/10001"),f.env)).text();
 expect(html).toContain("\\u003c/script>");expect(html).not.toContain("<script>alert(1)");
});
