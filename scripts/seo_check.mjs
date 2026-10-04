#!/usr/bin/env node
/** Build the public Worker locally and crawl its complete sitemap, or --base=http://localhost:PORT.
 * --db=/absolute/path.sqlite uses an explicit read-only Registry database.
 * The default deterministic seed site also runs in CI without credentials or runtime network calls.
 * --serve=PORT leaves the local site available for browser checks after validation.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createServer } from 'node:http';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(join(root,'app/package.json'));
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const {values}=parseArgs({options:{base:{type:'string'},db:{type:'string'},serve:{type:'string'},report:{type:'string'}}});
const temporary=mkdtempSync(join(tmpdir(),'registry-seo-'));
let sqlite;
try {
  const entry=join(temporary,'entry.ts');
  writeFileSync(entry,`export {default as worker} from ${JSON.stringify(join(root,'app/worker/index.ts'))};
export {buildGeneration} from ${JSON.stringify(join(root,'app/worker/materializer.ts'))};
export {RegistryRepository} from ${JSON.stringify(join(root,'app/worker/repository.ts'))};
export {CANONICAL_ORIGIN} from ${JSON.stringify(join(root,'app/src/seo-config.ts'))};
export {isIndexablePage} from ${JSON.stringify(join(root,'app/src/seo.ts'))};`);
  const output=join(temporary,'runtime.mjs');
  await build({entryPoints:[entry],outfile:output,bundle:true,platform:'node',format:'esm',logLevel:'silent',banner:{js:"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);"},define:{__REGISTRY_STAGING__:'false',__REGISTRY_BUILD_ID__:'"seo-check"',__REGISTRY_BUILD_TIMESTAMP__:'"verification build"'}});
  const runtime=await import(pathToFileURL(output).href);
  const origin=runtime.CANONICAL_ORIGIN;
  let localFetch,snapshot;
  if(values.base) {
    const base=new URL(values.base);assert.ok(['localhost','127.0.0.1','[::1]'].includes(base.hostname),'Only local crawl targets are supported.');
    localFetch=path=>fetch(new URL(path,base),{redirect:'manual'});
  } else {
    sqlite=new DatabaseSync(values.db ? resolve(values.db) : ':memory:',values.db ? {readOnly:true} : {});
    if(!values.db) {
      const directory=join(root,'migrations');
      for(const file of readdirSync(directory).filter(file=>file.endsWith('.sql')).sort()) sqlite.exec(readFileSync(join(directory,file),'utf8'));
      sqlite.exec(readFileSync(join(root,'app/worker/fixtures/p4-read-producer.sql'),'utf8'));
    }
    const db={prepare(sql){let bindings=[];return {bind(...params){bindings=params;return this;},async all(){return {results:sqlite.prepare(sql).all(...bindings),meta:{rows_read:0,rows_written:0}};},async first(){return (await this.all()).results[0] ?? null;}};}};
    snapshot=await new runtime.RegistryRepository(db).seoSnapshot();
    const generation=await runtime.buildGeneration(db,'local');
    assert.ok(generation);
    const entries=new Map([...generation.objects].map(([hash,value])=>['objects/'+hash,value]));
    entries.set('manifests/'+generation.manifestHash,JSON.stringify(generation.manifest));
    entries.set('publication',JSON.stringify({schema:1,environment:'local',current:{generation:generation.manifest.generation,hash:generation.manifestHash}}));
    const clientDirectory=join(root,'app/dist/client');
    const template=readFileSync(existsSync(join(clientDirectory,'index.html')) ? join(clientDirectory,'index.html') : join(root,'app/index.html'),'utf8');
    const env={DB:db,READ_ENVIRONMENT:'local',READ_STORE:{get:async key=>entries.get(key) ?? null},ASSETS:{fetch:async request=>{
      const path=new URL(request.url).pathname;
      if(path.startsWith('/assets/') || path.startsWith('/favicon')) {
        const file=resolve(clientDirectory,'.'+path);
        if(!file.startsWith(clientDirectory+'/') || !existsSync(file)) return new Response('Missing asset',{status:404});
        const types={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
        const extension=file.slice(file.lastIndexOf('.'));return new Response(readFileSync(file),{headers:{'Content-Type':types[extension] ?? 'application/octet-stream'}});
      }
      return new Response(template,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }}};
    localFetch=path=>runtime.worker.fetch(new Request(new URL(path,origin)),env);
  }
  const sitemapResponse=await localFetch('/sitemap.xml');assert.equal(sitemapResponse.status,200);
  const sitemap=new JSDOM(await sitemapResponse.text(),{contentType:'text/xml'}).window.document;
  const urls=[...sitemap.querySelectorAll('url > loc')].map(node=>node.textContent);
  assert.ok(urls.length,'Empty sitemap');assert.equal(new Set(urls).size,urls.length,'Duplicate sitemap URLs');
  const titles=new Set(),descriptions=new Set(),documents=new Map(),report=[];
  async function read(path) {
    if(documents.has(path)) return documents.get(path);
    const response=await localFetch(path);const html=await response.text();
    const document=new JSDOM(html).window.document;
    const value={response,document};documents.set(path,value);return value;
  }
  for(const url of urls) {
    const parsed=new URL(url);assert.equal(parsed.origin,origin,url);assert.equal(parsed.search,'',url);
    const {response,document}=await read(parsed.pathname);assert.equal(response.status,200,url);
    assert.equal(document.querySelectorAll('link[rel="canonical"]').length,1,url);
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'),url,url);
    assert.equal(document.querySelectorAll('h1').length,1,url);assert.equal(document.querySelectorAll('title').length,1,url);
    const title=document.title;assert.ok(title.trim(),url);assert.ok(title.length<=70,`${url}: title length ${title.length}`);assert.ok(!titles.has(title),`${url}: duplicate title ${title}`);titles.add(title);
    const tags=document.querySelectorAll('meta[name="description"]');assert.equal(tags.length,1,url);
    const description=tags[0].getAttribute('content');assert.ok(description?.trim(),url);assert.ok(description.length<=160,`${url}: description length`);assert.ok(!descriptions.has(description),`${url}: duplicate description ${description}`);descriptions.add(description);
    assert.ok(!/\b(Unspecified|Unknown|undefined|null|default)\b/iu.test(title+' '+description),url);
    assert.ok(!/noindex/iu.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''),url);
    assert.ok(!/noindex/iu.test(response.headers.get('X-Robots-Tag') ?? ''),url);
    assert.equal(document.documentElement.lang,'en',url);
    const schemas=[...document.querySelectorAll('script[type="application/ld+json"]')];assert.ok(schemas.length,url);
    for(const schema of schemas) {assert.equal(JSON.parse(schema.textContent)['@context'],'https://schema.org',url);assert.ok(!schema.textContent.includes('https://www.'+new URL(origin).hostname),url);}
    for(const element of document.querySelectorAll('[href],[src]')) {
      const target=new URL(element.getAttribute('href') ?? element.getAttribute('src'),origin);
      assert.notEqual(target.hostname,'www.'+new URL(origin).hostname,`${url}: alternate-host link`);
    }
    for(const node of document.querySelectorAll('link[rel="canonical"],meta[property="og:url"]')) assert.equal(new URL(node.getAttribute('href') ?? node.getAttribute('content')).origin,origin,url);
    const entry=[...sitemap.querySelectorAll('url')].find(node=>node.querySelector('loc')?.textContent===url);
    const lastmod=entry.querySelector('lastmod')?.textContent;
    if(snapshot?.pages[parsed.pathname]?.updated) assert.equal(lastmod,snapshot.pages[parsed.pathname].updated,url);
    if(lastmod) assert.ok(Number.isFinite(Date.parse(lastmod)),url);
    report.push({url,title,description,lastmod});
  }
  if(snapshot) for(const [path,page] of Object.entries(snapshot.pages)) if(!runtime.isIndexablePage(page)) {
    assert.ok(!urls.includes(origin+path),`Noindex page in sitemap: ${path}`);
    const {response,document}=await read(path);assert.equal(response.status,200,path);
    assert.match(document.querySelector('meta[name="robots"]').getAttribute('content'),/noindex/iu,path);
    assert.equal(document.querySelectorAll('link[rel="canonical"]').length,1,path);
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'),origin+path,path);
  }
  // Crawl ordinary clean anchors, including reachable thin entity pages. Never count sitemap edges.
  const depth=new Map([['/',0]]),queue=['/'];
  for(let index=0;index<queue.length;index++) {
    const path=queue[index],distance=depth.get(path);if(distance>=3) continue;
    const {response,document}=await read(path);assert.equal(response.status,200,path);
    for(const anchor of document.querySelectorAll('a[href]')) {
      const url=new URL(anchor.getAttribute('href'),origin);
      if(url.origin!==origin || url.search || url.hash || url.pathname.startsWith('/api/') || depth.has(url.pathname)) continue;
      depth.set(url.pathname,distance+1);queue.push(url.pathname);
    }
  }
  for(const url of urls) assert.ok(depth.has(new URL(url).pathname) && depth.get(new URL(url).pathname)<=3,`More than three clicks: ${url}`);
  for(const path of ['/models?sort=name&order=desc','/models?limit=100','/models?page=2','/benchmarks?q=gpqa','/compare?models=10001,20002']) {
    const {response,document}=await read(path);assert.equal(response.status,200,path);
    assert.match(document.querySelector('meta[name="robots"]').getAttribute('content'),/noindex/iu,path);
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'),origin+path.split('?')[0],path);
  }
  if(values.report) writeFileSync(resolve(values.report),JSON.stringify({origin,sitemapUrls:urls.length,comparisons:snapshot?.comparisons.length,documents:report},null,2)+'\n');
  console.log(`PASS: ${urls.length} sitemap URLs; canonical 200 HTML, one H1, unique metadata, valid JSON-LD, noindex exclusions and ≤3-click reachability.`);
  if(values.serve) {
    assert.ok(!values.base,'Use --serve with a locally built Worker');
    const port=Number(values.serve);assert.ok(Number.isSafeInteger(port) && port>0 && port<65536);
    createServer(async(request,response)=>{
      try {const result=await localFetch(request.url);response.writeHead(result.status,Object.fromEntries(result.headers));response.end(Buffer.from(await result.arrayBuffer()));}
      catch {response.writeHead(500);response.end('Local verification failure');}
    }).listen(port,'127.0.0.1',()=>console.log(`Local preview: http://127.0.0.1:${port}`));
    await new Promise(()=>{});
  }
} finally {sqlite?.close();rmSync(temporary,{recursive:true,force:true});}
