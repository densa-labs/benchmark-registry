import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
import template from '../index.html?raw';
import {handleRequest,type Env} from './index';
import canonical from './canonical-reference';
import {buildGeneration} from './materializer';
import {verifyGeneration} from './publication';
import {MaterializedRepository} from './materialized-repository';
import {RegistryRepository} from './repository';
import { latestReportedResult } from './featured-result';
import type { ReadData } from './read-model';
import type { ModelListResponse } from '../src/registry';
// The static build renders every page from one projection of the canonical
// tables. These tests check that projection against direct D1 reads.
const databases:DatabaseSync[]=[];
afterEach(()=>{databases.splice(0).forEach(db=>db.close());});
function fixture() {
  const sqlite=new DatabaseSync(':memory:');databases.push(sqlite);
  const directory=new URL('../../migrations/',import.meta.url);
  for(const name of readdirSync(directory).filter(name=>name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(name,directory),'utf8'));
  sqlite.exec(readFileSync(new URL('./fixtures/p4-read-producer.sql',import.meta.url),'utf8'));
  let queries=0;
  const db={prepare(sql:string){let params:(string|number|null)[]=[];return {bind(...values:(string|number|null)[]){params=values;return this;},async all(){queries++;return {results:sqlite.prepare(sql).all(...params),meta:{rows_read:0,rows_written:0}};},async first(){return (await this.all()).results[0] ?? null;}};}} as unknown as D1Database;
  const env={DB:{prepare:vi.fn(()=>{throw new Error('RENDERS MUST NOT QUERY D1');})} as unknown as D1Database,ASSETS:{fetch:async()=>new Response(template,{headers:{'Content-Type':'text/html'}})} as unknown as Fetcher} as unknown as Env;
  return {sqlite,db,env,queries:()=>queries};
}
async function project(f:ReturnType<typeof fixture>) {
  const build=await buildGeneration(f.db,'local');
  const repository=new MaterializedRepository(build.manifest,async <K extends keyof ReadData>(key:string)=>(JSON.parse(build.objects.get(build.manifest.objects[key])!) as {data:ReadData[K]}).data);
  const render=(path:string)=>handleRequest(new Request('https://benchmarkregistry.org'+path),f.env,repository);
  return {build,repository,render};
}
const store=(objects:Map<string,string>)=>({get:async(key:string)=>objects.get(key.replace(/^objects\//u,''))??null});
const apiPaths=['/api/home-panels','/api/stats','/api/models','/api/models?sort=name&order=desc','/api/models?sort=released&order=asc&limit=100','/api/models?sort=published&order=desc','/api/models?company=openai&q=gpt','/api/models?page=2','/api/models/10001','/api/models/10001?view=history&sort=source&order=desc','/api/models/10001?q=gpqa','/api/benchmarks','/api/benchmarks?sort=released&order=asc','/api/benchmarks?sort=version&order=desc&q=g','/api/benchmarks/gpqa','/api/benchmarks/gpqa/diamond','/api/benchmarks/gpqa/diamond?view=history&company=openai&q=gpt&sort=registry_no&order=desc','/api/companies','/api/companies?sort=established&order=desc','/api/companies?sort=latest_model&order=asc&q=anth','/api/companies/openai?view=history&sort=reported_at&order=asc','/api/search?q=gpt','/api/search?q=GPQA','/api/search?q=10001','/api/search?q=GPT-4.1%20GPQA','/api/search?q=%25','/api/models/99999','/api/models?sort=score'];
async function expectEquivalentApi(f:ReturnType<typeof fixture>,render:(path:string)=>Promise<Response>) {
  for(const path of apiPaths) {
    const original=await canonical.fetch(new Request('https://benchmarkregistry.org'+path),{...f.env,DB:f.db});
    const response=await render(path);
    expect(response.status,path).toBe(original.status);
    expect(await response.json(),path).toEqual(await original.json());
  }
}
it('preserves API query/search/sort/pagination/status semantics without D1 reads at render time',async()=>{
  const f=fixture();const {build,render}=await project(f);
  expect((await verifyGeneration(store(build.objects),build.manifest)).objects).toBeGreaterThan(25);
  await expectEquivalentApi(f,render);
  expect(f.env.DB!.prepare).not.toHaveBeenCalled();
});
it('preserves initial HTML, hydration payload, SEO and approved/ambiguous exact-result states',async()=>{
  const f=fixture();const {build,render}=await project(f);
  const evidence=await verifyGeneration(store(build.objects),build.manifest);
  const paths=['/','/models','/models/10001','/benchmarks','/benchmarks/gpqa','/benchmarks/gpqa/diamond','/companies','/companies/openai','/models/99999','/models?sort=score','/sitemap.xml'];
  const key=f.sqlite.prepare('SELECT r.result_key,b.slug,bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id LIMIT 1').get() as {result_key:string;slug:string;version_slug:string};
  paths.push(`/benchmarks/${key.slug}/${key.version_slug}?view=history&result=${key.result_key}`);
  for(const path of paths) {
    const original=await canonical.fetch(new Request('https://benchmarkregistry.org'+path),{...f.env,DB:f.db});const response=await render(path);
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
  expect(f.env.DB!.prepare).not.toHaveBeenCalled();
});
it('features the latest reported score from model history, never the highest',async()=>{
  const f=fixture();
  const original=f.sqlite.prepare(`SELECT r.* FROM results r JOIN models m ON m.id=r.model_id
    JOIN metrics metric ON metric.id=r.metric_id WHERE m.registry_no='10001' AND metric.unit='percent' ORDER BY r.id LIMIT 1`).get() as Record<string,string|number|null>;
  f.sqlite.prepare("UPDATE results SET score_value='99',score_raw='99%',reported_at='2010-01-01',reported_precision='date' WHERE id=?").run(original.id);
  const id=Number((f.sqlite.prepare('SELECT max(id) AS n FROM results').get() as {n:number}).n)+1;
  const newer={...original,id,result_key:'f'.repeat(64),run_ref:'featured-score-newer-run',score_value:'1',score_raw:'1%',reported_at:'2030-01-01',reported_precision:'date'};
  f.sqlite.exec('BEGIN');
  f.sqlite.prepare(`INSERT INTO results(${Object.keys(newer).join(',')}) VALUES(${Object.keys(newer).map(()=>'?').join(',')})`).run(...Object.values(newer));
  f.sqlite.prepare('INSERT INTO result_evaluators SELECT ?,evaluator_organization_id FROM result_evaluators WHERE result_id=?').run(id,original.id);
  f.sqlite.exec('COMMIT');
  const {render}=await project(f);
  const body=await (await render('/api/models?q=10001')).json() as ModelListResponse;
  expect(body.data[0].featured_result).toMatchObject({result_key:'f'.repeat(64),score:{value:'1',display:'1.0%'}});
  const history=await new RegistryRepository(f.db).model('10001',{page:1,limit:500,view:'history'});
  expect(body.data[0].featured_result).toEqual(latestReportedResult(history.data.results));
});
it.each([
  ["UPDATE models SET canonical_name='GPT fixture corrected',normalized_name='gpt fixture corrected' WHERE registry_no='10001'"],
  ["UPDATE companies SET name='OpenAI corrected',normalized_name='openai corrected' WHERE slug='openai'"],
  ["UPDATE benchmarks SET canonical_name='GPQA corrected',normalized_name='gpqa corrected' WHERE slug='gpqa'"],
  ["UPDATE benchmark_versions SET version='Diamond corrected' WHERE id=(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.slug='gpqa' AND bv.version_slug='diamond')"],
])('metadata corrections project equivalently to direct reads (%s)',async(sql)=>{
  const f=fixture();f.sqlite.exec(sql);
  const {repository,render}=await project(f);
  await expectEquivalentApi(f,render);
  expect(await repository.sitemapPaths()).toEqual(await new RegistryRepository(f.db).sitemapPaths());
});
it('orders homepage additions by insertion when backfilling an old result',async()=>{
  const f=fixture();
  const original=f.sqlite.prepare('SELECT * FROM results ORDER BY id LIMIT 1').get() as Record<string,string|number|null>;
  const id=Number((f.sqlite.prepare('SELECT max(id) AS n FROM results').get() as {n:number}).n)+1;
  const row={...original,id,result_key:'e'.repeat(64),run_ref:'homepage-backfill',reported_at:'2010-01-01',reported_precision:'date'};
  f.sqlite.exec('BEGIN');
  f.sqlite.prepare(`INSERT INTO results(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`).run(...Object.values(row));
  f.sqlite.prepare('INSERT INTO result_evaluators SELECT ?,evaluator_organization_id FROM result_evaluators WHERE result_id=?').run(id,original.id);
  f.sqlite.exec('COMMIT');
  const {render}=await project(f);
  const panels=await (await render('/api/home-panels')).json() as import('./home-panels').HomePanels;
  expect(panels.latest_additions[0]).toMatchObject({result_key:row.result_key,reported_at:'2010-01-01'});
  expect(panels.latest_additions).toHaveLength(5);
  const coverage=panels.explore_benchmarks.find(entry=>entry.benchmark.slug===panels.latest_additions[0].benchmark.slug)!;
  const counts=f.sqlite.prepare(`SELECT count(DISTINCT r.model_id) AS models,count(*) AS results FROM results r
    JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id
    WHERE b.slug=? AND NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=r.model_id)`).get(coverage.benchmark.slug) as {models:number;results:number};
  expect(coverage).toMatchObject({model_count:counts.models,result_count:counts.results});
});
it('fails the build when a projected object is missing or corrupt',async()=>{
  const f=fixture();const {build}=await project(f);
  const objects=new Map(build.objects);objects.set(build.manifest.objects['model:10001'],'corrupt');
  await expect(verifyGeneration(store(objects),build.manifest)).rejects.toThrow('Missing/corrupt materialization: model:10001');
  objects.delete(build.manifest.objects.models);
  await expect(verifyGeneration(store(objects),build.manifest)).rejects.toThrow('Missing/corrupt materialization');
});
