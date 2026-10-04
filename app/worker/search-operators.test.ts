import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import { RegistryRepository } from "./repository";
import worker from "./canonical-reference";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("filters recorded results with every requested operator and combines them",async()=>{
  const repository=new RegistryRepository(f.db);
  const rows=await repository.materializedSearchRelationships();const row=rows[0];
  const entities=await repository.materializedSearchEntities();const model=entities.find(model=>model.entity_type==="model" && model.id===row.model_id)!;
  for(const query of [`record:${row.result_key.slice(0,12)}`,`metric:${row.metric_key}`,`date:${row.reported_at!.slice(0,7)}`,`org:${row.provider_slug}`,`model:${model.canonical_name.split(" ")[0]}`,`brand:${row.provider_slug}`,"benchmark:gpqa"]){
    const result=await repository.search({q:query,page:1,limit:50});expect(result.page.total_items,query).toBeGreaterThan(0);
  }
  const result=await repository.search({q:"model:gpt benchmark:gpqa",page:1,limit:50});expect(result.page.total_items).toBeGreaterThan(0);
  expect(result.data.every(hit=>hit.href.includes("/gpqa/"))).toBe(true);
});
it("treats brand: as an alias of org:, so brand:<company> finds that company's results",async()=>{
  const repository=new RegistryRepository(f.db);
  const row=(await repository.materializedSearchRelationships())[0];
  for(const value of [row.provider_slug!,row.provider_name!]) {
    const brand=await repository.search({q:`brand:"${value}"`,page:1,limit:500}),org=await repository.search({q:`org:"${value}"`,page:1,limit:500});
    expect(brand.page.total_items,value).toBeGreaterThan(0);
    expect(brand.data.map(hit=>hit.href)).toEqual(org.data.map(hit=>hit.href));
  }
  // A model-name brand is not a company, so it no longer matches.
  const model=(await repository.materializedSearchEntities()).find(entity=>entity.entity_type==="model" && entity.id===row.model_id)!;
  expect(model.canonical_name.toLowerCase()).not.toContain(row.provider_slug!.toLowerCase());
  expect((await repository.search({q:`brand:${model.canonical_name.split(" ")[0]}`,page:1,limit:50})).page.total_items).toBe(0);
});
it("orders operator results by reported date, newest first, then model name, never by result_key",async()=>{
  const repository=new RegistryRepository(f.db);
  const rows=await repository.materializedSearchRelationships();
  const entities=await repository.materializedSearchEntities();
  const result=await repository.search({q:`org:${rows[0].provider_slug}`,page:1,limit:500});
  expect(result.data.length).toBeGreaterThan(1);
  const dates=result.data.map(hit=>/\b(\d{4}-\d{2}-\d{2})\b/u.exec(hit.matched_text)![1]);
  expect(dates).toEqual([...dates].sort().reverse());
  const names=new Map(entities.filter(entity=>entity.entity_type==="model").map(entity=>[entity.canonical_name,entity]));
  for(let index=1;index<result.data.length;index++) if(dates[index]===dates[index-1]) {
    const model=(hit:{canonical_name:string})=>[...names.keys()].filter(name=>hit.canonical_name.startsWith(name+" × ")).sort((a,b)=>b.length-a.length)[0];
    expect(model(result.data[index-1]).toLowerCase().localeCompare(model(result.data[index]).toLowerCase(),"en")).toBeLessThanOrEqual(0);
  }
  const keys=result.data.map(hit=>/result=([a-f0-9]{64})/u.exec(hit.href)![1]);
  expect(keys).not.toEqual([...keys].sort());
});
it("renders no-JS search results and the operator hint without indexing query pages",async()=>{
  const response=await worker.fetch(new Request("https://benchmarkregistry.org/search?q=model%3Agpt"),f.env);
  expect(response.status).toBe(200);const html=await response.text();expect(html).toContain("Search results");expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('action="/search" method="get"');
  const sitemap=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();expect(sitemap).not.toContain("/search</loc>");
});
