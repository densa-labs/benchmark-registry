import { digest, validateManifest, validateObject, type ReadManifest, type ReadObject } from './read-model';
import type { ReadData } from './read-model';
/** Reads a generation's serialized objects by `objects/<hash>`. */
export interface ProducerStore {get(key:string):Promise<string|null>}
export async function verifyGeneration(store:ProducerStore,manifest:ReadManifest) {
  validateManifest(manifest,manifest.environment);
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
