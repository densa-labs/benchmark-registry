// Bounded local snapshot comparison; this never requests public routes or rereads remote D1.
import {RegistryRepository} from './repository';
import {MaterializedRepository,type RegistryReader} from './materialized-repository';
import {apiParameters} from './request-policy';
import type {GenerationBuild} from './materializer';
import {validateObject,type ReadData} from './read-model';
function stable(value:unknown):string {if(Array.isArray(value)) return '['+value.map(stable).join(',')+']';if(value && typeof value==='object') return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>JSON.stringify(key)+':'+stable(v)).join(',')+'}';return JSON.stringify(value);}
async function request(reader:RegistryReader,path:string) {
  const {path:parts,params}=apiParameters(new URL('https://registry.invalid/api'+path));
  if(parts[1]==='models') return parts.length===2?reader.models(params):reader.model(parts[2],params);
  if(parts[1]==='companies') return parts.length===2?reader.companies(params):reader.company(parts[2],params);
  if(parts[1]==='benchmarks') return parts.length===2?reader.benchmarks(params):parts.length===3?reader.benchmark(parts[2]):reader.benchmarkVersion(parts[2],parts[3],params);
  if(parts[1]==='search') return reader.search(params);
  if(parts[1]==='home-panels') return reader.homePanels();
  return reader.stats();
}
export async function shadowGeneration(db:D1Database,build:GenerationBuild) {
  const objectData=<K extends keyof ReadData>(key:string):ReadData[K]=>{
    const hash=build.manifest.objects[key],inline=build.manifest.inlineObjects[hash],text=build.objects.get(hash);
    if(!inline && !text) throw new Error('Full shadow projection is unavailable.');
    const object:unknown=inline ?? JSON.parse(text!);validateObject(object,key,build.manifest.environment);
    return object.data as ReadData[K];
  };
  const materialized=new MaterializedRepository(build.manifest,async<K extends keyof ReadData>(key:string)=>objectData<K>(key));
  const canonical=new RegistryRepository(db);
  const keys=Object.keys(build.manifest.objects),model=keys.includes('model:10005')?'10005':keys.find(k=>k.startsWith('model:'))!.slice(6),company=keys.includes('company:openai')?'openai':keys.find(k=>k.startsWith('company:'))!.slice(8),family=keys.includes('family:gpqa')?'gpqa':keys.find(k=>k.startsWith('family:'))!.slice(7),versionKey=keys.includes('version:gpqa:diamond')?'version:gpqa:diamond':keys.find(k=>k.startsWith('version:'))!,version=versionKey.split(':').slice(1).join('/');
  const paths=['/stats','/home-panels',`/models/${model}`,`/companies/${company}`,`/benchmarks/${family}`,`/benchmarks/${version}`];
  for(const [route,sorts] of [['models',['name','released','published','company','registry_no']],['benchmarks',['name','released','version']],['companies',['name','established','latest_model']]] as const) {
    paths.push('/'+route,'/'+route+'?page=2','/'+route+'?limit=100','/'+route+'?limit=500','/'+route+'?q=g');
    for(const sort of sorts) for(const order of ['asc','desc']) paths.push(`/${route}?sort=${sort}&order=${order}`);
  }
  for(const route of [`/models/${model}`,`/companies/${company}`,`/benchmarks/${version}`]) {
    paths.push(route+'?view=history',route+'?q=gpqa',route+'?view=history&limit=100',route+'?view=history&page=2');
    for(const sort of ['benchmark','model','company','registry_no','reported_at','source']) for(const order of ['asc','desc']) paths.push(route+`?sort=${sort}&order=${order}`);
  }
  paths.push(`/models?company=${company}`,`/benchmarks/${version}?company=${company}`,`/benchmarks/${version}?view=history&company=${company}&q=g`);
  for(const query of ['gpt','GPQA','10001','GPT-6 Astra GPQA','gpt 6','%','healthbench','openai']) paths.push('/search?q='+encodeURIComponent(query));
  const versionObject=objectData<'version'>(versionKey);
  const unique=versionObject.response.data.results.find(r=>r.exact_result_href!==null),ambiguous=versionObject.response.data.results.find(r=>r.exact_result_href===null);
  for(const row of [unique,ambiguous].filter(Boolean)) if(row) paths.push(`/benchmarks/${version}?view=history&result=${row.result_key}`);
  for(const path of paths) {
    const a=await request(canonical,path),b=await request(materialized,path);
    if(stable(a)!==stable(b)) throw new Error(`Materialized shadow mismatch: ${path.split('?')[0]}`);
  }
  if(stable(await canonical.sitemapPaths())!==stable(await materialized.sitemapPaths())) throw new Error('Materialized sitemap mismatch.');
  return {comparisons:paths.length+1,equivalent:true};
}
