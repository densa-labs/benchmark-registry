import { ApiError, pageMetadata, type ResultRow } from './api';
import { normalizeSearch, type ParsedListParams } from './params';
import type { RegistryRepository } from './repository';
import { searchResponse } from './search-response';
import type { ReadData, ReadManifest, ResultFields } from './read-model';
import { latestReportedResult, type FeaturedResult } from './featured-result';
export type RegistryReader=Pick<RegistryRepository,'seoSnapshot'|'modelRedirectTarget'|'metadataModel'|'metadataCompany'|'metadataBenchmark'|'metadataResult'|'sitemapPaths'|'stats'|'homePanels'|'models'|'model'|'benchmarks'|'benchmark'|'benchmarkVersion'|'companies'|'company'|'search'>;
const binary=(a:string|null,b:string|null)=>{
  if(a===b) return 0;if(a===null) return -1;if(b===null) return 1;
  const x=Array.from(a),y=Array.from(b);
  for(let i=0;i<Math.min(x.length,y.length);i++) {const difference=x[i].codePointAt(0)!-y[i].codePointAt(0)!;if(difference) return difference;}
  return x.length-y.length;
};
const direction=(p:ParsedListParams)=>p.order==='desc'?-1:1;
const text=(v:string)=>normalizeSearch(v);
const match=(query:string,...names:string[])=>names.some(name=>name.includes(query));
function page<T>(rows:T[],p:ParsedListParams) {return {data:rows.slice((p.page-1)*p.limit,p.page*p.limit),page:pageMetadata(p.page,p.limit,rows.length)};}

export class MaterializedRepository implements RegistryReader {
  private featuredResults = new Map<string, Promise<FeaturedResult | null>>();
  constructor(readonly manifest:ReadManifest,private readonly read:<K extends keyof ReadData>(key:string)=>Promise<ReadData[K]>) {}
  private get<K extends keyof ReadData>(key:string):Promise<ReadData[K]> {if(!this.manifest.objects[key]) throw new ApiError(404,'not_found',key.startsWith('model:')?'Model not found.':key.startsWith('company:')?'Company not found.':key.startsWith('family:')?'Benchmark not found.':'Benchmark version not found.');return this.read<K>(key);}
  async modelRedirectTarget(no:string) {return (await this.get<'redirects'>('redirects')).find(row=>row.source===no)?.target ?? null;}
  async seoSnapshot() {return this.get<'seo'>('seo');}
  async stats() {return this.get<'stats'>('stats');}
  async homePanels() {return this.get<'home-panels'>('home-panels');}
  async sitemapPaths() {return this.get<'inventory'>('inventory');}
  async metadataModel(no:string) {
    if(!this.manifest.objects[`model:${no}`]) return null;
    const {model}= (await this.get<'model'>(`model:${no}`)).response.data;
    return {name:model.name,company_name:model.company.name,company_slug:model.company.slug,registry_no:model.registry_no};
  }
  async metadataCompany(slug:string) {return this.manifest.objects[`company:${slug}`]?{name:(await this.get<'company'>(`company:${slug}`)).response.data.company.name}:null;}
  async metadataBenchmark(slug:string,version?:string) {
    const key=version===undefined?`family:${slug}`:`version:${slug}:${version}`;
    if(!this.manifest.objects[key]) return null;
    if(version===undefined) return {...(await this.get<'family'>(key)).data.benchmark,version:null,evaluator_names:[]};
    const {data}= (await this.get<'version'>(key)).response;
    return {...data.version.benchmark,version:data.version.version,evaluator_names:data.evaluator_names};
  }
  async metadataResult(slug:string,version:string,result:string) {
    const key=`version:${slug}:${version}`;
    if(!this.manifest.objects[key]) return null;
    const rows=(await this.get<'version'>(key)).response.data.results;
    const row=rows.find(row=>row.result_key===result);
    return row ? {name:row.model.name,company_name:row.model.company.name,registry_no:row.model.registry_no,company_slug:row.model.company.slug,retained_count:rows.filter(peer=>peer.model.registry_no===row.model.registry_no).length,exact_result_indexable:row.exact_result_href===null?0:1,score_raw:row.score.raw,primary_source_url:row.primary_source_url,reasoning_level:row.reasoning_level ?? ''} : null;
  }
  async models(p:ParsedListParams) {
    const o=await this.get<'models'>('models'),fields=new Map(o.fields.map(field=>[field.identity,field]));
    const rows=o.response.data.filter(row=>{
      const f=fields.get(row.registry_no)!;
      return (!p.company || row.company.slug===p.company) && (!p.q || match(p.q,f.name,row.registry_no,...JSON.parse(f.aliases) as string[]));
    });
    rows.sort((a,b)=>{
      const x=fields.get(a.registry_no)!,y=fields.get(b.registry_no)!;
      if(!p.sort) return -binary(x.released,y.released) || binary(x.name,y.name) || binary(a.registry_no,b.registry_no);
      const key=(row:typeof a,f:typeof x)=>p.sort==='name'?f.name:p.sort==='company'?f.company:p.sort==='released'?f.released:p.sort==='published'?row.published_at:row.registry_no;
      return direction(p)*binary(key(a,x),key(b,y)) || (p.sort==='published'?1:direction(p))*binary(a.registry_no,b.registry_no);
    });
    const response = page(rows,p);
    // Derive from the complete, current model projections, including history.
    // This also supports existing published generations without a data migration.
    const featured = this.manifest.objects.featured ? await this.read<'featured'>('featured') : undefined;
    const data = await Promise.all(response.data.map(async row => {
      if (!this.featuredResults.has(row.registry_no)) this.featuredResults.set(row.registry_no, featured && row.registry_no in featured
        ? Promise.resolve(featured[row.registry_no])
        : this.get<'model'>(`model:${row.registry_no}`).then(model => latestReportedResult(model.response.data.results)));
      return { ...row, featured_result: await this.featuredResults.get(row.registry_no)! };
    }));
    return { ...response, data };
  }
  async benchmarks(p:ParsedListParams) {
    const o=await this.get<'benchmarks'>('benchmarks'),fields=new Map(o.fields.map(field=>[field.identity,field]));
    const rows=o.response.data.filter(row=>!p.q || match(p.q,text(row.benchmark.name),...row.benchmark.aliases.map(text)));
    rows.sort((a,b)=>{const key=(row:typeof a)=>p.sort==='released'?fields.get(row.benchmark.slug)!.released:p.sort==='version'?row.latest_version:text(row.benchmark.name);return direction(p)*(binary(key(a),key(b)) || binary(a.benchmark.slug,b.benchmark.slug));});
    return page(rows,p);
  }
  async companies(p:ParsedListParams) {
    const o=await this.get<'companies'>('companies'),fields=new Map(o.fields.map(field=>[field.identity,field]));
    const rows=o.response.data.filter(row=>!p.q || text(row.name).includes(p.q));
    rows.sort((a,b)=>{const key=(row:typeof a)=>p.sort==='established'?fields.get(row.slug)!.established:p.sort==='latest_model'?row.latest_model?text(row.latest_model.name):null:text(row.name);return direction(p)*(binary(key(a),key(b)) || binary(a.slug,b.slug));});
    return page(rows,p);
  }
  private results(rows:ResultRow[],fields:ResultFields[],p:ParsedListParams,scope:'model'|'version'|'company',ignoreCompany=false) {
    const keys=new Map(fields.map(field=>[field.identity,field]));
    return rows.filter(row=>{
      const f=keys.get(row.result_key)!;
      const bench=match(p.q ?? '',text(row.benchmark.name),...row.benchmark.aliases.map(text));
      const model=match(p.q ?? '',text(row.model.name),row.model.registry_no,...JSON.parse(f.aliases) as string[]);
      return ((p.view ?? 'latest')==='history' || f.latest===1) && (!p.result || p.result===row.result_key) && (ignoreCompany || !p.company || p.company===row.model.company.slug) && (!p.q || (scope==='model'?bench:scope==='version'?model:bench || model));
    }).sort((a,b)=>{
      const x=keys.get(a.result_key)!,y=keys.get(b.result_key)!;
      if(!p.sort) return -binary(x.reported,y.reported) || binary(a.model.registry_no,b.model.registry_no) || binary(a.result_key,b.result_key);
      const key=(row:ResultRow,f:ResultFields)=>p.sort==='benchmark'?text(row.benchmark.name):p.sort==='model'?text(row.model.name):p.sort==='company'?text(row.model.company.name):p.sort==='source'?f.source:p.sort==='reported_at'?f.reported:row.model.registry_no;
      return direction(p)*(binary(key(a,x),key(b,y)) || binary(a.result_key,b.result_key));
    });
  }
  async model(no:string,p:ParsedListParams) {
    const target=await this.modelRedirectTarget(no) ?? no;
    const o=await this.get<'model'>(`model:${target}`),result=page(this.results(o.response.data.results,o.fields,p,'model'),p);
    return {data:{...o.response.data,redirected_from:target===no?null:no,results:result.data,result_page:result.page}};
  }
  async benchmark(slug:string) {return this.get<'family'>(`family:${slug}`);}
  async benchmarkVersion(slug:string,version:string,p:ParsedListParams) {
    const o=await this.get<'version'>(`version:${slug}:${version}`),data=o.response.data;
    const result=page(this.results(data.results,o.fields,p,'version'),p);
    const available=new Map(this.results(data.results,o.fields,p,'version',true).map(row=>[row.model.company.slug,row.model.company]));
    return {available_companies:[...available.values()].sort((a,b)=>binary(text(a.name),text(b.name)) || binary(a.slug,b.slug)),data:{...data,chart:data.chart ?? null,view:p.view ?? 'latest',company:p.company ?? null,results:result.data,result_page:result.page}};
  }
  async company(slug:string,p:ParsedListParams) {
    const o=await this.get<'company'>(`company:${slug}`),result=page(this.results(o.response.data.results,o.fields,p,'company'),p);
    return {data:{...o.response.data,results:result.data,result_page:result.page}};
  }
  async search(p:ParsedListParams) {
    return searchResponse(p,await this.get<'search-entities'>('search-entities'),async(models,benchmarks)=>(await this.get<'search-relationships'>('search-relationships')).filter(row=>models.includes(row.model_id) && benchmarks.includes(row.benchmark_id)));
  }
}
