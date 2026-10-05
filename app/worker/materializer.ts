// Controlled producer entry point. This module is not imported by the public Worker.
import { ApiError } from './api';
import type { ParsedListParams } from './params';
import { RegistryRepository } from './repository';
import { digest, logicalKind, validateManifest, validateObject, type ReadData, type ReadEnvironment, type ReadManifest, type ReadObject } from './read-model';
export const projectionVersion=7;
export const INLINE_BUNDLE_LIMIT=512*1024;
export function inlineBundle(objects:Map<string,string>):Record<string,ReadObject> {
  const bytes=[...objects.values()].reduce((sum,value)=>sum+new TextEncoder().encode(value).length,0);
  // Large rebuilds use verified immutable objects. Keep tiny critical reads inline;
  // bounded incremental updates retain their coherent fallback bundle.
  return Object.fromEntries([...objects].map(([hash,value])=>[hash,JSON.parse(value) as ReadObject] as const).filter(([,object])=>bytes<=INLINE_BUNDLE_LIMIT || ["stats","redirects"].includes(object.key)));
}
export function needsMaterialization(previous:ReadManifest|undefined,state:{revision:string;watermark:number}):boolean {
  return previous?.projectionVersion!==projectionVersion || previous.canonicalRevision!==state.revision || previous.watermark!==state.watermark || !previous.objects["home-panels"] || !previous.objects.seo;
}
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
export interface GenerationBuild {manifest:ReadManifest;manifestHash:string;objects:Map<string,string>;rebuilt:string[];removed:string[]}
export async function buildGeneration(db:D1Database,environment:ReadEnvironment,previous?:ReadManifest,readPrevious?:(key:string)=>Promise<ReadObject>):Promise<GenerationBuild|null> {
  if(previous) validateManifest(previous,environment,true);
  const state=await canonicalState(db);
  if(!needsMaterialization(previous,state)) return null;
  const keys=previous?.projectionVersion===projectionVersion ? (await db.prepare('SELECT DISTINCT logical_key AS key FROM registry_read_changes WHERE id>? AND id<=? ORDER BY logical_key').bind(previous.watermark,state.watermark).all<{key:string}>()).results.map(row=>row.key) : [...fixed,...(await db.prepare(`SELECT 'model:'||registry_no AS key FROM models m WHERE NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=m.id)
    UNION ALL SELECT 'company:'||slug FROM companies UNION ALL SELECT 'family:'||slug FROM benchmarks
    UNION ALL SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id ORDER BY key`).all<{key:string}>()).results.map(row=>row.key)];
  // Refresh the small homepage projection with every canonical update. Also
  // bootstrap it for generations published before the panels were introduced.
  if(!keys.includes('seo')) keys.push('seo');
  if(!keys.includes('home-panels')) keys.push('home-panels');
  const refs={...previous?.objects},objects=new Map<string,string>(),rebuilt:string[]=[],removed:string[]=[];
  // One repository per generation deduplicates canonical metadata reads.
  const repository=new RegistryRepository(db);
  // Inventory consumes regenerated version projections instead of querying all results again.
  for(const key of keys.filter(key=>key!=='inventory').concat(keys.includes('inventory')?['inventory']:[])) {
    try {
      const oldInventory=key==='inventory' && previous ? previous.inlineObjects[previous.objects.inventory] ?? await readPrevious?.('inventory') : undefined;
      let object:ReadObject;
      if(oldInventory) {
        validateObject(oldInventory,'inventory',environment);
        const changedVersions=new Set(keys.filter(k=>k.startsWith('version:')).map(k=>'/benchmarks/'+k.split(':').slice(1).join('/')));
        const exact=(oldInventory.data as string[]).filter(path=>path.includes('?') && !changedVersions.has(path.split('?')[0]));
        for(const versionKey of keys.filter(k=>k.startsWith('version:') && refs[k])) {
          const serialized=objects.get(refs[versionKey]);
          const version=serialized?JSON.parse(serialized):previous!.inlineObjects[refs[versionKey]] ?? await readPrevious?.(versionKey);
          if(!version) throw new Error('Required prior version projection is unavailable.');
          for(const row of (version.data as ReadData['version']).response.data.results) if(row.exact_result_href) exact.push(row.exact_result_href);
        }
        const paths=Object.keys(refs).flatMap(k=>k.startsWith('model:')?['/models/'+k.slice(6)]:k.startsWith('company:')?['/companies/'+k.slice(8)]:k.startsWith('family:')?['/benchmarks/'+k.slice(7)]:k.startsWith('version:')?['/benchmarks/'+k.split(':').slice(1).join('/')]:[]);
        object={schema:1,key,environment,data:['/','/models','/benchmarks','/companies',...[...paths,...exact].sort()]};
        validateObject(object,key,environment);
      } else object=await produceObject(repository,key,environment);
      const serialized=JSON.stringify(object),hash=await digest(serialized);
      rebuilt.push(key);
      if(refs[key]!==hash || previous?.projectionVersion!==projectionVersion) objects.set(hash,serialized);
      refs[key]=hash;
    } catch(error) {
      if(error instanceof ApiError && error.status===404) {delete refs[key];removed.push(key);} else throw error;
    }
  }
  const after=await canonicalState(db);
  if(state.revision!==after.revision || state.watermark!==after.watermark) throw new Error('Canonical data changed during materialization; retry without publishing.');
  const manifest:ReadManifest={schema:1,projectionVersion,environment,generation:crypto.randomUUID().replaceAll('-',''),canonicalRevision:state.revision,watermark:state.watermark,createdAt:new Date().toISOString(),objects:refs,inlineObjects:inlineBundle(objects)};
  validateManifest(manifest,environment);
  return {manifest,manifestHash:await digest(JSON.stringify(manifest)),objects,rebuilt,removed};
}
