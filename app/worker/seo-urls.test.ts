import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./canonical-reference";
import { CANONICAL_ORIGIN } from "../src/seo-config";
let f:ReturnType<typeof seoFixture>;
beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it.each(["?sort=source&order=asc","?limit=100","?page=2","?q=gpqa","?view=history","?view=history&result="+"a".repeat(64),"?ui=invalid"])("noindexes every query state %s with a clean canonical",async query=>{
 const response=await worker.fetch(new Request(CANONICAL_ORIGIN+"/benchmarks/gpqa/diamond"+query),f.env);
 const html=await response.text();expect(response.status).toBe(200);
 expect(html).toContain('name="robots" content="noindex, follow"');
 expect(html).toContain('rel="canonical" href="'+CANONICAL_ORIGIN+'/benchmarks/gpqa/diamond"');
});
it("canonicalizes selected compare-builder state to the clean builder",async()=>{
 const response=await worker.fetch(new Request(CANONICAL_ORIGIN+"/compare?models=10001,20001"),f.env);
 const html=await response.text();expect(html).toContain('name="robots" content="noindex, follow"');
 expect(html).toContain('rel="canonical" href="'+CANONICAL_ORIGIN+'/compare"');
});
it.each([["/benchmarks/gpqa/versions/diamond","/benchmarks/gpqa/diamond"],["/benchmarks/gpqa/versions/default","/benchmarks/gpqa"]])("301 redirects legacy %s to its equivalent %s",async(path,target)=>{
 const response=await worker.fetch(new Request(CANONICAL_ORIGIN+path+"?q=x"),f.env);
 expect(response.status).toBe(301);expect(response.headers.get("Location")).toBe(CANONICAL_ORIGIN+target+"?q=x");
});
it.each(["/benchmarks/itbench-sre/versions/default","/benchmarks/gpqa/versions/retired","/incai-ringflash20","/not-a-v1-slug"])("returns 404, not a hub redirect, for the retired identity %s",async path=>{
 const response=await worker.fetch(new Request(CANONICAL_ORIGIN+path),f.env);
 expect(response.status).toBe(404);expect(response.headers.get("Location")).toBeNull();
});
