import type { SeoSnapshot } from "./seo-data";
import type { BenchmarkFamilyResponse, BenchmarkListResponse, BenchmarkVersionResponse, CompanyDetailResponse, CompanyListResponse, ModelDetailResponse, ModelListResponse } from '../src/registry';
import type { ResultRow } from './api';
import { HOME_PANEL_LIMIT, type HomePanels } from './home-panels';
import type { SearchEntity } from './search';
import type { SearchRelationship } from './search-response';
import type { FeaturedResult } from './featured-result';
export type ReadEnvironment='staging'|'production'|'local';
export type ReadData={
  seo:SeoSnapshot;
  'home-panels':HomePanels;
  models:{response:ModelListResponse;fields:{identity:string;name:string;company:string;released:string;aliases:string}[]};
  benchmarks:{response:BenchmarkListResponse;fields:{identity:string;released:string}[]};
  companies:{response:CompanyListResponse;fields:{identity:string;established:string|null}[]};
  model:{response:ModelDetailResponse;fields:ResultFields[]};
  family:BenchmarkFamilyResponse;
  version:{response:BenchmarkVersionResponse;fields:ResultFields[]};
  company:{response:CompanyDetailResponse;fields:ResultFields[]};
  stats:{data:{benchmark_results:number;models:number;benchmarks:number;versions:number}};
  redirects:{source:string;target:string}[];
  inventory:string[];
  'search-entities':SearchEntity[];
  'search-relationships':SearchRelationship[];
  /** Static-site only: each listed model's featured result, so model lists need no per-model reads. */
  featured:Record<string,FeaturedResult|null>;
};
export interface ResultFields {identity:string;latest:number;reported:string;source:string;aliases:string}
export interface ReadObject {schema:1;key:string;environment:ReadEnvironment;data:unknown}
export interface ReadManifest {
  projectionVersion?:number;
  schema:1;environment:ReadEnvironment;generation:string;canonicalRevision:string;
  watermark:number;createdAt:string;objects:Record<string,string>;
}
export const logicalKind=(key:string)=>key.startsWith('model:')?'model':key.startsWith('family:')?'family':key.startsWith('version:')?'version':key.startsWith('company:')?'company':key;
export const validKey=(key:string)=>['seo','models','benchmarks','companies','stats','home-panels','redirects','inventory','search-entities','search-relationships'].includes(key) || /^(model:[0-9]+|company:[a-z0-9-]+|family:[a-z0-9-]+|version:[a-z0-9-]+:[a-z0-9._-]+)$/u.test(key);
export async function digest(text:string) {return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
export class MaterializationFailure extends Error {}
export function validateManifest(value:unknown,environment:ReadEnvironment):asserts value is ReadManifest {
  const m=value as ReadManifest;
  if(!m || m.schema!==1 || m.environment!==environment || !/^[a-f0-9]{32}$/u.test(m.generation) || !/^[a-f0-9]{32}$/u.test(m.canonicalRevision) || !Number.isSafeInteger(m.watermark) || m.watermark<0 || !Number.isFinite(Date.parse(m.createdAt)) || !m.objects || Array.isArray(m.objects)) throw new MaterializationFailure('Invalid read manifest.');
  for(const [key,hash] of Object.entries(m.objects)) if(!validKey(key) || !/^[a-f0-9]{64}$/u.test(hash)) throw new MaterializationFailure('Invalid manifest reference.');
  for(const key of ['models','benchmarks','companies','stats','redirects','inventory','search-entities','search-relationships']) if(!m.objects[key]) throw new MaterializationFailure('Incomplete read manifest.');
  if(!m.objects.seo) throw new MaterializationFailure('Incomplete read manifest.');
}
export function validateObject(value:unknown,key:string,environment:ReadEnvironment):asserts value is ReadObject {
  const o=value as ReadObject;
  if(!o || o.schema!==1 || o.key!==key || o.environment!==environment || !validKey(key) || o.data===undefined) throw new MaterializationFailure('Invalid read object identity.');
  const kind=logicalKind(key),d=o.data as Record<string,unknown>;
  if(['models','benchmarks','companies','model','version','company'].includes(kind)) {
    const response=d.response as {data:unknown;page?:{number:number;total_items:number};};
    const fields=d.fields as {identity:string}[];
    if(!response?.data || !Array.isArray(fields) || new Set(fields.map(field=>field.identity)).size!==fields.length) throw new MaterializationFailure('Invalid read projection.');
    if(Array.isArray(response.data)) {
      if(response.page?.number!==1 || response.page.total_items!==response.data.length) throw new MaterializationFailure('Incomplete index.');
    } else {
      const data=response.data as {model?:{registry_no:string};company?:{slug:string};version?:{benchmark:{slug:string};version_slug:string};results:ResultRow[];result_page:{number:number;total_items:number}};
      if(!Array.isArray(data.results) || data.result_page?.number!==1 || data.result_page.total_items!==data.results.length || data.results.length!==fields.length) throw new MaterializationFailure('Incomplete result set.');
      if(kind==='model' && data.model?.registry_no!==key.split(':')[1] || kind==='company' && data.company?.slug!==key.split(':')[1] || kind==='version' && `${data.version?.benchmark.slug}:${data.version?.version_slug}`!==key.slice(8)) throw new MaterializationFailure('Wrong entity identity.');
      const identities=new Set(fields.map(field=>field.identity));
      for(const row of data.results) if(!/^[a-f0-9]{64}$/u.test(row.result_key) || !identities.has(row.result_key) || row.exact_result_href!==null && !row.exact_result_href.endsWith(`result=${row.result_key}`)) throw new MaterializationFailure('Invalid result reference.');
    }
  } else if(kind==='seo') {
    if(!d.pages || !Array.isArray(d.models)) throw new MaterializationFailure('Invalid SEO projection.');
  } else if(kind==='home-panels') {
    const panels=o.data as HomePanels;
    if(!Array.isArray(panels.explore_benchmarks) || !Array.isArray(panels.latest_additions)
      || panels.explore_benchmarks.length>HOME_PANEL_LIMIT || panels.latest_additions.length>HOME_PANEL_LIMIT
      || panels.explore_benchmarks.some(row=>!row.benchmark?.slug || !Number.isSafeInteger(row.model_count) || row.model_count<0 || !Number.isSafeInteger(row.result_count) || row.result_count<row.model_count)
      || panels.latest_additions.some(row=>!/^[a-f0-9]{64}$/u.test(row.result_key))) throw new MaterializationFailure('Invalid homepage panels.');
  } else if(kind==='family') {
    const data=(d.data as {benchmark:{slug:string};versions:unknown[]});
    if(data?.benchmark?.slug!==key.slice(7) || !Array.isArray(data.versions)) throw new MaterializationFailure('Invalid benchmark family.');
  } else if(['redirects','inventory','search-entities','search-relationships'].includes(kind) && !Array.isArray(o.data)) throw new MaterializationFailure('Invalid read collection.');
  else if(kind==='stats' && (!(d.data as Record<string,unknown>) || Object.values(d.data as Record<string,unknown>).some(v=>!Number.isSafeInteger(v) || Number(v)<0))) throw new MaterializationFailure('Invalid stats.');
}
