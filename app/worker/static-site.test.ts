import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {afterEach,expect,it} from 'vitest';
import template from '../index.html?raw';
import {handleRequest,type Env} from './index';
import {MaterializedRepository} from './materialized-repository';
import type {ReadData} from './read-model';
import {buildStaticSite,CLOUDFLARE_WEB_ANALYTICS_SCRIPT,contentSecurityPolicy,FILE_COUNT_BUDGET,headerRules,HTML_CACHE_CONTROL,IMMUTABLE_CACHE_CONTROL,inlineScriptHashes,pageFile,redirectRules,robotsFile,type SecurityPolicy} from './static-site';
import {createStaticFetch,STATIC_MANIFEST_PATH,type StaticDataManifest} from '../src/static-api';

const databases:DatabaseSync[]=[];
afterEach(()=>{databases.splice(0).forEach(db=>db.close());});
function database() {
  const sqlite=new DatabaseSync(':memory:');databases.push(sqlite);
  const directory=new URL('../../migrations/',import.meta.url);
  for(const name of readdirSync(directory).filter(name=>name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(name,directory),'utf8'));
  sqlite.exec(readFileSync(new URL('./fixtures/p4-read-producer.sql',import.meta.url),'utf8'));
  return {prepare(sql:string){let params:(string|number|null)[]=[];return {bind(...values:(string|number|null)[]){params=values;return this;},async all(){return {results:sqlite.prepare(sql).all(...params),meta:{rows_read:0,rows_written:0}};},async first(){return (await this.all()).results[0] ?? null;}};}} as unknown as D1Database;
}
const files=(site:Awaited<ReturnType<typeof buildStaticSite>>)=>new Map(site.files.map(file=>[file.path,file.body]));

it("maps routes to the files Workers static assets serves without a Worker", () => {
  expect(pageFile("/")).toBe("index.html");
  expect(pageFile("/models")).toBe("models.html");
  expect(pageFile("/models/10006")).toBe("models/10006.html");
  expect(pageFile("/benchmarks/gpqa/diamond")).toBe("benchmarks/gpqa/diamond.html");
  expect(pageFile("/sitemap.xml")).toBe("sitemap.xml");
  expect(pageFile("/badge/10006/gpqa.svg")).toBe("badge/10006/gpqa.svg");
  expect(()=>pageFile("/models/../secrets")).toThrow("Unsafe");
});

it("prerenders every page byte-for-byte as the Worker rendered it, plus data, feeds and routing files", async () => {
  const db=database();
  const site=await buildStaticSite({db,environment:"production",template,legacyRootSlugs:{}});
  const output=files(site);
  for(const path of ["index.html","models.html","benchmarks.html","companies.html","compare.html","recent.html","search.html","coverage.html","about.html","404.html","sitemap.xml","feed.xml","robots.txt","_redirects",STATIC_MANIFEST_PATH.slice(1)]) expect(output.has(path),path).toBe(true);
  expect(output.get("robots.txt")).toBe(robotsFile("production"));
  expect(site.files.length).toBeLessThan(FILE_COUNT_BUDGET);

  const manifest=JSON.parse(output.get("data/manifest.json")!) as StaticDataManifest;
  expect(manifest.generation).toBe(site.generation);
  for(const hash of Object.values(manifest.objects)) expect(output.has(`data/objects/${hash}.json`)).toBe(true);
  expect(manifest.objects.featured).toBeDefined();

  // The same renderer over the same projection produces the same document.
  const objects=new Map(Object.entries(manifest.objects).map(([key,hash])=>[key,JSON.parse(output.get(`data/objects/${hash}.json`)!).data]));
  const repository=new MaterializedRepository({schema:1,environment:"production",generation:site.generation,canonicalRevision:site.generation,watermark:0,createdAt:"",objects:manifest.objects},async <K extends keyof ReadData>(key:string)=>objects.get(key) as ReadData[K]);
  const env={DB:db,REGISTRY_REVISION:site.generation,ASSETS:{fetch:async()=>new Response(template,{headers:{"Content-Type":"text/html"}})}} as unknown as Env;
  const model=[...output.keys()].find(path=>/^models\/\d+\.html$/u.test(path))!;
  for(const path of ["/","/models","/"+model.slice(0,-5),"/sitemap.xml"]) {
    const response=await handleRequest(new Request("https://benchmarkregistry.org"+path),env,repository);
    expect(await response.text(),path).toBe(output.get(pageFile(path)));
  }
  const notFound=output.get("404.html")!;
  expect(notFound).toContain("Page Not Found");
  expect(notFound).toContain('<meta name="robots" content="noindex, follow">');
  expect(notFound).not.toContain('rel="canonical"');
  expect(notFound).not.toContain("__registry_static_not_found__");
});

it("serves the former read API in the browser from static files only", async () => {
  const site=files(await buildStaticSite({db:database(),environment:"production",template,legacyRootSlugs:{}}));
  const requested:string[]=[];
  const network=(async(input:RequestInfo|URL)=>{
    const path=new URL(String(input),"https://registry.invalid").pathname;requested.push(path);
    const body=site.get(path.slice(1));
    return body===undefined ? new Response("missing",{status:404}) : new Response(body,{headers:{"Content-Type":"application/json"}});
  }) as typeof fetch;
  const staticFetch=createStaticFetch(network);
  const models=await (await staticFetch("/api/models?sort=name&order=asc&limit=500")).json() as {data:{registry_no:string;featured_result:unknown}[]};
  expect(models.data.length).toBeGreaterThan(0);
  expect(models.data.every(model=>"featured_result" in model)).toBe(true);
  // A model list is the manifest, the list and the featured results: never one file per model.
  expect(requested.filter(path=>path.startsWith("/data/objects/"))).toHaveLength(2);
  const model=await staticFetch(`/api/models/${models.data[0].registry_no}`);
  expect(model.status).toBe(200);
  expect((await (await staticFetch("/api/search?q=a")).json() as {page:{total_items:number}}).page.total_items).toBeGreaterThan(0);
  const missing=await staticFetch("/api/models/99999");
  expect(missing.status).toBe(404);
  expect((await missing.json() as {error:{code:string}}).error.code).toBe("not_found");
  expect((await staticFetch("/api/models?sort=nope")).status).toBe(400);
  const manifest=JSON.parse(site.get("data/manifest.json")!) as StaticDataManifest;
  expect(await (await staticFetch("/api/revision")).json()).toEqual({revision:manifest.generation});
  expect(requested).not.toContain("/api/models");
  await staticFetch("/models");
  expect(requested.at(-1)).toBe("/models");
});

it("starts the compare page's data requests with its HTML and in parallel", async () => {
  const site=files(await buildStaticSite({db:database(),environment:"production",template,legacyRootSlugs:{}}));
  const manifest=JSON.parse(site.get("data/manifest.json")!) as StaticDataManifest;
  const compare=site.get("compare.html")!;
  for(const href of [STATIC_MANIFEST_PATH,...["models","featured","redirects"].map(key=>`/data/objects/${manifest.objects[key]}.json`)])
    expect(compare).toContain(`<link rel="preload" href="${href}" as="fetch" crossorigin="anonymous">`);
  expect(site.get("models.html")).not.toContain('rel="preload"');

  const requested:string[]=[];
  const network=(async(input:RequestInfo|URL)=>{
    const path=new URL(String(input),"https://registry.invalid").pathname;requested.push(path);
    return new Response(site.get(path.slice(1)) ?? "missing",{status:site.has(path.slice(1)) ? 200 : 404});
  }) as typeof fetch;
  const staticFetch=createStaticFetch(network);
  const model=Object.keys(manifest.objects).find(key=>key.startsWith("model:"))!;
  staticFetch.prefetch!([model,"models","not-a-key"]);
  await new Promise(resolve=>setTimeout(resolve,0));
  await new Promise(resolve=>setTimeout(resolve,0));
  expect(requested).toEqual([STATIC_MANIFEST_PATH,`/data/objects/${manifest.objects[model]}.json`,`/data/objects/${manifest.objects.models}.json`]);
  // A later read reuses the prefetched file.
  expect((await staticFetch(`/api/models/${model.slice(6)}`)).status).toBe(200);
  expect(requested.filter(path=>path===`/data/objects/${manifest.objects[model]}.json`)).toHaveLength(1);
});

const security:SecurityPolicy={scriptHashes:["'sha256-theme'"]};
it("keeps Cache-Control rules disjoint, so values are never appended", () => {
  const rules=headerRules(["index.html","models.html","models/10006.html","assets/index-abc12345.js","data/manifest.json","data/objects/a.json","feed.xml","badge/1/x.svg","robots.txt","_redirects","404.html"],"production",security);
  const blocks=rules.trim().split("\n\n").map(block=>block.split("\n"));
  const patterns=blocks.map(([pattern])=>pattern);
  expect(patterns).toEqual(["/assets/*","/data/objects/*","/data/manifest.json","/badge/*","/feed.xml","/","/models/*","/models","/robots.txt","/*"]);
  for(const block of blocks.slice(0,-1)) expect(block.filter(line=>line.includes("Cache-Control"))).toHaveLength(1);
  expect(rules).toContain(`/assets/*\n  Cache-Control: ${IMMUTABLE_CACHE_CONTROL}`);
  expect(rules).toContain(`/models/*\n  Cache-Control: ${HTML_CACHE_CONTROL}`);
  expect(rules).not.toContain("nofollow");
  const staging=headerRules(["index.html"],"staging",security);
  expect(staging).toContain("/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n");
  expect(staging.trim().split("\n\n").at(-1)).not.toContain("Cache-Control");
  expect(robotsFile("staging")).toBe("User-agent: *\nDisallow: /\n");
  const withVersion=headerRules(["index.html","version.json"],"production",security);
  expect(withVersion).toContain("/version.json\n  Cache-Control: no-store\n  X-Robots-Tag: noindex\n");
  expect(withVersion.split("Cache-Control:").length-1).toBe(5);
});

it("sends one set of security headers on every path, with hashed scripts and no unsafe-inline", () => {
  for(const environment of ["production","staging"] as const) {
    const rules=headerRules(["index.html","models/10006.html","assets/a.js"],environment,security);
    for(const name of ["Strict-Transport-Security","X-Content-Type-Options","Referrer-Policy","Content-Security-Policy"]) expect(rules.split(`${name}:`).length-1,name).toBe(1);
    expect(rules).toContain("  Strict-Transport-Security: max-age=31536000; includeSubDomains\n");
    expect(rules).not.toContain("preload");
    expect(rules).toContain("  X-Content-Type-Options: nosniff\n");
    expect(rules).toContain("  Referrer-Policy: strict-origin-when-cross-origin\n");
  }
  const production=contentSecurityPolicy("production",security);
  expect(production).toBe(`default-src 'self'; script-src 'self' 'sha256-theme' ${CLOUDFLARE_WEB_ANALYTICS_SCRIPT}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
  // Staging stays out of Web Analytics, as before.
  expect(contentSecurityPolicy("staging",security)).not.toContain("cloudflareinsights");
  const configured=contentSecurityPolicy("production",{...security,analyticsScript:"https://stats.example/script.js"});
  expect(configured).toContain("script-src 'self' 'sha256-theme' https://static.cloudflareinsights.com https://stats.example/script.js;");
  expect(configured).toContain("connect-src 'self' https://stats.example;");
  expect(contentSecurityPolicy("staging",{...security,analyticsScript:"https://stats.example/script.js"})).not.toContain("stats.example");
});

it("never serves diagnostics headers: static assets have no Worker to add them", async () => {
  const site=await buildStaticSite({db:database(),environment:"production",template,legacyRootSlugs:{}});
  for(const environment of ["production","staging"] as const) expect(headerRules(site.files.map(file=>file.path),environment,site.security)).not.toMatch(/x-registry-|server-timing/iu);
});

it("hashes only executable inline scripts and refuses a second one", async () => {
  const theme='try { document.documentElement.dataset.theme = "dark"; } catch {}';
  const page=`<script>${theme}</script><script type="application/json">{"a":1}</script><script type="application/ld+json">{}</script><script type="module" src="/assets/a.js"></script>`;
  const expected=Buffer.from(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(theme))).toString("base64");
  expect(await inlineScriptHashes([page,page])).toEqual([`'sha256-${expected}'`]);
  await expect(inlineScriptHashes([page,"<script>alert(1)</script>"])).rejects.toThrow("inline scripts");
});

it("allows exactly the inline scripts the build emitted", async () => {
  const site=await buildStaticSite({db:database(),environment:"production",template,legacyRootSlugs:{}});
  expect(site.security.scriptHashes).toEqual(await inlineScriptHashes([template]));
  expect(site.security.scriptHashes).toHaveLength(1);
});

it("turns per-request Worker redirects into _redirects rules", () => {
  const seo={models:[{registry_no:"10006",name:"GPT-5.3-Codex"},{registry_no:"10099",name:"Old Stealth"},{registry_no:"20001",name:"Models"}]} as unknown as ReadData["seo"];
  const {lines,dynamic}=redirectRules({redirects:[{source:"10099",target:"10006"}],seo},[{family:"gpqa",version:"diamond"}],{"gpt-5-3-codex":"10006"});
  expect(lines).toContain("/models/10099 /models/10006 308");
  expect(lines).toContain("/benchmarks/gpqa/versions/diamond /benchmarks/gpqa/diamond 301");
  expect(lines).toContain("/benchmarks/gpqa/versions/default /benchmarks/gpqa 301");
  expect(lines).toContain("/models/gpt53codex /models/10006 301");
  // Root-level slugs come only from the allow-list, never from every model name.
  expect(lines).toContain("/gpt-5-3-codex /models/10006 301");
  expect(lines).not.toContain("/gpt53codex /models/10006 301");
  expect(lines.filter(line=>/^\/[^/ ]+ /u.test(line))).toEqual(["/gpt-5-3-codex /models/10006 301"]);
  // Retired identities with no equivalent are not sent to a hub: they 404.
  expect(lines.some(line=>line.includes("*"))).toBe(false);
  expect(lines.some(line=>/ \/(models|benchmarks) 30[18]$/u.test(line))).toBe(false);
  expect(lines.some(line=>line.startsWith("/incai-ringflash20"))).toBe(false);
  expect(lines).toContain("/:a/:b/ /:a/:b 308");
  expect(dynamic).toBe(3);
});

it("refuses an allow-listed root slug whose model is not published", () => {
  const seo={models:[{registry_no:"10006",name:"GPT-5.3-Codex"},{registry_no:"10099",name:"Old Stealth"}]} as unknown as ReadData["seo"];
  const data={redirects:[{source:"10099",target:"10006"}],seo};
  expect(()=>redirectRules(data,[],{"old-stealth":"10099"})).toThrow("not a published model");
  expect(()=>redirectRules(data,[],{"missing":"19999"})).toThrow("not a published model");
});

it("keeps the frozen root slug allow-list well formed (the build checks each target)", async () => {
  const {LEGACY_ROOT_SLUGS}=await import("./legacy-root-slugs");
  expect(Object.keys(LEGACY_ROOT_SLUGS)).toHaveLength(189);
  for(const [slug,registryNo] of Object.entries(LEGACY_ROOT_SLUGS)) {
    expect(slug).toMatch(/^[a-z0-9-]+$/u);
    expect(registryNo).toMatch(/^[0-9]+$/u);
  }
});
