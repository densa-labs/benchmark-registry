// Projects the canonical tables into the read objects the static build renders from.
import { ApiError } from './api';
import type { ParsedListParams } from './params';
import { RegistryRepository } from './repository';
import { digest, logicalKind, validateManifest, validateObject, type ReadEnvironment, type ReadManifest, type ReadObject } from './read-model';
export const projectionVersion=7;
const params:ParsedListParams={page:1,limit:500,view:'history'};
const fixed=['seo','models','benchmarks','companies','stats','home-panels','redirects','inventory','search-entities','search-relationships'];
export async function canonicalState(db:D1Database) {
  const row=await db.prepare('SELECT token AS revision,(SELECT COALESCE(max(id),0) FROM registry_read_changes) AS watermark FROM registry_revision WHERE id=1').first<{revision:string;watermark:number}>();
  if(!row) throw new Error('Canonical materialization state is missing. Apply migrations first.');
  return row;
}
async function wholeList<T>(read:(p:ParsedListParams)=>Promise<{data:T[];page:{number:number;limit:50|100|500;total_items:number;total_pages:number}}>) {
  const response=await read(params);
  for(let page=2;page<=response.page.total_pages;page++) response.data.push(...(await read({...params,page})).data);
  return response;
}
async function wholeResults<T extends {data:{results:unknown[];result_page:{number:number;limit:50|100|500;total_items:number;total_pages:number}}}>(read:(p:ParsedListParams)=>Promise<T>) {
  const response=await read(params);
  for(let page=2;page<=response.data.result_page.total_pages;page++) response.data.results.push(...(await read({...params,page})).data.results);
  return response;
}
export async function produceObject(repository:RegistryRepository,key:string,environment:ReadEnvironment):Promise<ReadObject> {
  const kind=logicalKind(key),parts=key.split(':');
  let data:unknown;
  if(kind==='seo') data=await repository.seoSnapshot();
  else if(kind==='models') data={response:await wholeList(p=>repository.models(p)),fields:await repository.materializedFields('models')};
  else if(kind==='benchmarks') data={response:await wholeList(p=>repository.benchmarks(p)),fields:await repository.materializedFields('benchmarks')};
  else if(kind==='companies') data={response:await wholeList(p=>repository.companies(p)),fields:await repository.materializedFields('companies')};
  else if(kind==='model') data={response:await wholeResults(p=>repository.model(parts[1],p)),fields:await repository.materializedFields(key)};
  else if(kind==='company') data={response:await wholeResults(p=>repository.company(parts[1],p)),fields:await repository.materializedFields(key)};
  else if(kind==='version') data={response:await wholeResults(p=>repository.benchmarkVersion(parts[1],parts[2],p)),fields:await repository.materializedFields(key)};
  else if(kind==='family') data=await repository.benchmark(parts[1]);
  else if(kind==='stats') data=await repository.stats();
  else if(kind==='home-panels') data=await repository.homePanels();
  else if(kind==='redirects') data=await repository.materializedRedirects();
  else if(kind==='inventory') data=await repository.sitemapPaths();
  else if(kind==='search-entities') data=await repository.materializedSearchEntities();
  else if(kind==='search-relationships') data=await repository.materializedSearchRelationships();
  else throw new Error(`Unsupported logical key: ${key}`);
  const object:ReadObject={schema:1,key,environment,data};validateObject(object,key,environment);return object;
}
export interface GenerationBuild {manifest:ReadManifest;objects:Map<string,string>}
/** One full projection of the canonical tables; the static build renders every page from it. */
export async function buildGeneration(db:D1Database,environment:ReadEnvironment):Promise<GenerationBuild> {
  const state=await canonicalState(db);
  const keys=[...fixed,...(await db.prepare(`SELECT 'model:'||registry_no AS key FROM models m WHERE NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=m.id)
    UNION ALL SELECT 'company:'||slug FROM companies UNION ALL SELECT 'family:'||slug FROM benchmarks
    UNION ALL SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id ORDER BY key`).all<{key:string}>()).results.map(row=>row.key)];
  const refs:Record<string,string>={},objects=new Map<string,string>();
  // One repository per generation deduplicates canonical metadata reads.
  const repository=new RegistryRepository(db);
  for(const key of keys.filter(key=>key!=='inventory').concat('inventory')) {
    try {
      const serialized=JSON.stringify(await produceObject(repository,key,environment));
      const hash=await digest(serialized);
      objects.set(hash,serialized);refs[key]=hash;
    } catch(error) {
      if(!(error instanceof ApiError && error.status===404)) throw error;
    }
  }
  const after=await canonicalState(db);
  if(state.revision!==after.revision || state.watermark!==after.watermark) throw new Error('Canonical data changed during materialization; retry.');
  const manifest:ReadManifest={schema:1,projectionVersion,environment,generation:crypto.randomUUID().replaceAll('-',''),canonicalRevision:state.revision,watermark:state.watermark,createdAt:new Date().toISOString(),objects:refs};
  validateManifest(manifest,environment);
  return {manifest,objects};
}
