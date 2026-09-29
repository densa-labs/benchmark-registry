import { LEGAL_PATHS } from "../src/legal-content";
import { diagnoseWorkerFailure } from "./diagnostics";
import { renderDocument, renderFailureDocument, renderInitialDocument } from "./document";
import { ApiError, jsonError } from "./api";
import { apiParameters } from "./request-policy";
import { withRegistryCache, type CacheEnvironment } from "./cache";
import type { RegistryReader } from "./materialized-repository";
import { PublishedReadStore, type ReadStoreEnvironment } from "./read-store";
import { MaterializationFailure } from "./read-model";
import { documentMetadata, rewriteMetadata, escapeHtml, PRODUCTION_ORIGIN } from "./metadata";

export interface Env extends CacheEnvironment, ReadStoreEnvironment {
  ASSETS: Fetcher;
  STAGING_CRAWLER_PROTECTION?: "enabled";
}

const STAGING_HOSTNAME = "staging.benchmarkregistry.org";
const WWW_HOSTNAME = "www.benchmarkregistry.org";
const APEX_HOSTNAME = "benchmarkregistry.org";
const STAGING_ROBOTS = "User-agent: *\nDisallow: /\n";
const STAGING_ROBOTS_TAG = "noindex, nofollow, noarchive";

function modelPageRegistryNo(pathname: string): string | null {
  const match = /^\/models\/([^/]+)\/?$/u.exec(pathname);
  if (!match) return null;
  return decodeSegment(match[1]);
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new ApiError(400, "invalid_query", "Route contains invalid encoding.");
  }
}

async function handleApi(request: Request, env: Env, repository: RegistryReader): Promise<Response> {
  if (request.method !== "GET") return jsonError(404, "not_found", "API route not found.");
  const {path, params} = apiParameters(new URL(request.url));
  if (path.length === 2 && path[1] === "revision") return Response.json({revision:env.REGISTRY_REVISION});
  if (path.length === 2 && path[1] === "stats") return Response.json(await repository.stats());
  if (path.length === 2 && path[1] === "models") return Response.json(await repository.models(params));
  if (path.length === 3 && path[1] === "models") return Response.json(await repository.model(path[2],params));
  if (path.length === 2 && path[1] === "benchmarks") return Response.json(await repository.benchmarks(params));
  if (path.length === 3 && path[1] === "benchmarks") return Response.json(await repository.benchmark(path[2]));
  if (path.length === 4 && path[1] === "benchmarks") return Response.json(await repository.benchmarkVersion(path[2],path[3],params));
  if (path.length === 2 && path[1] === "companies") return Response.json(await repository.companies(params));
  if (path.length === 3 && path[1] === "companies") return Response.json(await repository.company(path[2],params));
  if (path.length === 2 && path[1] === "search") return Response.json(await repository.search(params));
  return jsonError(404, "not_found", "API route not found.");
}

export async function handleRequest(request: Request, env: Env, repository?: RegistryReader): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    try {
      return await handleApi(request, env, requireRepository(repository));
    } catch (error) {
      if (error instanceof MaterializationFailure) throw error;
      if (error instanceof ApiError) {
        return jsonError(error.status, error.code, error.message);
      }
      diagnoseWorkerFailure("read-api");
      return jsonError(500, "internal_error", "The request could not be completed.");
    }
  }

  if (request.method === "GET" || request.method === "HEAD") {
    try {
      const registryNo = modelPageRegistryNo(pathname);
      if (registryNo !== null) {
        const target = await requireRepository(repository).modelRedirectTarget(registryNo);
        if (target !== null) {
          url.pathname = `/models/${target}`;
          return Response.redirect(url.toString(), 308);
        }
      }
    } catch (error) {
      if (error instanceof MaterializationFailure) throw error;
      if (error instanceof ApiError) {
        return new Response("Invalid model route.", { status: error.status });
      }
      diagnoseWorkerFailure("model-redirect");
      return new Response("The request could not be completed.", { status: 500 });
    }
  }

  if (['GET', 'HEAD'].includes(request.method) && pathname === '/robots.txt') {
    const body = url.hostname === APEX_HOSTNAME
      ? `User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n`
      : STAGING_ROBOTS;
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  if (['GET', 'HEAD'].includes(request.method) && pathname === '/sitemap.xml') {
    try {
      const paths = [...new Set([...await requireRepository(repository).sitemapPaths(), ...LEGAL_PATHS])];
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeHtml(PRODUCTION_ORIGIN + path)}</loc></url>`).join('')}</urlset>\n`;
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    } catch (error) {
      if (error instanceof MaterializationFailure) throw error;
      diagnoseWorkerFailure("sitemap");
      return new Response('The request could not be completed.', { status: 500 });
    }
  }

  const response = await env.ASSETS.fetch(request.method === "HEAD"
    ? new Request(request, { method: "GET" }) : request);
  if (!["GET", "HEAD"].includes(request.method)
    || !response.ok || !response.headers.get("Content-Type")?.includes("text/html")) {
    return request.method === "HEAD" ? new Response(null, {
      status: response.status, statusText: response.statusText, headers: response.headers,
    }) : response;
  }

  try {
    const metadata = await documentMetadata(url, repository);
    if (metadata.canonical && url.pathname !== new URL(metadata.canonical).pathname) {
      url.pathname = new URL(metadata.canonical).pathname;
      return Response.redirect(url.toString(), 308);
    }
    const content = metadata.status === 404 ? renderInitialDocument({ kind: "not-found" }, url.search) : await renderDocument(url, async (input) => {
      // SSR and public API share one pinned materialized generation.
      return handleApi(new Request(new URL(String(input), url.origin)), env, requireRepository(repository));
    }, env.REGISTRY_REVISION);
    const html = rewriteMetadata(await response.text(), metadata, url, content?.markup)
      .replace("</body>", `${content?.bootstrap ?? ""}</body>`);
    const headers = new Headers(response.headers);
    // The static template's validators and length no longer describe this response.
    for (const header of ["ETag", "Content-Length", "Last-Modified", "Content-Encoding"]) headers.delete(header);
    headers.set("Cache-Control", "no-store");
    return new Response(request.method === "HEAD" ? null : html, {
      status: metadata.status ?? response.status, headers,
    });
  } catch (error) {
    if (error instanceof MaterializationFailure) throw error;
    diagnoseWorkerFailure("document");
    return new Response("The request could not be completed.", { status: 500 });
  }
}

const worker = {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === WWW_HOSTNAME || (url.hostname === APEX_HOSTNAME && url.protocol === "http:")) {
      url.hostname = APEX_HOSTNAME;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }
    const protectStaging = env.STAGING_CRAWLER_PROTECTION === "enabled"
      && url.hostname === STAGING_HOSTNAME;

    env={...env,CACHE_WAIT_UNTIL:ctx?(promise)=>ctx.waitUntil(promise):undefined};
    const store=new PublishedReadStore(env,url.origin);
    let response:Response;
    const staticAsset=url.pathname.startsWith('/assets/') || url.pathname.startsWith('/favicon');
    if(staticAsset) response=await env.ASSETS.fetch(request);
    else if(url.pathname==='/robots.txt') response=new Response(request.method==='HEAD'?null:protectStaging?STAGING_ROBOTS:`User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
    else if (LEGAL_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) response=await handleRequest(request,env);
    else {
      try {
        const publication=await store.publication();
        let lastError:unknown;
        response=new Response('The materialized registry is temporarily unavailable.',{status:500});
        for(const [index,ref] of [publication.current,publication.previous].entries()) {
          if(!ref) continue;
          try {
            const readEnv={...env,REGISTRY_REVISION:ref.generation,REGISTRY_DEGRADED:index>0};
            response=await withRegistryCache(request,readEnv,async(cachedEnv,cacheRequest=request)=>handleRequest(cacheRequest,{...readEnv,...cachedEnv},await store.repository(ref)));
            lastError=undefined;break;
          } catch(error) {lastError=error;}
        }
        if(lastError) throw lastError;
      } catch {
        diagnoseWorkerFailure("materialized-read");
        if (url.pathname === '/api' || url.pathname.startsWith('/api/')) response=jsonError(500,'internal_error','The request could not be completed.');
        else if (url.pathname === '/sitemap.xml') response=new Response('The materialized registry is temporarily unavailable.',{status:500});
        else {
          const template = await env.ASSETS.fetch(new Request(new URL('/',url),{method:'GET'}));
          const failure = renderFailureDocument(url.search);
          const html = rewriteMetadata(await template.text(), { title: 'Registry temporarily unavailable | Benchmark Registry', description: 'The registry data could not be loaded. Try again shortly.', noindex: true }, url, failure.markup).replace('</body>',`${failure.bootstrap}</body>`);
          response=new Response(request.method === 'HEAD' ? null : html,{status:500,headers:{'Content-Type':'text/html; charset=utf-8'}});
        }
      }
    }

    const diagnostics = new Headers(response.headers);
    diagnostics.set("X-Registry-Read-Store-Reads",String(store.reads));
    diagnostics.set("X-Registry-D1-Queries", "0");
    diagnostics.set("X-Registry-D1-Rows", "0");
    diagnostics.set("Server-Timing", "d1;dur=0.00");
    if (url.pathname.startsWith("/assets/") && response.ok) diagnostics.set("Cache-Control", "public, max-age=31536000, immutable");
    if (response.status >= 400) diagnostics.set("Cache-Control", "no-store");
    response = new Response(response.body,{status:response.status,statusText:response.statusText,headers:diagnostics});
    const nonProduction = url.hostname !== APEX_HOSTNAME;
    const apiDocument = url.pathname === '/api' || url.pathname.startsWith('/api/');
    if (!protectStaging && !nonProduction && !apiDocument) return response;

    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", protectStaging || nonProduction ? STAGING_ROBOTS_TAG : "noindex, follow");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;

export default worker;

function requireRepository(repository?: RegistryReader): RegistryReader {
  if (!repository) throw new Error("Registry reader required for data route.");
  return repository;
}
