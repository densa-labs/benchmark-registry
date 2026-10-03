import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./canonical-reference";
import { RegistryRepository } from "./repository";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("exposes organization updates as persisted data dates and excludes founding dates from snippets",async()=>{
 f.sqlite.exec("UPDATE companies SET established_at='1900-01-01',source_checked_at='2026-10-03T07:00:00Z' WHERE slug='openai'");
 const response=await worker.fetch(new Request("https://benchmarkregistry.org/companies/openai"),f.env);
 const html=await response.text();expect(html).toContain("Updated 2026-10-03.");
 expect(html).toContain("Last updated: 2026-10-03");
 expect(html).toMatch(/<span data-nosnippet="true">January 1, 1900<\/span>/u);
 expect(html).not.toContain("published_time");
 const snapshot=await new RegistryRepository(f.db).seoSnapshot();expect(snapshot.pages["/companies/openai"].updated).toBe("2026-10-03T07:00:00Z");
});
it("advances entity dates when a result citation is checked",async()=>{
 f.sqlite.exec("UPDATE results SET primary_source_checked_at='2026-10-03T08:00:00Z' WHERE model_id=(SELECT id FROM models WHERE registry_no='10001')");
 const snapshot=await new RegistryRepository(f.db).seoSnapshot();
 expect(snapshot.pages["/models/10001"].updated).toBe("2026-10-03T08:00:00Z");
 expect(snapshot.pages["/companies/openai"].updated).toBe("2026-10-03T08:00:00Z");
});
