import { ApiError } from "./api";
import { parseParameters, type ParsedListParams } from "./params";
import { parseComparisonState } from "../src/compare";

const resultSorts = ["benchmark", "model", "company", "source", "registry_no", "reported_at"];
export function apiParameters(url: URL): {path: string[]; params: ParsedListParams} {
  let path: string[];
  try { path = url.pathname.split("/").filter(Boolean).map(decodeURIComponent); }
  catch { throw new ApiError(400, "invalid_query", "Route contains invalid encoding."); }
  const entity = path[1];
  let allowed: string[];
  let sorts: string[] | undefined;
  if (path.length === 3 && entity === "comparisons") allowed = [];
  else if (path.length === 2 && ["stats", "revision", "home-panels", "recent"].includes(entity)) allowed = [];
  else if (path.length === 2 && entity === "search") allowed = ["page", "limit", "q"];
  else if (path.length === 2 && entity === "models") {
    allowed = ["page", "limit", "q", "company", "sort", "order"];
    sorts = ["name", "released", "published", "company", "registry_no"];
  } else if (path.length === 2 && entity === "benchmarks") {
    allowed = ["page", "limit", "q", "sort", "order"]; sorts = ["name", "released", "version"];
  } else if (path.length === 2 && entity === "companies") {
    allowed = ["page", "limit", "q", "sort", "order"]; sorts = ["name", "established", "latest_model"];
  } else if (path.length === 3 && entity === "benchmarks") allowed = [];
  else if (path.length === 3 && ["models", "companies"].includes(entity)) {
    allowed = ["page", "limit", "q", "sort", "order", "view"]; sorts = resultSorts;
  } else if (path.length === 4 && entity === "benchmarks") {
    allowed = ["page", "limit", "q", "company", "sort", "order", "view", "result"]; sorts = resultSorts;
  } else throw new ApiError(404, "not_found", "API route not found.");
  return {path, params: parseParameters(url.searchParams, {allowed, sorts, requireQuery:entity === "search"})};
}

export function normalizedResource(request: Request): string | null {
  const url = new URL(request.url);
  if (!["GET", "HEAD"].includes(request.method)) return null;
  if (request.headers.has("Authorization")) return null;
  // Access authenticates before this public read-only Worker. Other cookies are private.
  const cookies = request.headers.get("Cookie")?.split(";").map((s) => s.trim().split("=")[0]) ?? [];
  if (cookies.some((name) => name !== "CF_Authorization" || url.hostname !== "staging.benchmarkregistry.org")) return null;
  if (url.pathname.startsWith("/api/")) {
    // API HEAD is not supported by the existing contract.
    if (request.method !== "GET") return null;
    const {path, params} = apiParameters(url);
    if (params.q !== undefined) return null;
    url.pathname = "/" + path.map(encodeURIComponent).join("/");
    for (const key of ["page", "limit", "view", "order"]) {
      if (url.searchParams.get(key) === ({page:"1",limit:"50",view:"latest",order:"asc"} as Record<string,string>)[key]) url.searchParams.delete(key);
    }
  } else {
    // HTML defaults affect noindex and must stay distinct. Only parameter order merges.
    const api = new URL(url);
    api.pathname = "/api" + url.pathname.replace(/\/$/u, "");
    if (url.pathname === "/compare" || url.pathname === "/compare/") parseComparisonState(url.search);
    else if (url.pathname !== "/" && !["/robots.txt", "/sitemap.xml"].includes(url.pathname)) apiParameters(api);
    else if (url.searchParams.size) return null;
    if (url.searchParams.has("q")) return null;
  }
  url.searchParams.sort();
  url.hash = "";
  return url.pathname + url.search;
}
