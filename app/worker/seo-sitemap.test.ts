import { afterEach, beforeEach, expect, it } from "vitest";
import worker from "./canonical-reference";
import { seoFixture } from "./seo-fixtures";
import { RegistryRepository } from "./repository";
import { isIndexablePage } from "../src/seo";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("advertises only indexable canonical 200 URLs and their real data dates",async()=>{
 const snapshot=await new RegistryRepository(f.db).seoSnapshot();
 const xml=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();
 const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/gu)].map(match=>match[1]);
 expect(new Set(locations).size).toBe(locations.length);expect(xml).toContain("<lastmod>");
 for(const url of locations) {
  expect(url).toMatch(/^https:\/\/benchmarkregistry.org\//u);expect(url).not.toContain("?");
  const response=await worker.fetch(new Request(url),f.env);expect(response.status,url).toBe(200);
  const html=await response.text();expect(html).not.toContain('name="robots" content="noindex');
  expect(html).toContain(`rel="canonical" href="${url}"`);
 }
 for(const [path,page] of Object.entries(snapshot.pages)) if(!isIndexablePage(page)) expect(locations).not.toContain("https://benchmarkregistry.org"+path);
});
it("allows crawling assets and query pages so crawlers can see their noindex",async()=>{
 const robots=await (await worker.fetch(new Request("https://benchmarkregistry.org/robots.txt"),f.env)).text();
 expect(robots).toBe("User-agent: *\nAllow: /\n\nSitemap: https://benchmarkregistry.org/sitemap.xml\n");
 const staging=await worker.fetch(new Request("https://staging.benchmarkregistry.org/robots.txt"),{...f.env,STAGING_CRAWLER_PROTECTION:"enabled"});
 expect(await staging.text()).toBe("User-agent: *\nDisallow: /\n");
});
