import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import { RegistryRepository } from "./repository";
import { badgeResponse, renderBadge } from "./badge";
import { accessibilityRoutes } from "../src/accessibility-fixtures";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("serves the latest score for a known pair and rejects unknown pairs",async()=>{
  const repository=new RegistryRepository(f.db);
  const model=(await repository.model("10001",{page:1,limit:500,view:"history"})).data;
  const row=model.results[0];const path=`https://benchmarkregistry.org/badge/10001/${row.benchmark.slug}.svg`;
  const response=await badgeResponse(new Request(path),repository);
  expect(response.status).toBe(200);expect(response.headers.get("Content-Type")).toContain("image/svg+xml");expect(response.headers.get("Cache-Control")).toContain("max-age=60");
  const svg=await response.text();expect(svg).toContain(row.benchmark.name);expect(svg).toContain('<title id="title">');
  expect(await (await badgeResponse(new Request(path,{method:"HEAD"}),repository)).text()).toBe("");
  for(const unknown of ["/badge/99999/gpqa.svg","/badge/10001/missing.svg","/badge/not-an-id/gpqa.svg"]) expect((await badgeResponse(new Request("https://benchmarkregistry.org"+unknown),repository)).status).toBe(404);
});
it("escapes text instead of inserting source content as SVG markup",()=>{
  const loaded=accessibilityRoutes.find(route=>route.loaded.kind==="model")!.loaded;if(loaded.kind!=="model") throw new Error("Fixture");
  const row=loaded.payload.data.results[0];const svg=renderBadge({...row,benchmark:{...row.benchmark,name:"<script>&"}});
  expect(svg).toContain("&lt;script&gt;&amp;");expect(svg).not.toContain("<script>");
});
