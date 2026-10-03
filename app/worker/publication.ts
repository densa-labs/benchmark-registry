import { canonicalState, type GenerationBuild } from './materializer';
import { digest, validateManifest, validateObject, validatePublication, type Publication, type ReadEnvironment, type ReadManifest, type ReadObject } from './read-model';
import type { ReadData } from './read-model';
export interface ProducerStore {get(key:string):Promise<string|null>;put(entries:{key:string;value:string;metadata?:{createdAt:string}}[]):Promise<void>}
export async function readPublication(store:ProducerStore,environment:ReadEnvironment) {
  const text=await store.get('publication');if(!text) return undefined;
  const value:unknown=JSON.parse(text);validatePublication(value,environment);return value;
}
export async function readManifest(store:ProducerStore,hash:string,environment:ReadEnvironment) {
  const text=await store.get('manifests/'+hash);if(!text || await digest(text)!==hash) throw new Error('Published manifest is missing or corrupt.');
  const value:unknown=JSON.parse(text);validateManifest(value,environment);return value;
}
export async function verifyGeneration(store:ProducerStore,manifest:ReadManifest) {
  validateManifest(manifest,manifest.environment);
  for(const [hash,object] of Object.entries(manifest.inlineObjects)) if(await digest(JSON.stringify(object))!==hash) throw new Error('Corrupt coherent update bundle.');
  const all=new Map<string,ReadObject>();
  const entries=Object.entries(manifest.objects);
  for(let start=0;start<entries.length;start+=16) await Promise.all(entries.slice(start,start+16).map(async([key,hash])=>{
    const text=await store.get('objects/'+hash);
    if(!text || await digest(text)!==hash) throw new Error(`Missing/corrupt materialization: ${key}`);
    const object:unknown=JSON.parse(text);validateObject(object,key,manifest.environment);all.set(key,object);
  }));
  const redirects=(all.get('redirects')!.data as ReadData['redirects']);
  const redirected=new Set(redirects.map(r=>r.source));
  const models=(all.get('models')!.data as ReadData['models']).response.data;
  const companies=(all.get('companies')!.data as ReadData['companies']).response.data;
  const benchmarks=(all.get('benchmarks')!.data as ReadData['benchmarks']).response.data;
  for(const model of models) if(!all.has(`model:${model.registry_no}`) || !all.has(`company:${model.company.slug}`)) throw new Error('Broken model reference.');
  for(const company of companies) if(!all.has(`company:${company.slug}`) || company.latest_model && !all.has(`model:${company.latest_model.registry_no}`)) throw new Error('Broken company reference.');
  for(const benchmark of benchmarks) if(!all.has(`family:${benchmark.benchmark.slug}`)) throw new Error('Broken benchmark reference.');
  for(const [key,object] of all) if(key.startsWith('family:')) {
    for(const version of (object.data as ReadData['family']).data.versions) if(!all.has(`version:${key.slice(7)}:${version.version_slug}`)) throw new Error('Broken family/version reference.');
  }
  for(const redirect of redirects) if(!all.has(`model:${redirect.target}`)) throw new Error('Broken redirect target.');
  const exact=new Set<string>(),resultKeys=new Set<string>();
  const resultReferences=new Map<string,{model:string;benchmark:string;version:string;displayVersion:string;reasoning:string|null}>();
  for(const [key,object] of all) {
    if(!key.startsWith('version:')) continue;
    const data=(object.data as ReadData['version']).response.data;
    for(const row of data.results) {
      if(!all.has(`model:${row.model.registry_no}`) && !redirected.has(row.model.registry_no) || !all.has(`company:${row.model.company.slug}`) || !all.has(`family:${row.benchmark.slug}`)) throw new Error('Broken result reference.');
      const eligible=data.results.filter(peer=>peer.model.registry_no===row.model.registry_no).length===1 && !redirected.has(row.model.registry_no);
      if(eligible !== (row.exact_result_href!==null)) throw new Error('Incorrect exact-result eligibility.');
      if(row.exact_result_href) exact.add(row.exact_result_href);
      if(resultKeys.has(row.result_key)) throw new Error('Duplicate result identity across versions.');
      resultKeys.add(row.result_key);
      resultReferences.set(row.result_key,{model:row.model.registry_no,benchmark:row.benchmark.slug,version:row.benchmark_version_slug,displayVersion:row.benchmark_version,reasoning:row.reasoning_level});
    }
  }
  // Homepage counts and citations must match this exact published generation.
  if(all.has('home-panels')) {
    const panels=all.get('home-panels')!.data as ReadData['home-panels'];
    const rows=[...all].filter(([key])=>key.startsWith('version:')).flatMap(([,object])=>(object.data as ReadData['version']).response.data.results);
    const resultRows=new Map(rows.map(row=>[row.result_key,row]));
    if(new Set(panels.explore_benchmarks.map(row=>row.benchmark.slug)).size!==panels.explore_benchmarks.length
      || new Set(panels.latest_additions.map(row=>row.result_key)).size!==panels.latest_additions.length) throw new Error('Duplicate homepage entries.');
    for(const entry of panels.explore_benchmarks) {
      const family=all.get(`family:${entry.benchmark.slug}`)?.data as ReadData['family']|undefined;
      const results=rows.filter(row=>row.benchmark.slug===entry.benchmark.slug && !redirected.has(row.model.registry_no));
      if(!family || JSON.stringify(entry.benchmark)!==JSON.stringify(family.data.benchmark)
        || entry.result_count!==results.length || entry.model_count!==new Set(results.map(row=>row.model.registry_no)).size) throw new Error('Inconsistent homepage benchmark coverage.');
    }
    for(const row of panels.latest_additions) {
      if(redirected.has(row.model.registry_no) || JSON.stringify(row)!==JSON.stringify(resultRows.get(row.result_key))) throw new Error('Inconsistent homepage result evidence.');
    }
  }
  const inventory=all.get('inventory')!.data as string[];
  if(new Set(inventory).size!==inventory.length || inventory.filter(path=>path.includes('?')).length!==exact.size || [...exact].some(path=>!inventory.includes(path))) throw new Error('Incorrect exact-result inventory.');
  const entities=all.get('search-entities')!.data as ReadData['search-entities'];
  const relations=all.get('search-relationships')!.data as ReadData['search-relationships'];
  const modelIds=new Set(entities.filter(e=>e.entity_type==='model').map(e=>e.id));
  const versions=new Map(entities.filter(e=>e.entity_type==='benchmark').flatMap(e=>e.versions.map(v=>[v.id,e.id] as const)));
  const modelsById=new Map(entities.filter(e=>e.entity_type==='model').map(e=>[e.id,e.href]));
  const benchmarksById=new Map(entities.filter(e=>e.entity_type==='benchmark').map(e=>[e.id,e.href]));
  if(relations.length!==resultKeys.size || new Set(relations.map(row=>row.result_key)).size!==relations.length || relations.some(row=>{
    const result=resultReferences.get(row.result_key);
    return !result || versions.get(row.version_id)!==row.benchmark_id || modelsById.get(row.model_id)!=='/models/'+result.model || benchmarksById.get(row.benchmark_id)!=='/benchmarks/'+result.benchmark || row.version_slug!==result.version || row.version!==result.displayVersion || (row.reasoning_level || null)!==result.reasoning;
  })) throw new Error('Inconsistent search relationships.');
  const stats=(all.get('stats')!.data as ReadData['stats']).data;
  if(stats.benchmark_results!==resultKeys.size || stats.models!==modelIds.size || stats.benchmarks!==benchmarks.length || stats.versions!==versions.size) throw new Error('Inconsistent materialized counts.');
  return {objects:all.size,bytes:[...all.values()].reduce((sum,o)=>sum+new TextEncoder().encode(JSON.stringify(o)).length,0),canonicalUrls:inventory.length,approvedExact:exact.size,ambiguous:resultKeys.size-exact.size};
}
export async function publishGeneration(store:ProducerStore,build:GenerationBuild,db:D1Database,previous?:Publication,expectedRevision=build.manifest.canonicalRevision,retryVerification?:(attempt:number,error:unknown)=>Promise<boolean>) {
  const createdAt=new Date().toISOString();
  // Immutable payloads may safely be retried; pointer remains unchanged until all validate.
  const writes:{key:string;value:string;metadata:{createdAt:string}}[]=[];
  const pending=[...build.objects];
  for(let start=0;start<pending.length;start+=16) {
    const checked=await Promise.all(pending.slice(start,start+16).map(async([hash,value])=>await store.get('objects/'+hash)===value?undefined:{key:'objects/'+hash,value,metadata:{createdAt}}));
    for(const entry of checked) if(entry) writes.push(entry);
  }
  if(writes.length) await store.put(writes);
  let evidence:Awaited<ReturnType<typeof verifyGeneration>>;
  for(let attempt=1;;attempt++) {
    try {evidence=await verifyGeneration(store,build.manifest);break;}
    catch(error) {if(!retryVerification || !await retryVerification(attempt,error)) throw error;}
  }
  const serialized=JSON.stringify(build.manifest);
  await store.put([{key:'manifests/'+build.manifestHash,value:serialized,metadata:{createdAt}}]);
  await readManifest(store,build.manifestHash,build.manifest.environment);
  const state=await canonicalState(db);
  if(state.revision!==expectedRevision) throw new Error('Canonical data changed before publication. Previous generation remains active.');
  const publication:Publication={schema:1,environment:build.manifest.environment,current:{generation:build.manifest.generation,hash:build.manifestHash},...(previous?{previous:previous.current}:{})};
  validatePublication(publication,build.manifest.environment);
  await store.put([{key:'last-good',value:JSON.stringify(previous ?? publication),metadata:{createdAt}}]);
  await store.put([{key:'publication',value:JSON.stringify(publication),metadata:{createdAt}}]);
  return {...evidence,generation:build.manifest.generation,canonicalRevision:build.manifest.canonicalRevision,rebuilt:build.rebuilt,removed:build.removed,objectWrites:writes.length,manifestWrites:1,pointerWrites:2};
}
export function garbageCandidates(entries:{key:string;createdAt?:string}[],protectedKeys:Set<string>,now=Date.now()) {
  return entries.filter(entry=>!protectedKeys.has(entry.key) && /^(objects|manifests)\//u.test(entry.key) && entry.createdAt && now-Date.parse(entry.createdAt)>14*86400_000).map(entry=>entry.key);
}
export async function protectedPublicationKeys(store:ProducerStore,environment:ReadEnvironment) {
  const protectedKeys=new Set(['publication','last-good']);
  for(const key of ['publication','last-good']) {
    const text=await store.get(key);if(!text) continue;
    const pointer:unknown=JSON.parse(text);validatePublication(pointer,environment);
    for(const ref of [pointer.current,pointer.previous].filter(Boolean)) {
      if(!ref) continue;
      protectedKeys.add('manifests/'+ref.hash);
      const manifest=await readManifest(store,ref.hash,environment);
      for(const hash of Object.values(manifest.objects)) protectedKeys.add('objects/'+hash);
    }
  }
  return protectedKeys;
}
export function rollbackBuild(previous:ReadManifest):GenerationBuild {
  const manifest={...previous,generation:crypto.randomUUID().replaceAll('-',''),createdAt:new Date().toISOString()};
  return {manifest,manifestHash:'',objects:new Map(),rebuilt:[],removed:[]};
}
