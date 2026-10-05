import { analyticsConfiguration, analyticsScript, type AnalyticsEnvironment } from "./analytics";
import { renderAtomFeed } from "./feed";
import { badgeResponse } from "./badge";
import type { QueryMetrics } from "./query-metrics";
import { coverageOptions, cachedCoverage, type CoverageEnvironment } from "./coverage";
import { recordedCorrections } from "./corrections-data";
import { CONTENT_PATHS } from "../src/content-metadata";
import { isIndexablePage } from "../src/seo";
import { CANONICAL_ORIGIN, CANONICAL_HOST } from "../src/seo-config";
import { LEGAL_PATHS } from "../src/legal-content";
import { logServerError } from "./diagnostics";
import { renderDocument, renderInitialDocument } from "./document";
import { ApiError, jsonError } from "./api";
import { handleApi as routeApi } from "./api-router";
import type { RegistryReader } from "./materialized-repository";
import { MaterializationFailure } from "./read-model";
import { legacyRedirect } from "./seo-redirects";
import { documentMetadata, rewriteMetadata, escapeHtml } from "./metadata";

/** What the static build hands the page renderer; see worker/static-site.ts. */
export interface Env extends CoverageEnvironment, AnalyticsEnvironment {
  ASSETS: Fetcher;
  /** The data generation the pages embed. */
  REGISTRY_REVISION?: string;
  D1_DIAGNOSTICS?: QueryMetrics;
  STAGING_CRAWLER_PROTECTION?: "enabled";
}

const handleApi=(request:Request,env:Env,repository:RegistryReader)=>routeApi(request,env.REGISTRY_REVISION,repository);

const STAGING_HOSTNAME = "staging.benchmarkregistry.org";
const APEX_HOSTNAME = CANONICAL_HOST;
const STAGING_ROBOTS = "User-agent: *\nDisallow: /\n";

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

export async function handleRequest(request: Request, env: Env, repository?: RegistryReader): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  if (pathname === "/feed.xml" && ["GET","HEAD"].includes(request.method)) {
    const snapshot=await requireRepository(repository).seoSnapshot();
    // Older snapshots remain readable; rematerialize before release for the
    // complete update projection, which includes updates to older records.
    const feed=renderAtomFeed(snapshot.feed ?? snapshot.recent,snapshot.pages["/"]?.updated);
    return new Response(request.method==="HEAD" ? null : feed,{headers:{"Content-Type":"application/atom+xml; charset=utf-8","Cache-Control":"public, max-age=60, stale-while-revalidate=300","X-Robots-Tag":"noindex"}});
  }
  if (pathname.startsWith("/badge/")) return badgeResponse(request,requireRepository(repository));
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    try {
      return await handleApi(request, env, requireRepository(repository));
    } catch (error) {
      if (error instanceof MaterializationFailure) throw error;
      if (error instanceof ApiError) {
        return jsonError(error.status, error.code, error.message);
      }
      logServerError("read-api",500,error,url.pathname);
      return jsonError(500, "internal_error", "The request could not be completed.");
    }
  }

  if (request.method === "GET" || request.method === "HEAD") {
    try {
      const legacy = await legacyRedirect(url, repository);
      if (legacy) { url.pathname=legacy; return Response.redirect(url.toString(),301); }

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
      logServerError("model-redirect",500,error,url.pathname);
      return new Response("The request could not be completed.", { status: 500 });
    }
  }

  if (['GET', 'HEAD'].includes(request.method) && pathname === '/robots.txt') {
    const body = url.hostname === APEX_HOSTNAME
      ? `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`
      : STAGING_ROBOTS;
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  if (['GET', 'HEAD'].includes(request.method) && pathname === '/sitemap.xml') {
    try {
      const snapshot=await requireRepository(repository).seoSnapshot();
      const paths = [...new Set([...await requireRepository(repository).sitemapPaths(), "/compare", "/recent", ...snapshot.comparisons.map(pair=>pair.path), ...LEGAL_PATHS, ...CONTENT_PATHS.filter(path=>path!=="/search")])]
        .filter(path=>!path.includes("?") && (["/", "/models", "/benchmarks", "/companies", "/compare", ...LEGAL_PATHS, ...CONTENT_PATHS.filter(path=>path!=="/search")].includes(path) || snapshot.pages[path] && isIndexablePage(snapshot.pages[path])));
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeHtml(CANONICAL_ORIGIN + path)}</loc>${snapshot.pages[path]?.updated ? `<lastmod>${escapeHtml(snapshot.pages[path].updated!)}</lastmod>` : ""}</url>`).join('')}</urlset>\n`;
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    } catch (error) {
      if (error instanceof MaterializationFailure) throw error;
      logServerError("sitemap",500,error,url.pathname);
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
    if (pathname.replace(/\/$/u, "") === "/coverage" && !env.DB) return new Response("Coverage is temporarily unavailable.",{status:503,headers:{"X-Robots-Tag":"noindex","Cache-Control":"no-store"}});
    const analytics = url.hostname === STAGING_HOSTNAME && env.STAGING_CRAWLER_PROTECTION === "enabled" ? null : analyticsConfiguration(env);
    const content = pathname.replace(/\/$/u, "") === "/privacy"
      ? renderInitialDocument({kind:"privacy", ...(analytics ? {analyticsEnabled:true} : {})},url.search,env.REGISTRY_REVISION)
      : pathname.replace(/\/$/u, "") === "/search"
      ? renderInitialDocument({kind:"search",payload:url.searchParams.has("q") ? await (async()=>{
          const response=await handleApi(new Request(new URL(`/api/search${url.search}`,url)),env,requireRepository(repository));
          if(!response.ok) throw new ApiError(400,"invalid_query","Invalid search query.");
          return await response.json() as import("../src/registry").SearchResponse;
        })() : {data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}},url.search,env.REGISTRY_REVISION)
      : pathname.replace(/\/$/u, "") === "/corrections" && env.DB
      ? renderInitialDocument({kind:"corrections",payload:await recordedCorrections(env.DB)},url.search,env.REGISTRY_REVISION)
      : pathname.replace(/\/$/u, "") === "/coverage" && env.DB
      ? renderInitialDocument({kind:"coverage",payload:await cachedCoverage(env.DB,coverageOptions(url,env),env.D1_DIAGNOSTICS)},url.search,env.REGISTRY_REVISION)
      : metadata.status === 404 ? renderInitialDocument({ kind: "not-found" }, url.search) : await renderDocument(url, async (input) => {
      // SSR and public API share one pinned materialized generation.
      return handleApi(new Request(new URL(String(input), url.origin)), env, requireRepository(repository));
    }, env.REGISTRY_REVISION, repository ? await repository.seoSnapshot() : undefined);
    const html = rewriteMetadata(await response.text(), metadata, url, content?.markup)
      .replace("</head>", `${analyticsScript(analytics)}</head>`)
      .replace("</body>", `${content?.bootstrap ?? ""}</body>`);
    const headers = new Headers(response.headers);
    // The static template's validators and length no longer describe this response.
    for (const header of ["ETag", "Content-Length", "Last-Modified", "Content-Encoding"]) headers.delete(header);
    headers.set("Cache-Control", metadata.status === 404 ? "no-store" : "public, max-age=60, stale-while-revalidate=300");
    return new Response(request.method === "HEAD" ? null : html, {
      status: metadata.status ?? response.status, headers,
    });
  } catch (error) {
    if (error instanceof MaterializationFailure) throw error;
    if (error instanceof ApiError) return new Response(error.message, {status:error.status,headers:{"X-Robots-Tag":"noindex","Cache-Control":"no-store"}});
    logServerError("document",500,error,url.pathname);
    return new Response("The request could not be completed.", { status: 500 });
  }
}

function requireRepository(repository?: RegistryReader): RegistryReader {
  if (!repository) throw new Error("Registry reader required for data route.");
  return repository;
}
