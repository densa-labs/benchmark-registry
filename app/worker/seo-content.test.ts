import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./canonical-reference";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it.each(["/models/10001","/benchmarks/gpqa","/companies/openai"])("adds factual content and its hydration data to initial HTML at %s",async path=>{
 const response=await worker.fetch(new Request("https://benchmarkregistry.org"+path),f.env);
 const html=await response.text();expect(response.status).toBe(200);
 expect(html).toMatch(/Updated 20\d\d-\d\d-\d\d\./u);
 expect(html).toContain('"seo":{"sentence":');
 expect(html).toContain('href="/models/');
 expect(html.match(/<h1[ >]/gu)).toHaveLength(1);
 if(path.startsWith("/benchmarks")) {
  expect(html).toContain("Recently reported results");expect(html).toContain('href="/benchmarks/gpqa/diamond"');
  expect(html).toContain('href="https://');expect(html).not.toContain("Leaderboard");
 }
});
