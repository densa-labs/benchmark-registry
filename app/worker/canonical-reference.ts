// Internal shadow/audit adapter; never deployed as a public serving entry point.
import { handleRequest, type Env as PublicEnv } from './index';
import { RegistryRepository } from './repository';
export type Env=PublicEnv & {DB:D1Database};
export default {async fetch(request:Request,env:Env) {
  const url=new URL(request.url);
  if(url.hostname==='www.benchmarkregistry.org' || url.hostname==='benchmarkregistry.org' && url.protocol==='http:') {url.hostname='benchmarkregistry.org';url.protocol='https:';return Response.redirect(url.toString(),308);}
  if(!env.DB) throw new Error('Canonical audit requires an explicit D1 adapter.');
  const response=await handleRequest(request,env,new RegistryRepository(env.DB));
  const headers=new Headers(response.headers);
  if(env.STAGING_CRAWLER_PROTECTION==='enabled' && url.hostname==='staging.benchmarkregistry.org' || url.hostname!=='benchmarkregistry.org') headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  else if(url.pathname.startsWith('/api/')) headers.set('X-Robots-Tag','noindex, follow');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};
