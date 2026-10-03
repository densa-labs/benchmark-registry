import { afterEach, beforeEach, expect, it } from "vitest";
import worker from "./canonical-reference";
import { seoFixture } from "./seo-fixtures";
import { isIndexablePage } from "../src/seo";
import type { SeoPage } from "./seo-data";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
const base:SeoPage={kind:"model",name:"Example",records:3,models:1,benchmarks:1,versions:1,organizations:1,sources:[]};
it("uses one threshold and excludes placeholder versions even with many records",()=>{
 expect(isIndexablePage(base)).toBe(true);expect(isIndexablePage({...base,records:2})).toBe(false);
 expect(isIndexablePage({...base,kind:"benchmark-version",version:"default",records:10})).toBe(false);
 expect(isIndexablePage({...base,kind:"benchmark-version",version:"Unknown"})).toBe(false);
 expect(isIndexablePage({...base,kind:"benchmark-version",version:"Diamond"})).toBe(true);
});
it("leaves a thin model reachable but excludes it and query URLs from the sitemap",async()=>{
 f.sqlite.exec("DELETE FROM result_evaluators WHERE result_id IN (SELECT id FROM results WHERE model_id=(SELECT id FROM models WHERE registry_no='10001')); DELETE FROM result_sources WHERE result_id IN (SELECT id FROM results WHERE model_id=(SELECT id FROM models WHERE registry_no='10001')); DELETE FROM results WHERE model_id=(SELECT id FROM models WHERE registry_no='10001')");
 const response=await worker.fetch(new Request("https://benchmarkregistry.org/models/10001"),f.env);
 expect(response.status).toBe(200);expect(await response.text()).toContain('name="robots" content="noindex, follow"');
 const sitemap=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();
 expect(sitemap).not.toContain("/models/10001</loc>");expect(sitemap).not.toContain("?view=");
});
