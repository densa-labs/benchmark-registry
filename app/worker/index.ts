import { ApiError, jsonError } from "./api";
import { parseParameters } from "./params";
import { RegistryRepository } from "./repository";
import { documentMetadata, rewriteMetadata, escapeHtml, PRODUCTION_ORIGIN } from "./metadata";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  STAGING_CRAWLER_PROTECTION?: "enabled";
}

const STAGING_HOSTNAME = "staging.benchmarkregistry.org";
const WWW_HOSTNAME = "www.benchmarkregistry.org";
const APEX_HOSTNAME = "benchmarkregistry.org";
const STAGING_ROBOTS = "User-agent: *\nDisallow: /\n";
const STAGING_ROBOTS_TAG = "noindex, nofollow, noarchive";

const MODEL_SORTS = ["name", "released", "published", "company", "registry_no"];
const BENCHMARK_SORTS = ["name", "released", "version"];
const COMPANY_SORTS = ["name", "established", "latest_model"];
const RESULT_SORTS = [
  "benchmark",
  "model",
  "company",
  "source",
  "registry_no",
  "reported_at",
];

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

async function handleApi(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return jsonError(404, "not_found", "API route not found.");
  const url = new URL(request.url);
  const path = url.pathname.split("/").filter(Boolean).map(decodeSegment);
  const repository = new RegistryRepository(env.DB);

  if (path.length === 2 && path[1] === "stats") {
    parseParameters(url.searchParams, { allowed: [] });
    return Response.json(await repository.stats());
  }

  if (path.length === 2 && path[1] === "models") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q", "company", "sort", "order"],
      sorts: MODEL_SORTS,
    });
    return Response.json(await repository.models(params));
  }
  if (path.length === 3 && path[1] === "models") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q", "sort", "order", "view"],
      sorts: RESULT_SORTS,
    });
    return Response.json(await repository.model(path[2], params));
  }
  if (path.length === 2 && path[1] === "benchmarks") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q", "sort", "order"],
      sorts: BENCHMARK_SORTS,
    });
    return Response.json(await repository.benchmarks(params));
  }
  if (path.length === 3 && path[1] === "benchmarks") {
    parseParameters(url.searchParams, { allowed: [] });
    return Response.json(await repository.benchmark(path[2]));
  }
  if (path.length === 4 && path[1] === "benchmarks") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q", "company", "sort", "order", "view", "result"],
      sorts: RESULT_SORTS,
    });
    return Response.json(await repository.benchmarkVersion(path[2], path[3], params));
  }
  if (path.length === 2 && path[1] === "companies") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q", "sort", "order"],
      sorts: COMPANY_SORTS,
    });
    return Response.json(await repository.companies(params));
  }
  if (path.length === 3 && path[1] === "companies") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q", "sort", "order", "view"],
      sorts: RESULT_SORTS,
    });
    return Response.json(await repository.company(path[2], params));
  }
  if (path.length === 2 && path[1] === "search") {
    const params = parseParameters(url.searchParams, {
      allowed: ["page", "limit", "q"],
      requireQuery: true,
    });
    return Response.json(await repository.search(params));
  }
  return jsonError(404, "not_found", "API route not found.");
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    try {
      return await handleApi(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        return jsonError(error.status, error.code, error.message);
      }
      console.error("Read API request failed.", error);
      return jsonError(500, "internal_error", "The request could not be completed.");
    }
  }

  if (request.method === "GET" || request.method === "HEAD") {
    try {
      const registryNo = modelPageRegistryNo(pathname);
      if (registryNo !== null) {
        const target = await new RegistryRepository(env.DB).modelRedirectTarget(registryNo);
        if (target !== null) {
          url.pathname = `/models/${target}`;
          return Response.redirect(url.toString(), 308);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return new Response("Invalid model route.", { status: error.status });
      }
      console.error("Model route redirect lookup failed.", error);
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
      const paths = await new RegistryRepository(env.DB).sitemapPaths();
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeHtml(PRODUCTION_ORIGIN + path)}</loc></url>`).join('')}</urlset>\n`;
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    } catch (error) {
      console.error('Sitemap data lookup failed.', error);
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
    const metadata = await documentMetadata(url, new RegistryRepository(env.DB));
    if (metadata.canonical && url.pathname !== new URL(metadata.canonical).pathname) {
      url.pathname = new URL(metadata.canonical).pathname;
      return Response.redirect(url.toString(), 308);
    }
    const html = rewriteMetadata(await response.text(), metadata, url);
    const headers = new Headers(response.headers);
    // The static template's validators and length no longer describe this response.
    for (const header of ["ETag", "Content-Length", "Last-Modified", "Content-Encoding"]) headers.delete(header);
    headers.set("Cache-Control", "no-store");
    return new Response(request.method === "HEAD" ? null : html, {
      status: metadata.status ?? response.status, headers,
    });
  } catch (error) {
    console.error("Document metadata lookup failed.", error);
    return new Response("The request could not be completed.", { status: 500 });
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === WWW_HOSTNAME || (url.hostname === APEX_HOSTNAME && url.protocol === "http:")) {
      url.hostname = APEX_HOSTNAME;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }
    const protectStaging = env.STAGING_CRAWLER_PROTECTION === "enabled"
      && url.hostname === STAGING_HOSTNAME;

    const response = protectStaging && url.pathname === "/robots.txt"
      ? new Response(request.method === "HEAD" ? null : STAGING_ROBOTS, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
      : await handleRequest(request, env);

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
