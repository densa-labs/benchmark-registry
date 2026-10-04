import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import template from '../index.html?raw';
import worker from './index';
import canonical from './canonical-reference';
import {buildGeneration,needsMaterialization,inlineBundle,INLINE_BUNDLE_LIMIT} from './materializer';
import {garbageCandidates,protectedPublicationKeys,publishGeneration,readManifest,readPublication,rollbackBuild,verifyGeneration,type ProducerStore} from './publication';
import {digest,validateManifest,type Publication} from './read-model';
import {shadowGeneration} from './shadow';
import {MaterializedRepository} from './materialized-repository';
import {RegistryRepository} from './repository';
import { latestReportedResult } from './featured-result';
import {VerifiedReads,verifiedReads} from './read-store';
import type { ModelListResponse } from '../src/registry';
const databases:DatabaseSync[]=[];
afterEach(()=>{databases.splice(0).forEach(db=>db.close());});
// Each test starts as a fresh isolate with no verified reads.
beforeEach(()=>verifiedReads.clear());
class Store implements ProducerStore {
  entries=new Map<string,string>();writes:string[]=[];reads=0;fail=false;
  async get(key:string) {this.reads++;return this.entries.get(key) ?? null;}
  async put(entries:{key:string;value:string}[]) {if(this.fail) throw new Error('KV unavailable');for(const e of entries) {this.entries.set(e.key,e.value);this.writes.push(e.key);}}
}
function fixture() {
  const sqlite=new DatabaseSync(':memory:');databases.push(sqlite);
  const directory=new URL('../../migrations/',import.meta.url);
  for(const name of readdirSync(directory).filter(name=>name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(name,directory),'utf8'));
  sqlite.exec(readFileSync(new URL('./fixtures/p4-read-producer.sql',import.meta.url),'utf8'));
  let queries=0;
  const db={prepare(sql:string){let params:(string|number|null)[]=[];return {bind(...values:(string|number|null)[]){params=values;return this;},async all(){queries++;return {results:sqlite.prepare(sql).all(...params),meta:{rows_read:0,rows_written:0}};},async first(){return (await this.all()).results[0] ?? null;}};}} as unknown as D1Database;
  const store=new Store();
  const env={DB:{prepare:vi.fn(()=>{throw new Error('PUBLIC D1 MUST NEVER BE CALLED');})} as unknown as D1Database,READ_STORE:{get:(key:string)=>store.get(key)} as unknown as KVNamespace,READ_ENVIRONMENT:'local' as const,ASSETS:{fetch:async()=>new Response(template,{headers:{'Content-Type':'text/html'}})} as unknown as Fetcher};
  return {sqlite,db,store,env,queries:()=>queries};
}
async function bootstrap(f:ReturnType<typeof fixture>) {
  const build=(await buildGeneration(f.db,'local'))!;
  const evidence=await publishGeneration(f.store,build,f.db);
  const publication=(await readPublication(f.store,'local'))!;
  return {build,evidence,publication};
}
const apiPaths=['/api/home-panels','/api/stats','/api/models','/api/models?sort=name&order=desc','/api/models?sort=released&order=asc&limit=100','/api/models?sort=published&order=desc','/api/models?company=openai&q=gpt','/api/models?page=2','/api/models/10001','/api/models/10001?view=history&sort=source&order=desc','/api/models/10001?q=gpqa','/api/benchmarks','/api/benchmarks?sort=released&order=asc','/api/benchmarks?sort=version&order=desc&q=g','/api/benchmarks/gpqa','/api/benchmarks/gpqa/diamond','/api/benchmarks/gpqa/diamond?view=history&company=openai&q=gpt&sort=registry_no&order=desc','/api/companies','/api/companies?sort=established&order=desc','/api/companies?sort=latest_model&order=asc&q=anth','/api/companies/openai?view=history&sort=reported_at&order=asc','/api/search?q=gpt','/api/search?q=GPQA','/api/search?q=10001','/api/search?q=GPT-4.1%20GPQA','/api/search?q=%25','/api/models/99999','/api/models?sort=score'];
it('bootstraps verified projections and preserves API query/search/sort/pagination/status semantics with zero public D1 reads',async()=>{
  const f=fixture();const {evidence}=await bootstrap(f);expect(evidence.objects).toBeGreaterThan(25);
  for(const path of apiPaths) {
    const request=new Request('https://benchmarkregistry.org'+path);
    const original=await canonical.fetch(request,{...f.env,DB:f.db});
    const response=await worker.fetch(request,f.env);
    expect(response.status,path).toBe(original.status);
    expect(await response.json(),path).toEqual(await original.json());
    expect(response.headers.get('X-Registry-D1-Rows')).toBe('0');
  }
  expect(f.env.DB.prepare).not.toHaveBeenCalled();
});
it('preserves initial HTML, hydration payload, SEO and approved/ambiguous exact-result states',async()=>{
  const f=fixture();const {evidence}=await bootstrap(f);
  const paths=['/','/models','/models/10001','/benchmarks','/benchmarks/gpqa','/benchmarks/gpqa/diamond','/companies','/companies/openai','/models/99999','/models?sort=score','/sitemap.xml'];
  const key=f.sqlite.prepare('SELECT r.result_key,b.slug,bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id LIMIT 1').get() as {result_key:string;slug:string;version_slug:string};
  paths.push(`/benchmarks/${key.slug}/${key.version_slug}?view=history&result=${key.result_key}`);
  for(const path of paths) {
    const request=new Request('https://benchmarkregistry.org'+path);
    const original=await canonical.fetch(request,{...f.env,DB:f.db});const response=await worker.fetch(request,f.env);
    expect(response.status,path).toBe(original.status);
    const left=await original.text(),right=await response.text();
    if(path==='/sitemap.xml') expect(right).toBe(left);
    else {
      const initial=(html:string)=>{const text=/<script id="registry-initial-document" type="application\/json">([\s\S]*?)<\/script>/u.exec(html)?.[1];if(!text) return null;const value=JSON.parse(text);delete value.revision;return value;};
      expect(initial(right),path).toEqual(initial(left));
      expect(right.match(/<title>[\s\S]*?<\/title>|<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>/gu),path).toEqual(left.match(/<title>[\s\S]*?<\/title>|<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>/gu));
      if(response.status===200) expect(right).toContain('<h1');
    }
  }
  expect(evidence.canonicalUrls).toBe(4+11+6+9+3+evidence.approvedExact);
  expect(f.env.DB.prepare).not.toHaveBeenCalled();
});
it('no-op canonical updates cause no generation, payload rewrite or invalidation',async()=>{
  const f=fixture();const {build}=await bootstrap(f);const writes=f.store.writes.length;
  f.sqlite.exec("UPDATE models SET canonical_name=canonical_name WHERE registry_no='10001'");
  const before=f.queries();expect(await buildGeneration(f.db,'local',build.manifest)).toBeNull();
  expect(f.queries()-before).toBe(1);expect(f.store.writes).toHaveLength(writes);
});
it('refreshes featured scores from current model history even when the models index is unchanged',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  const original=f.sqlite.prepare(`SELECT r.* FROM results r JOIN models m ON m.id=r.model_id
    JOIN metrics metric ON metric.id=r.metric_id WHERE m.registry_no='10001' AND metric.unit='percent' ORDER BY r.id LIMIT 1`).get() as Record<string,string|number|null>;
  f.sqlite.prepare("UPDATE results SET score_value='99',score_raw='99%',reported_at='2010-01-01',reported_precision='date' WHERE id=?").run(original.id);
  const id=Number((f.sqlite.prepare('SELECT max(id) AS n FROM results').get() as {n:number}).n)+1;
  const newer={...original,id,result_key:'f'.repeat(64),run_ref:'featured-score-newer-run',score_value:'1',score_raw:'1%',reported_at:'2030-01-01',reported_precision:'date'};
  f.sqlite.exec('BEGIN');
  f.sqlite.prepare(`INSERT INTO results(${Object.keys(newer).join(',')}) VALUES(${Object.keys(newer).map(()=>'?').join(',')})`).run(...Object.values(newer));
  f.sqlite.prepare('INSERT INTO result_evaluators SELECT ?,evaluator_organization_id FROM result_evaluators WHERE result_id=?').run(id,original.id);
  f.sqlite.exec('COMMIT');
  const next=(await buildGeneration(f.db,'local',build.manifest))!;
  expect(next.rebuilt).not.toContain('models');
  await publishGeneration(f.store,next,f.db,publication);
  const response=await worker.fetch(new Request('https://benchmarkregistry.org/api/models?q=10001'),f.env);
  const body=await response.json() as ModelListResponse;
  // The newer, lower score is featured: the latest report, never the highest.
  expect(body.data[0].featured_result).toMatchObject({result_key:'f'.repeat(64),score:{value:'1',display:'1.0%'}});
  const history=await new RegistryRepository(f.db).model('10001',{page:1,limit:500,view:'history'});
  expect(body.data[0].featured_result).toEqual(latestReportedResult(history.data.results));
  expect(response.headers.get('X-Registry-D1-Rows')).toBe('0');
  expect(f.env.DB.prepare).not.toHaveBeenCalled();
});
it('new result regenerates only affected scopes and retires exact eligibility coherently',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  const original=f.sqlite.prepare('SELECT * FROM results ORDER BY id LIMIT 1').get() as Record<string,string|number|null>;
  const id=Number((f.sqlite.prepare('SELECT max(id) AS n FROM results').get() as {n:number}).n)+1;
  const newRow={...original,id,result_key:'f'.repeat(64),run_ref:'p119-fixture-second-run',reported_at:'2030-01-01T12:00:00Z',reported_precision:'timestamp'};
  f.sqlite.exec('BEGIN');
  f.sqlite.prepare(`INSERT INTO results(${Object.keys(newRow).join(',')}) VALUES(${Object.keys(newRow).map(()=>'?').join(',')})`).run(...Object.values(newRow));
  f.sqlite.prepare('INSERT INTO result_evaluators SELECT ?,evaluator_organization_id FROM result_evaluators WHERE result_id=?').run(id,original.id);
  f.sqlite.exec('COMMIT');
  const next=(await buildGeneration(f.db,'local',build.manifest))!;
  expect(next.rebuilt).toHaveLength(8);expect(next.rebuilt).toContain('home-panels');expect(next.rebuilt).toContain('search-relationships');expect(next.rebuilt).not.toContain('search-entities');expect(next.rebuilt).not.toContain('models');expect(next.rebuilt).not.toContain('benchmarks');
  const evidence=await publishGeneration(f.store,next,f.db,publication);
  expect(evidence.objectWrites).toBeLessThanOrEqual(7);expect(evidence.ambiguous).toBeGreaterThan(0);
  expect((await readPublication(f.store,'local'))?.previous).toEqual(publication.current);
  // All changed payloads are in one value: missing standalone writes cannot split a generation.
  for(const hash of next.objects.keys()) f.store.entries.delete('objects/'+hash);
  const response=await worker.fetch(new Request('https://benchmarkregistry.org/api/stats'),f.env);
  expect(response.status).toBe(200);expect((await response.json() as {data:{benchmark_results:number}}).data.benchmark_results).toBe(Number((f.sqlite.prepare('SELECT count(*) AS n FROM results').get() as {n:number}).n));
  expect(response.headers.get('X-Registry-D1-Rows')).toBe('0');
});
it('failed generation validation/publication leaves previous pointer and canonical commit intact',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  f.sqlite.exec("UPDATE models SET canonical_name='GPT fixture corrected',normalized_name='gpt fixture corrected' WHERE registry_no='10001'");
  const next=(await buildGeneration(f.db,'local',build.manifest))!;
  f.store.fail=true;await expect(publishGeneration(f.store,next,f.db,publication)).rejects.toThrow('KV unavailable');
  expect(await readPublication(f.store,'local')).toEqual(publication);
  f.store.fail=false;await publishGeneration(f.store,next,f.db,publication);
  const recovered=await readPublication(f.store,'local');expect(recovered?.current.generation).toBe(next.manifest.generation);
});
it('missing/corrupt new manifest falls back as a complete previous generation without D1',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  f.sqlite.exec("UPDATE models SET canonical_name='GPT fixture corrected',normalized_name='gpt fixture corrected' WHERE registry_no='10001'");
  const next=(await buildGeneration(f.db,'local',build.manifest))!;await publishGeneration(f.store,next,f.db,publication);
  f.store.entries.set('manifests/'+next.manifestHash,'{"corrupt":true}');
  const response=await worker.fetch(new Request('https://benchmarkregistry.org/models/10001'),f.env);const html=await response.text();
  expect(response.status).toBe(200);expect(response.headers.get('X-Registry-Revision')).toBe(build.manifest.generation);expect(response.headers.get('X-Registry-Cache')).toBe('stale');expect(html).not.toContain('GPT fixture corrected');
  f.store.entries.set('manifests/'+next.manifestHash,JSON.stringify(next.manifest));
  f.store.entries.delete('objects/'+next.manifest.objects.redirects);
  verifiedReads.clear();
  const missingObject=await worker.fetch(new Request('https://benchmarkregistry.org/models/10001'),f.env);
  expect(missingObject.headers.get('X-Registry-Revision')).toBe(build.manifest.generation);
  expect(await missingObject.text()).not.toContain('GPT fixture corrected');
  f.store.entries.delete('publication');
  expect((await worker.fetch(new Request('https://benchmarkregistry.org/api/models'),f.env)).status).toBe(200);
  f.store.entries.clear();expect((await worker.fetch(new Request('https://benchmarkregistry.org/api/models'),f.env)).status).toBe(500);
  expect(f.env.DB.prepare).not.toHaveBeenCalled();
});
it('explicit rollback publishes a new identity while preserving previous and canonical pending state',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  f.sqlite.exec("UPDATE companies SET name='OpenAI corrected',normalized_name='openai corrected' WHERE slug='openai'");
  const next=(await buildGeneration(f.db,'local',build.manifest))!;await publishGeneration(f.store,next,f.db,publication);
  const current=(await readPublication(f.store,'local'))!,old=await readManifest(f.store,current.previous!.hash,'local');
  const rollback=rollbackBuild(old);rollback.manifestHash=await digest(JSON.stringify(rollback.manifest));
  await publishGeneration(f.store,rollback,f.db,current,next.manifest.canonicalRevision);
  expect((await readPublication(f.store,'local'))?.current.generation).not.toBe(old.generation);
  expect((await worker.fetch(new Request('https://benchmarkregistry.org/api/companies/openai'),f.env)).status).toBe(200);
});
it('environment isolation and GC protect current, previous and last-good live objects',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  f.sqlite.exec("UPDATE models SET canonical_name='GPT fixture corrected',normalized_name='gpt fixture corrected' WHERE registry_no='10001'");
  await publishGeneration(f.store,(await buildGeneration(f.db,'local',build.manifest))!,f.db,publication);
  expect((await worker.fetch(new Request('https://staging.benchmarkregistry.org/models'),{...f.env,READ_ENVIRONMENT:'staging'})).status).toBe(500);
  const protectedKeys=await protectedPublicationKeys(f.store,'local');
  const old=new Date(Date.now()-15*86400_000).toISOString();
  const entries=[...f.store.entries.keys()].map(key=>({key,createdAt:old}));entries.push({key:'objects/abandoned',createdAt:old});
  expect(garbageCandidates(entries,protectedKeys)).toEqual(['objects/abandoned']);
  const manifest=(await readPublication(f.store,'local'))!;await expect(verifyGeneration(f.store,await readManifest(f.store,manifest.current.hash,'local'))).resolves.toHaveProperty('objects');
});
it('manifest references are validated before an active pointer can be written',async()=>{
  const f=fixture();const {build}=await bootstrap(f);
  const bad={...build.manifest,objects:{...build.manifest.objects,models:'0'.repeat(64)}};
  await expect(verifyGeneration(f.store,bad)).rejects.toThrow();
  expect((JSON.parse(f.store.entries.get('publication')!) as Publication).current.generation).toBe(build.manifest.generation);
});
it('bootstrap shadow checks all supported read projections before cutover',async()=>{
  const f=fixture();const {build}=await bootstrap(f);
  expect(await shadowGeneration(f.db,build)).toMatchObject({equivalent:true});
  expect(await shadowGeneration(f.db,{...build,manifest:{...build.manifest,inlineObjects:{}}})).toMatchObject({equivalent:true});
});
it('malformed inline payloads cannot replace or serve a valid generation',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  const hash=build.manifest.objects.models;
  const bad=structuredClone(build.manifest);
  (bad.inlineObjects[hash].data as {response:{data:{name:string}[]}}).response.data[0].name='Unvalidated edit';
  await expect(verifyGeneration(f.store,bad)).rejects.toThrow('Corrupt coherent update bundle');
  const badHash=await digest(JSON.stringify(bad));
  f.store.entries.set('manifests/'+badHash,JSON.stringify(bad));
  f.store.entries.set('publication',JSON.stringify({...publication,current:{generation:bad.generation,hash:badHash},previous:publication.current}));
  const response=await worker.fetch(new Request('https://benchmarkregistry.org/api/models'),f.env);
  expect(response.status).toBe(200);expect(response.headers.get('X-Registry-Cache')).toBe('stale');
  expect(await response.text()).not.toContain('Unvalidated edit');expect(f.env.DB.prepare).not.toHaveBeenCalled();
});
it.each([
  ["UPDATE models SET canonical_name='GPT fixture corrected',normalized_name='gpt fixture corrected' WHERE registry_no='10001'",'model:10001','benchmarks'],
  ["UPDATE companies SET name='OpenAI corrected',normalized_name='openai corrected' WHERE slug='openai'",'company:openai','benchmarks'],
  ["UPDATE benchmarks SET canonical_name='GPQA corrected',normalized_name='gpqa corrected' WHERE slug='gpqa'",'family:gpqa','models'],
  ["UPDATE benchmark_versions SET version='Diamond corrected' WHERE id=(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.slug='gpqa' AND bv.version_slug='diamond')",'version:gpqa:diamond','models'],
])('metadata dependency scopes remain equivalent without rebuilding unrelated directories (%s)',async(sql,affected,unrelated)=>{
  const f=fixture();const {build,publication}=await bootstrap(f);f.sqlite.exec(sql);
  const next=(await buildGeneration(f.db,'local',build.manifest))!;
  expect(next.rebuilt).toContain(affected);expect(next.rebuilt).not.toContain(unrelated);
  expect(next.rebuilt).not.toContain('stats');expect(next.rebuilt).not.toContain('inventory');
  await publishGeneration(f.store,next,f.db,publication);
  for(const path of apiPaths) {
    const request=new Request('https://benchmarkregistry.org'+path),original=await canonical.fetch(request,{...f.env,DB:f.db}),response=await worker.fetch(request,f.env);
    expect(await response.json(),path).toEqual(await original.json());
  }
  const materialized=new MaterializedRepository(next.manifest,async(key)=>JSON.parse(f.store.entries.get('objects/'+next.manifest.objects[key])!).data);
  expect(await materialized.sitemapPaths()).toEqual(await new RegistryRepository(f.db).sitemapPaths());
});

it('refreshes homepage additions in insertion order when backfilling an old result, with zero public D1 reads', async () => {
  const f=fixture(); const { build, publication }=await bootstrap(f);
  const original=f.sqlite.prepare('SELECT * FROM results ORDER BY id LIMIT 1').get() as Record<string,string|number|null>;
  const id=Number((f.sqlite.prepare('SELECT max(id) AS n FROM results').get() as {n:number}).n)+1;
  const row={...original,id,result_key:'e'.repeat(64),run_ref:'homepage-backfill',reported_at:'2010-01-01',reported_precision:'date'};
  f.sqlite.exec('BEGIN');
  f.sqlite.prepare(`INSERT INTO results(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`).run(...Object.values(row));
  f.sqlite.prepare('INSERT INTO result_evaluators SELECT ?,evaluator_organization_id FROM result_evaluators WHERE result_id=?').run(id,original.id);
  f.sqlite.exec('COMMIT');
  const next=(await buildGeneration(f.db,'local',build.manifest))!;
  expect(next.rebuilt).toContain('home-panels');
  await publishGeneration(f.store,next,f.db,publication);
  const response=await worker.fetch(new Request('https://benchmarkregistry.org/api/home-panels'),f.env);
  const panels=await response.json() as import('./home-panels').HomePanels;
  expect(panels.latest_additions[0]).toMatchObject({result_key:row.result_key,reported_at:'2010-01-01'});
  expect(panels.latest_additions).toHaveLength(5);
  const coverage=panels.explore_benchmarks.find(entry=>entry.benchmark.slug===panels.latest_additions[0].benchmark.slug)!;
  const counts=f.sqlite.prepare(`SELECT count(DISTINCT r.model_id) AS models,count(*) AS results FROM results r
    JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id
    WHERE b.slug=? AND NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=r.model_id)`).get(coverage.benchmark.slug) as {models:number;results:number};
  expect(coverage).toMatchObject({model_count:counts.models,result_count:counts.results});
  expect(response.headers.get('X-Registry-D1-Rows')).toBe('0');
  expect(f.env.DB.prepare).not.toHaveBeenCalled();
});

it('bootstraps homepage panels in older generations without a canonical data change', async () => {
  const f=fixture(); const {build}=await bootstrap(f);
  const previous={...build.manifest,objects:{...build.manifest.objects},inlineObjects:{...build.manifest.inlineObjects}};
  delete previous.inlineObjects[previous.objects['home-panels']]; delete previous.objects['home-panels'];
  const next=(await buildGeneration(f.db,'local',previous))!;
  expect(next.rebuilt).toEqual(['seo','home-panels']);
  expect(next.manifest.objects['home-panels']).toBeTruthy();
  expect(await buildGeneration(f.db,'local',next.manifest)).toBeNull();
});

it('adds SEO to an existing generation without changing canonical data', async () => {
  const f=fixture(); const {build}=await bootstrap(f);
  const previous={...build.manifest,objects:{...build.manifest.objects},inlineObjects:{...build.manifest.inlineObjects}};
  delete previous.inlineObjects[previous.objects.seo]; delete previous.objects.seo;
  expect(()=>validateManifest(previous,'local')).toThrow('Incomplete read manifest.');
  const priorText=JSON.stringify(previous),priorHash=await digest(priorText);
  f.store.entries.set('manifests/'+priorHash,priorText);
  const legacy=await readManifest(f.store,priorHash,'local');
  const next=(await buildGeneration(f.db,'local',legacy))!;
  expect(next.manifest.canonicalRevision).toBe(previous.canonicalRevision);
  expect(next.manifest.objects.seo).toBeTruthy();
  expect(await buildGeneration(f.db,'local',next.manifest)).toBeNull();
});

it('manual publication preflight detects projection upgrades even with unchanged canonical data',async()=>{
  const f=await fixture();
  const build=(await buildGeneration(f.db,'local'))!;
  const state={revision:build.manifest.canonicalRevision,watermark:build.manifest.watermark};
  expect(needsMaterialization(build.manifest,state)).toBe(false);
  expect(needsMaterialization({...build.manifest,projectionVersion:4},state)).toBe(true);
  expect(needsMaterialization(undefined,state)).toBe(true);
  expect(needsMaterialization(build.manifest,{...state,revision:'changed'})).toBe(true);
  expect(needsMaterialization(build.manifest,{...state,watermark:state.watermark+1})).toBe(true);
});

it('keeps full rebuild manifests bounded while retaining verified small update bundles',()=>{
  const stats={schema:1 as const,key:'stats',environment:'local' as const,data:{data:{models:1,benchmarks:1,versions:1,benchmark_results:1}}};
  const tiny=new Map([['a'.repeat(64),JSON.stringify(stats)]]);
  expect(inlineBundle(tiny)['a'.repeat(64)]).toEqual(stats);
  const large={schema:1,key:'search-entities',environment:'local',data:['x'.repeat(INLINE_BUNDLE_LIMIT)]};
  const bundle=inlineBundle(new Map([...tiny,['b'.repeat(64),JSON.stringify(large)]]));
  expect(Object.keys(bundle)).toEqual(['a'.repeat(64)]);
});

it('serves compact full publications and falls back coherently when a required object is corrupt',async()=>{
  const f=fixture();const {build,publication}=await bootstrap(f);
  f.sqlite.exec("UPDATE models SET canonical_name='Compact corrected',normalized_name='compact corrected' WHERE registry_no='10001'");
  const next=(await buildGeneration(f.db,'local',build.manifest))!;
  next.manifest.inlineObjects={};next.manifestHash=await digest(JSON.stringify(next.manifest));
  await publishGeneration(f.store,next,f.db,publication);
  const ok=await worker.fetch(new Request('https://benchmarkregistry.org/models/10001'),f.env);
  expect(ok.status).toBe(200);expect(await ok.text()).toContain('Compact corrected');
  f.store.entries.set('objects/'+next.manifest.objects['model:10001'],'corrupt');
  // An isolate that already verified this content-addressed object keeps serving it.
  const warm=await worker.fetch(new Request('https://benchmarkregistry.org/models/10001'),f.env);
  expect(warm.headers.get('X-Registry-Revision')).toBe(next.manifest.generation);expect(await warm.text()).toContain('Compact corrected');
  verifiedReads.clear();
  const fallback=await worker.fetch(new Request('https://benchmarkregistry.org/models/10001'),f.env);
  expect(fallback.headers.get('X-Registry-Revision')).toBe(build.manifest.generation);
  expect(await fallback.text()).not.toContain('Compact corrected');
});

it('retains full shadow inputs when projection upgrades preserve every object hash',async()=>{
  const f=fixture();const {build}=await bootstrap(f);
  const next=(await buildGeneration(f.db,'local',{...build.manifest,projectionVersion:5}))!;
  expect(next.objects.size).toBe(Object.keys(next.manifest.objects).length);
  expect(await shadowGeneration(f.db,{...next,manifest:{...next.manifest,inlineObjects:{}}})).toMatchObject({equivalent:true});
});

it('verifies each published object once per isolate across cold page renders (Cloudflare 1102 regression)',async()=>{
  const f=fixture();const {build}=await bootstrap(f);
  build.manifest.inlineObjects={};build.manifestHash=await digest(JSON.stringify(build.manifest));
  await publishGeneration(f.store,build,f.db,(await readPublication(f.store,'local'))!);
  const objectReads:string[]=[];const get=f.store.get.bind(f.store);
  f.store.get=async(key:string)=>{if(key.startsWith('objects/') || key.startsWith('manifests/')) objectReads.push(key);return get(key);};
  const pages=['/models/10001','/benchmarks/gpqa','/benchmarks/gpqa/diamond','/search?q=gpt'];
  for(const path of pages) expect((await worker.fetch(new Request('https://benchmarkregistry.org'+path),f.env)).status).toBe(200);
  // Every render reads the large seo object; once verified it is never fetched, hashed or parsed again.
  expect(objectReads.filter(key=>key==='objects/'+build.manifest.objects.seo)).toHaveLength(1);
  expect(new Set(objectReads).size).toBe(objectReads.length);
  const firstPass=new Set(objectReads);objectReads.length=0;
  // New cold pages fetch only their own objects, never the manifest, seo or anything verified earlier.
  for(const path of ['/models/10002','/models/10003','/companies/openai','/search?q=mmlu']) expect((await worker.fetch(new Request('https://benchmarkregistry.org'+path),f.env)).status).toBe(200);
  expect(objectReads.filter(key=>firstPass.has(key) || key.startsWith('manifests/'))).toEqual([]);
  expect(verifiedReads.bytes).toBeLessThanOrEqual(verifiedReads.budget);
});
it('keeps verified reads within a byte budget, least recently used first, and frozen',()=>{
  const reads=new VerifiedReads(100);
  reads.set('a',{n:1},40);reads.set('b',{n:2},40);reads.get('a');reads.set('c',{n:3},40);
  expect([reads.get('a'),reads.get('b'),reads.get('c')]).toEqual([{n:1},undefined,{n:3}]);
  expect(reads.bytes).toBe(80);expect(reads.size).toBe(2);
  reads.set('huge',{},101);expect(reads.get('huge')).toBeUndefined();expect(reads.bytes).toBe(80);
  const value={nested:{list:[1]}};reads.set('frozen',value,10);
  expect(Object.isFrozen(value.nested.list)).toBe(true);
  for(let i=0;i<1000;i++) reads.set('k'+i,{i},7);
  expect(reads.bytes).toBeLessThanOrEqual(100);
});
