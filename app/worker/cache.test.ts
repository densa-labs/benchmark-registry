import {expect,it,vi} from 'vitest';
import {withRegistryCache,type CacheEnvironment} from './cache';
import {normalizedResource} from './request-policy';
class MemoryCache {
  entries=new Map<string,Response>();
  async match(key:Request) {return this.entries.get(key.url)?.clone();}
  async put(key:Request,response:Response) {this.entries.set(key.url,response.clone());}
}
const request=(path:string,hostname='benchmarkregistry.org',headers?:HeadersInit)=>new Request(`https://${hostname}${path}`,{headers});
const setup=()=>({REGISTRY_REVISION:'a'.repeat(32),REGISTRY_CACHE:new MemoryCache() as unknown as Cache});
it('normalizes safe API defaults and parameter permutations without changing HTML noindex state',()=>{
  expect(normalizedResource(request('/api/models?sort=name&order=asc&page=1&limit=50'))).toBe('/api/models?sort=name');
  expect(normalizedResource(request('/models?sort=name&page=1'))).toBe('/models?page=1&sort=name');
  expect(normalizedResource(request('/api/models?limit=100'))).not.toBe(normalizedResource(request('/api/models?limit=500')));
});
it.each(['/api/models?bad=1','/api/models?page=1&page=2','/api/models?order=asc','/api/models?sort=score','/api/models?limit=all'])('rejects %s before cache lookup',path=>expect(()=>normalizedResource(request(path))).toThrow());
it('reuses only the same published generation and environment',async()=>{
  const env=setup(),load=vi.fn(async()=>Response.json({data:['materialized']}));
  expect((await withRegistryCache(request('/models'),env,load)).headers.get('X-Registry-Cache')).toBe('miss');
  expect((await withRegistryCache(request('/models'),env,load)).headers.get('X-Registry-Cache')).toBe('hit');
  expect((await withRegistryCache(request('/models','staging.benchmarkregistry.org'),env,load)).headers.get('X-Registry-Cache')).toBe('miss');
  expect((await withRegistryCache(request('/models'),{...env,REGISTRY_REVISION:'b'.repeat(32)},load)).headers.get('X-Registry-Cache')).toBe('miss');
  expect(load).toHaveBeenCalledTimes(3);
});
it.each([400,404,500])('does not cache status %i',async status=>{
  const env=setup(),load=vi.fn(async()=>new Response('error',{status}));
  await withRegistryCache(request('/models'),env,load);await withRegistryCache(request('/models'),env,load);expect(load).toHaveBeenCalledTimes(2);
});
it('does not share arbitrary q or private cookies/authorization',async()=>{
  const env=setup(),load=vi.fn(async()=>Response.json({data:[]}));
  for(const req of [request('/api/search?q=gpt'),request('/models',undefined,{Authorization:'Bearer private'}),request('/models',undefined,{Cookie:'session=private'})]) {
    await withRegistryCache(req,env,load);await withRegistryCache(req,env,load);
  }
  expect(load).toHaveBeenCalledTimes(6);
});
it('does not wait for writes when execution context is present',async()=>{
  const env=setup(),pending:Promise<unknown>[]=[];
  vi.spyOn(env.REGISTRY_CACHE,'put').mockImplementation(()=>new Promise(()=>undefined));
  const response=await withRegistryCache(request('/models'),{...env,CACHE_WAIT_UNTIL:p=>pending.push(p)},async()=>Response.json({data:[]}));
  expect(response.status).toBe(200);expect(pending).toHaveLength(1);
});
it('HEAD cache-fills the GET body; degraded generations cannot renew browser freshness',async()=>{
  const env=setup(),load=vi.fn(async(_env:CacheEnvironment,req?:Request)=>{expect(req?.method).toBe('GET');return Response.json({data:['body']});});
  const head=await withRegistryCache(new Request('https://benchmarkregistry.org/models',{method:'HEAD'}),env,load);expect(await head.text()).toBe('');
  expect(await (await withRegistryCache(request('/models'),env,load)).json()).toEqual({data:['body']});expect(load).toHaveBeenCalledTimes(1);
  const stale=await withRegistryCache(request('/models'),{...env,REGISTRY_DEGRADED:true},load);expect(stale.headers.get('X-Registry-Cache')).toBe('stale');expect(stale.headers.get('Cache-Control')).toBe('no-store');
});
