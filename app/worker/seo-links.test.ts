import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./canonical-reference";
let f:ReturnType<typeof seoFixture>;beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("makes every sitemap URL reachable within three ordinary anchor clicks",async()=>{
 const origin="https://benchmarkregistry.org";
 const request=async(path:string)=>{const response=await worker.fetch(new Request(origin+path),f.env);return {status:response.status,html:await response.text()};};
 const xml=(await request("/sitemap.xml")).html;
 const targets=[...xml.matchAll(/<loc>(.*?)<\/loc>/gu)].map(match=>match[1].slice(origin.length));
 const seen=new Map<string,number>([["/",0]]);const queue=["/"];
 for(let index=0;index<queue.length;index++) {
  const path=queue[index],depth=seen.get(path)!;if(depth>=3) continue;
  const {status,html}=await request(path);expect(status,path).toBe(200);
  for(const match of html.matchAll(/<a\b[^>]*href="([^"#]+)"/gu)) {
   const url=new URL(match[1].replaceAll("&amp;","&"),origin);
   if(url.origin!==origin || url.search || url.pathname.startsWith("/api/") || seen.has(url.pathname)) continue;
   seen.set(url.pathname,depth+1);queue.push(url.pathname);
  }
 }
 for(const path of targets) expect(seen.get(path),path).toBeLessThanOrEqual(3);
});
