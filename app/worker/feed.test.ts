import { expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { seoFixture } from "./seo-fixtures";
import { RegistryRepository } from "./repository";
import { renderAtomFeed } from "./feed";
import worker from "./canonical-reference";
it("emits parseable Atom with stable IDs, recorded updates, source links and 50-entry limit",async()=>{
  const f=seoFixture();try {
    const snapshot=await new RegistryRepository(f.db).seoSnapshot();
    const records=Array.from({length:60},(_,index)=>({...snapshot.recent[0],row:{...snapshot.recent[0].row,result_key:String(index).padStart(64,"0"),model:{...snapshot.recent[0].row.model,name:"Model <&>"}},checked:`2026-09-${String(index%28+1).padStart(2,"0")}T00:00:00Z`}));
    const xml=renderAtomFeed(records);const document=new JSDOM(xml,{contentType:"application/xml"}).window.document;
    expect(document.documentElement.namespaceURI).toBe("http://www.w3.org/2005/Atom");expect(document.querySelector("parsererror")).toBeNull();
    expect(document.querySelectorAll("entry")).toHaveLength(50);expect(document.querySelector("updated")?.textContent).toBe("2026-09-28T00:00:00.000Z");
    expect(document.querySelector("entry title")?.textContent).toContain("Model <&>");
    expect(document.querySelector("entry summary")?.textContent).toContain('rel="noopener noreferrer"');
    expect(document.querySelector("entry link")?.getAttribute("href")).toContain("?view=history&result=");
    expect(()=>renderAtomFeed([])).toThrow();expect(renderAtomFeed([],"2026-09-17T00:00:00Z")).toContain("<updated>");
  } finally {f.sqlite.close();}
});
it("serves the correct content type, advertises the feed only in the homepage head and excludes it from sitemap",async()=>{
  const f=seoFixture();try {
    const response=await worker.fetch(new Request("https://benchmarkregistry.org/feed.xml"),f.env);
    expect(response.status).toBe(200);expect(response.headers.get("Content-Type")).toContain("application/atom+xml");
    const html=await (await worker.fetch(new Request("https://benchmarkregistry.org/"),f.env)).text();expect(html).toContain('rel="alternate" type="application/atom+xml"');
    const sitemap=await (await worker.fetch(new Request("https://benchmarkregistry.org/sitemap.xml"),f.env)).text();expect(sitemap).not.toMatch(/feed\.xml|healthz/u);
    expect(await (await worker.fetch(new Request("https://benchmarkregistry.org/feed.xml",{method:"HEAD"}),f.env)).text()).toBe("");
  } finally {f.sqlite.close();}
});
