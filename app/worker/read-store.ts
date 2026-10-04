import { digest, MaterializationFailure, validateManifest, validateObject, validatePublication, type GenerationRef, type Publication, type ReadData, type ReadEnvironment, type ReadManifest, type ReadObject } from './read-model';
import { MaterializedRepository } from './materialized-repository';
export interface ReadStoreEnvironment {READ_STORE?:KVNamespace;READ_ENVIRONMENT?:ReadEnvironment;REGISTRY_CACHE?:Cache;CACHE_WAIT_UNTIL?:(promise:Promise<unknown>)=>void}
// Verified reads are content-addressed and immutable, so one isolate may reuse them
// across requests instead of re-hashing and re-parsing them on every cold render.
export const VERIFIED_READ_BUDGET=8*1024*1024;
const deepFreeze=<T>(value:T):T=>{if(value && typeof value==='object' && !Object.isFrozen(value)) {Object.freeze(value);for(const child of Object.values(value)) deepFreeze(child);}return value;};
export class VerifiedReads {
  bytes=0;
  private entries=new Map<string,{value:unknown;size:number}>();
  constructor(readonly budget:number) {}
  get size() {return this.entries.size;}
  get(key:string):unknown {
    const entry=this.entries.get(key);if(!entry) return undefined;
    this.entries.delete(key);this.entries.set(key,entry);
    return entry.value;
  }
  set(key:string,value:unknown,size:number) {
    if(size>this.budget || this.entries.has(key)) return;
    for(const [oldest,entry] of this.entries) {if(this.bytes+size<=this.budget) break;this.entries.delete(oldest);this.bytes-=entry.size;}
    this.entries.set(key,{value:deepFreeze(value),size});this.bytes+=size;
  }
  clear() {this.entries.clear();this.bytes=0;}
}
export const verifiedReads=new VerifiedReads(VERIFIED_READ_BUDGET);
export class PublishedReadStore {
  reads=0;
  private memo=new Map<string,Promise<unknown>>();
  private cache:Cache|undefined;
  constructor(private readonly env:ReadStoreEnvironment,private readonly origin:string) {this.cache=env.REGISTRY_CACHE ?? (typeof caches==='undefined'?undefined:(caches as CacheStorage & {default:Cache}).default);}
  private async get(key:string,immutable=false,validate?:(text:string)=>Promise<void>):Promise<string|null> {
    const cacheKey=new Request(new URL('/__published_read__/'+encodeURIComponent(key),this.origin));
    if(immutable && this.cache) {try {const stored=await this.cache.match(cacheKey);if(stored) {const text=await stored.text();if(validate) await validate(text);return text;}} catch {/* KV remains the read source. */}}
    if(!this.env.READ_STORE) throw new MaterializationFailure('Materialized read store is unavailable.');
    this.reads++;
    const value=await this.env.READ_STORE.get(key,{type:'text',cacheTtl:immutable?86400:30});
    if(value && validate) await validate(value);
    if(value && immutable && this.cache) {
      const storing=this.cache.put(cacheKey,new Response(value,{headers:{'Cache-Control':'public, max-age=86400'}})).catch(()=>undefined);
      if(this.env.CACHE_WAIT_UNTIL) this.env.CACHE_WAIT_UNTIL(storing);else await storing;
    }
    return value;
  }
  async publication():Promise<Publication> {
    const environment=this.env.READ_ENVIRONMENT ?? 'local';
    for(const key of ['publication','last-good']) {
      try {const text=await this.get(key);if(!text) continue;const value:unknown=JSON.parse(text);validatePublication(value,environment);return value;} catch {/* Try independently retained last-known-good descriptor. */}
    }
    throw new MaterializationFailure('No valid published materialization.');
  }
  async repository(ref:GenerationRef):Promise<MaterializedRepository> {
    const environment=this.env.READ_ENVIRONMENT ?? 'local';
    const manifestKey='manifest:'+environment+':'+ref.hash;
    let manifest=verifiedReads.get(manifestKey) as ReadManifest|undefined;
    if(!manifest) {
      let parsed:ReadManifest|undefined;
      const text=await this.get('manifests/'+ref.hash,true,async(text)=>{
        if(await digest(text)!==ref.hash) throw new MaterializationFailure('Corrupt manifest.');
        const value:unknown=JSON.parse(text);validateManifest(value,environment);
        // Bundled objects are checked with their manifest, so a cached manifest never needs rechecking.
        for(const [hash,object] of Object.entries(value.inlineObjects)) if(await digest(JSON.stringify(object))!==hash) throw new MaterializationFailure('Corrupt coherent update bundle.');
        parsed=value;
      });
      if(!text || !parsed) throw new MaterializationFailure('Read manifest is missing or corrupt.');
      manifest=parsed;verifiedReads.set(manifestKey,manifest,text.length);
    }
    if(manifest.generation!==ref.generation) throw new MaterializationFailure('Generation identity mismatch.');
    return new MaterializedRepository(manifest,async<K extends keyof ReadData>(key:string)=>{
      const hash=manifest.objects[key];
      const memoKey=manifest.generation+':'+hash+':'+key;
      if(!this.memo.has(memoKey)) this.memo.set(memoKey,(async()=>{
        const verifiedKey='object:'+manifest.environment+':'+hash+':'+key;
        const verified=verifiedReads.get(verifiedKey);
        if(verified!==undefined) return verified;
        const inline=manifest.inlineObjects[hash];
        if(inline) return inline.data;
        let parsed:ReadObject|undefined;
        const text=await this.get('objects/'+hash,true,async(text)=>{
          if(await digest(text)!==hash) throw new MaterializationFailure('Corrupt object.');
          const object:unknown=JSON.parse(text);validateObject(object,key,manifest.environment);parsed=object;
        });
        if(!text || !parsed) throw new MaterializationFailure('Read object is missing or corrupt.');
        verifiedReads.set(verifiedKey,parsed.data,text.length);
        return parsed.data;
      })().catch(()=>{this.memo.delete(memoKey);throw new MaterializationFailure("Invalid or unavailable read object.");}));
      return this.memo.get(memoKey)! as Promise<ReadData[K]>;
    });
  }
}
