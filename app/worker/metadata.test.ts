import { afterEach, beforeEach, expect, it } from "vitest";
import worker from "./canonical-reference";
import { RegistryRepository } from "./repository";
import { seoFixture } from "./seo-fixtures";
import { CANONICAL_ORIGIN } from "../src/seo-config";
let fixture:ReturnType<typeof seoFixture>;
beforeEach(()=>{fixture=seoFixture();});
afterEach(()=>fixture.sqlite.close());
const page=async(path:string)=>{const response=await worker.fetch(new Request(CANONICAL_ORIGIN+path),fixture.env);return {response,html:await response.text()};};
const title=(html:string)=>/<title>(.*?)<\/title>/u.exec(html)?.[1];
const description=(html:string)=>/<meta name="description" content="([^"]*)">/u.exec(html)?.[1];
it("renders the new metadata templates with real counts in initial HTML",async()=>{
  const {response,html}=await page("/");
  expect(response.status).toBe(200);
  expect(title(html)).toBe("Benchmark Registry: AI Model Benchmark Results in One Place");
  expect(description(html)).toMatch(/primary sources: \d+ models, \d+ benchmarks, \d+ records\. Updated 20/u);
  expect(html).toContain('<div id="root"><');
});
it("uses one aligned metadata set on all page types, including Twitter and the share card",async()=>{
  for(const path of ["/","/models","/benchmarks","/companies","/models/10001","/benchmarks/gpqa","/benchmarks/gpqa/diamond","/companies/openai","/compare","/legal"]) {
    const {response,html}=await page(path);
    expect(response.status,path).toBe(200);
    expect(html.match(/<title>/gu),path).toHaveLength(1);
    expect(html.match(/name="description"/gu),path).toHaveLength(1);
    expect(html.match(/rel="canonical"/gu),path).toHaveLength(1);
    expect(html).toContain(`<meta property="og:title" content="${title(html)}">`);
    expect(html).toContain(`<meta property="og:description" content="${description(html)}">`);
    expect(html).toContain(`property="og:url" content="${CANONICAL_ORIGIN}${path}"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    const card=path==="/models/10001" ? "/og/models/10001.png" : path==="/benchmarks/gpqa" ? "/og/benchmarks/gpqa.png" : "/og/site.png";
    expect(html).toContain('property="og:image" content="'+CANONICAL_ORIGIN+card+'"');
    expect(html).toContain('name="twitter:image" content="'+CANONICAL_ORIGIN+card+'"');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<html lang="en">');
    expect((title(html) ?? "")+(description(html) ?? "")).not.toMatch(/\b(Unspecified|Unknown|undefined|null|default)\b/iu);
  }
});
it("uses persisted data dates independent of release/founding/build time",async()=>{
  const snapshot=await new RegistryRepository(fixture.db).seoSnapshot();
  const company=snapshot.pages["/companies/openai"];
  expect(company.updated).toBeTruthy();
  expect(company.updated).not.toBe("2015-12-11");
  fixture.sqlite.exec("UPDATE companies SET established_at='1900-01-01' WHERE slug='openai'");
  expect((await new RegistryRepository(fixture.db).seoSnapshot()).pages["/companies/openai"].updated).toBe(company.updated);
});
it("escapes text rather than executing markup in head",async()=>{
  fixture.sqlite.prepare("UPDATE models SET canonical_name=? WHERE registry_no='10001'").run(`O'Brien <script>& "TEST"`);
  const {html}=await page("/models/10001");
  expect(title(html)).toContain("O&#39;Brien &lt;script&gt;&amp; &quot;TEST&quot;");
  expect(html).not.toContain("<script>&");
});
it("renders real noindex 404 responses and keeps assets and HEAD working",async()=>{
  const missing=await page("/models/missing");expect(missing.response.status).toBe(404);expect(missing.html).toContain("noindex, follow");
  // A missing page names no canonical or og:url: there is no URL to index.
  expect(missing.html).not.toContain('rel="canonical"');expect(missing.html).not.toContain('property="og:url"');
  const head=await worker.fetch(new Request(CANONICAL_ORIGIN+"/models/10001",{method:"HEAD"}),fixture.env);expect(await head.text()).toBe("");
});
