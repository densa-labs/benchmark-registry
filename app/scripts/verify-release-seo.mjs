// Usage (from app/): node scripts/verify-release-seo.mjs <staging|production> <baseline.json> [output-dir]
// baseline.json holds the expected {"counts":{"results","models","benchmarks","versions"}} read from D1 before release.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../..',import.meta.url)).replace(/\/$/u,'');
const require=createRequire(root+'/app/package.json');
const {JSDOM}=require('jsdom');
const [environment,baselinePath,outDir='.wrangler/release-checks']=process.argv.slice(2);assert.ok(['staging','production'].includes(environment) && baselinePath,'Usage: <staging|production> <baseline.json> [output-dir]');mkdirSync(outDir,{recursive:true});
const origin=environment==='staging'?'https://staging.benchmarkregistry.org':'https://benchmarkregistry.org';
const canonical='https://benchmarkregistry.org';
const candidate=JSON.parse(readFileSync(root+'/app/.wrangler/materializations/'+environment+'-candidate.json','utf8'));
const manifest=candidate.manifest;
const seo=(()=>{const h=manifest.objects.seo;if(manifest.inlineObjects?.[h])return manifest.inlineObjects[h].data;const entry=Object.values(candidate.objects).find(([k])=>k===h);assert.ok(entry,'seo object missing from candidate');return JSON.parse(entry[1]).data;})();
const baseline=JSON.parse(readFileSync(baselinePath,'utf8'));
const before={stats:{data:{benchmark_results:baseline.counts.results,models:baseline.counts.models,benchmarks:baseline.counts.benchmarks,versions:baseline.counts.versions}}};
const threshold=Number(/MIN_INDEXABLE_RECORDS\s*=\s*(\d+)/u.exec(readFileSync(root+'/app/src/seo-config.ts','utf8'))[1]);
const isIndexable=p=>!['model','benchmark-version'].includes(p.kind)||(p.records>=threshold&&(p.kind!=='benchmark-version'||!/\b(Unspecified|Unknown|undefined|null|default)\b/iu.test(p.version??'')));
let headers={};
if(environment==='staging'){
 let token;try{token=execFileSync(process.env.CLOUDFLARED ?? 'cloudflared',['access','token','--app='+origin],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000}).trim();}catch{throw new Error('Existing staging Access session unavailable.');}
 headers={'CF-Access-Jwt-Assertion':token};
}
const transientResponses=[];
async function transport(path){
 for(let attempt=1;attempt<=4;attempt++){
  try{return await fetch(new URL(path,origin),{headers,redirect:'manual',signal:AbortSignal.timeout(25000)});}
  catch(error){transientResponses.push({path,errorName:error.name,attempt});if(attempt===4)throw error;await new Promise(done=>setTimeout(done,2000*attempt));}
 }
}

async function response(path){
 for(let attempt=0;attempt<8;attempt++){
  const r=await transport(path);
  if(![429,502,503,504].includes(r.status)||attempt===7)return r;
  const errorDoc=new JSDOM(await r.text()).window.document;transientResponses.push({path,status:r.status,attempt:attempt+1,server:r.headers.get('Server'),mitigated:r.headers.get('CF-Mitigated'),registryRevision:r.headers.get('X-Registry-Revision'),errorTitle:errorDoc.title,errorHeading:errorDoc.querySelector('h1')?.textContent});writeFileSync(outDir+'/seo-'+environment+'-transport.json',JSON.stringify(transientResponses,null,2));
  await new Promise(done=>setTimeout(done,Math.min(12000,2000*(attempt+1))));
 }
}
const robotResponse=await response('/robots.txt');assert.equal(robotResponse.status,200);
const robots=await robotResponse.text();assert.ok(robots.includes(environment==='staging'?'Disallow: /':'Sitemap: '+canonical+'/sitemap.xml'));
const statsResponse=await response('/api/stats');assert.equal(statsResponse.status,200);
const stats=await statsResponse.json();assert.deepEqual(stats,before.stats,'Scoring/data counts changed during rollout');
assert.equal(statsResponse.headers.get('X-Registry-Revision'),manifest.generation,'Not serving published generation');
assert.equal(statsResponse.headers.get('X-Registry-D1-Queries'),'0');
const sitemapResponse=await response('/sitemap.xml');assert.equal(sitemapResponse.status,200);
const xml=new JSDOM(await sitemapResponse.text(),{contentType:'text/xml'}).window.document;
const entries=[...xml.querySelectorAll('url')].map(entry=>({url:entry.querySelector('loc').textContent,lastmod:entry.querySelector('lastmod')?.textContent}));
const expected=['/','/models','/benchmarks','/companies','/compare','/recent','/legal','/privacy','/terms','/about','/contact','/corrections','/coverage',...Object.entries(seo.pages).filter(([,p])=>isIndexable(p)).map(([path])=>path)];
const urls=entries.map(e=>e.url);assert.equal(new Set(urls).size,urls.length);
assert.deepEqual(new Set(urls),new Set(expected.map(path=>canonical+path)),'Unexpected sitemap inclusion/exclusion');
const titles=new Set(),descriptions=new Set(),documents=new Map(),results=[];
async function inspect(path,indexable=true){
 const r=await response(path);assert.equal(r.status,200,path);
 if(path!=='/coverage') assert.equal(r.headers.get('X-Registry-D1-Queries'),'0',path);
 if(!['/legal','/privacy','/terms','/about','/contact','/corrections','/coverage'].includes(path)) assert.equal(r.headers.get('X-Registry-Revision'),manifest.generation,path);
 assert.notEqual(r.headers.get('X-Registry-Cache'),'stale',path);
 const d=new JSDOM(await r.text()).window.document;documents.set(path,d);
 assert.equal(d.querySelectorAll('link[rel="canonical"]').length,1,path);
 assert.equal(d.querySelector('link[rel="canonical"]').getAttribute('href'),canonical+path.split('?')[0],path);
 assert.equal(d.querySelectorAll('h1').length,1,path);assert.equal(d.documentElement.lang,'en',path);
 const title=d.title;const description=d.querySelector('meta[name="description"]')?.getAttribute('content');assert.ok(title&&description,path);assert.ok(title.length<=70&&description.length<=160,path);
 assert.ok(!/\b(Unspecified|Unknown|undefined|null|default)\b/iu.test(title+' '+description),path);
 const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent));assert.ok(schemas.length,path);
 assert.ok(!JSON.stringify(schemas).includes('www.benchmarkregistry.org'),path);
 const noindex=/noindex/iu.test(d.querySelector('meta[name="robots"]')?.getAttribute('content')??'');
 if(environment==='staging'){assert.equal(title,'STAGING | Benchmark Registry',path);assert.ok(noindex,path);assert.match(r.headers.get('X-Robots-Tag'),/noindex.*nofollow/u,path);}
 else if(indexable){assert.ok(!noindex,path);assert.ok(!/noindex/iu.test(r.headers.get('X-Robots-Tag')??''),path);assert.ok(!titles.has(title),path+' duplicate title');titles.add(title);assert.ok(!descriptions.has(description),path+' duplicate description');descriptions.add(description);}
 else assert.ok(noindex,path);
 assert.equal(d.querySelector('meta[property="og:url"]').getAttribute('content'),canonical+path.split('?')[0],path);
 assert.equal(d.querySelector('meta[name="twitter:card"]').getAttribute('content'),'summary',path);
 for(const e of d.querySelectorAll('[href],[src]')) assert.notEqual(new URL(e.getAttribute('href')??e.getAttribute('src'),canonical).hostname,'www.benchmarkregistry.org',path);
 results.push({path,status:r.status,title,description,canonical:canonical+path.split('?')[0],revision:r.headers.get('X-Registry-Revision'),noindex});
}
let cursor=0;
await Promise.all(Array.from({length:1},async()=>{while(cursor<entries.length){const entry=entries[cursor++];const path=new URL(entry.url).pathname;assert.equal(new URL(entry.url).origin,canonical);assert.equal(new URL(entry.url).search,'');assert.equal(entry.lastmod,seo.pages[path]?.updated,path);await inspect(path);}}));
console.log('PASS canonical HTML and JSON-LD: '+entries.length+' sitemap URLs on '+environment);
for(const [path,page] of Object.entries(seo.pages)) if(!isIndexable(page)){assert.ok(!urls.includes(canonical+path),path);await inspect(path,false);}
for(const path of ['/models?sort=name&order=desc','/models?page=2','/models?limit=100','/benchmarks?q=gpqa','/compare?models=10001,20002']) await inspect(path,false);
const depth=new Map([['/',0]]),queue=['/'];
for(let i=0;i<queue.length;i++){
 const path=queue[i],n=depth.get(path);if(n>=3)continue;
 if(!documents.has(path))await inspect(path,false);
 for(const anchor of documents.get(path).querySelectorAll('a[href]')){
  const link=new URL(anchor.getAttribute('href'),canonical);
  if(link.origin!==canonical||link.search||link.hash||link.pathname.startsWith('/api/')||link.pathname==='/feed.xml'||link.pathname.startsWith('/badge/')||depth.has(link.pathname))continue;
  depth.set(link.pathname,n+1);queue.push(link.pathname);
 }
}
for(const e of entries)assert.ok(depth.has(new URL(e.url).pathname)&&depth.get(new URL(e.url).pathname)<=3,e.url+' reachability');
for(const [old,target] of [['/benchmarks/itbench-sre/versions/default','/benchmarks'],['/incai-ringflash20','/models'],['/models/claude-opus-5-5','/models/20015']]){const r=await response(old);assert.equal(r.status,301,old);assert.equal(r.headers.get('Location'),origin+target,old);}
if(environment==='production')for(const url of ['https://www.benchmarkregistry.org/models/20015?limit=100','http://benchmarkregistry.org/models/20015?limit=100']){const r=await fetch(url,{redirect:'manual'});assert.equal(r.status,301,url);assert.equal(r.headers.get('Location'),canonical+'/models/20015?limit=100',url);}
assert.equal((await response('/assets/Benchmark-Registry-B-Logo-Dark.png')).status,200);
const output={environment,origin,commit:execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8'}).trim(),generation:manifest.generation,stats,sitemapUrls:entries.length,comparisons:seo.comparisons.length,noindexPages:Object.values(seo.pages).filter(p=>!isIndexable(p)).length,checkedAt:new Date().toISOString(),transientResponses,results};
writeFileSync(outDir+'/seo-'+environment+'-live.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({...output,results:undefined}));
console.log('PASS redirects, noindex exclusions, three-click reachability, source dates, data preservation and published-page zero D1 reads.');
