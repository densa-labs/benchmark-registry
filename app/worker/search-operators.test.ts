import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import { RegistryRepository } from "./repository";
import worker from "./canonical-reference";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("filters recorded results with every requested operator and combines them",async()=>{
  const repository=new RegistryRepository(f.db);
  const rows=await repository.materializedSearchRelationships();const row=rows[0];
  const entities=await repository.materializedSearchEntities();const model=entities.find(model=>model.entity_type==="model" && model.id===row.model_id)!;
  for(const query of [`record:${row.result_key.slice(0,12)}`,`metric:${row.metric_key}`,`date:${row.reported_at!.slice(0,7)}`,`org:${row.provider_slug}`,`model:${model.canonical_name.split(" ")[0]}`,`brand:${model.canonical_name.split(" ")[0]}`,"benchmark:gpqa"]){
    const result=await repository.search({q:query,page:1,limit:50});expect(result.page.total_items,query).toBeGreaterThan(0);
  }
  const result=await repository.search({q:"model:gpt benchmark:gpqa",page:1,limit:50});expect(result.page.total_items).toBeGreaterThan(0);
  expect(result.data.every(hit=>hit.href.includes("/gpqa/"))).toBe(true);
});
it("renders no-JS search results and the operator hint without indexing query pages",async()=>{
  const response=await worker.fetch(new Request("https://benchmarkregistry.org/search?q=model%3Agpt"),f.env);
  expect(response.status).toBe(200);const html=await response.text();expect(html).toContain("Search results");expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('action="/search" method="get"');
  const sitemap=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();expect(sitemap).not.toContain("/search</loc>");
});
