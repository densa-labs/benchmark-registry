import { BUILD_ID, BUILD_TIMESTAMP } from '../src/build';
import { normalizedResource } from './request-policy';
export interface CacheEnvironment {
  CACHE_WAIT_UNTIL?:(promise:Promise<unknown>)=>void;REGISTRY_CACHE?:Cache;
  REGISTRY_REVISION?:string;REGISTRY_DEGRADED?:boolean;
}
export const OBJECT_SECONDS=86400;
export async function withRegistryCache(request:Request,env:CacheEnvironment,load:(env:CacheEnvironment,request?:Request)=>Promise<Response>):Promise<Response> {
  const cache=env.REGISTRY_CACHE ?? (typeof caches==='undefined'?undefined:(caches as CacheStorage & {default:Cache}).default);
  let resource:string|null=null;
  try {resource=normalizedResource(request);} catch {/* Preserve handler validation and statuses. */}
  const origin=new URL(request.url).origin;
  const key=resource && env.REGISTRY_REVISION ? new Request(new URL('/__registry_render__/'+encodeURIComponent(`${BUILD_ID}:${BUILD_TIMESTAMP}:${env.REGISTRY_REVISION}`)+'?resource='+encodeURIComponent(resource),origin)) : undefined;
  const decorate=(response:Response,state:string)=>{
    const headers=new Headers(response.headers);
    headers.set('X-Registry-Cache',env.REGISTRY_DEGRADED?'stale':state);
    if(env.REGISTRY_REVISION) headers.set('X-Registry-Revision',env.REGISTRY_REVISION);
    headers.set('Cache-Control',response.status===200 && !env.REGISTRY_DEGRADED && !response.headers.has('Set-Cookie') && !response.headers.get('Cache-Control')?.includes('private')?'public, max-age=60, must-revalidate':'no-store');
    return new Response(request.method==='HEAD'?null:response.body,{status:response.status,statusText:response.statusText,headers});
  };
  if(key && cache) {try {const stored=await cache.match(key);if(stored?.status===200) return decorate(stored,'hit');} catch {/* Only materialized upstream reads follow a miss. */}}
  const response=await load(env,request.method==='HEAD'?new Request(request,{method:'GET'}):request);
  if(key && cache && response.status===200 && !response.headers.has('Set-Cookie') && !response.headers.get('Cache-Control')?.includes('private')) {
    const headers=new Headers(response.headers);headers.set('Cache-Control',`public, max-age=${OBJECT_SECONDS}`);
    const storing=cache.put(key,new Response(response.clone().body,{status:200,headers})).catch(()=>undefined);
    if(env.CACHE_WAIT_UNTIL) env.CACHE_WAIT_UNTIL(storing);else await storing;
  }
  return decorate(response,key?'miss':'bypass');
}
