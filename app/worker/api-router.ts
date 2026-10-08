import { jsonError } from "./api";
import { logZeroSearch } from "./diagnostics";
import type { RegistryReader } from "./materialized-repository";
import { apiParameters } from "./request-policy";
import { comparisonPayload } from "./seo-comparisons";

/** Read-only API routes over one pinned registry reader. The static site runs these in the browser. */
export async function handleApi(request: Request, revision: string | undefined, repository: RegistryReader): Promise<Response> {
  if (request.method !== "GET") return jsonError(404, "not_found", "API route not found.");
  const {path, params} = apiParameters(new URL(request.url));
  if (path.length === 2 && path[1] === "revision") return Response.json({revision:revision});
  if (path.length === 3 && path[1] === "comparisons") {
    const snapshot=await repository.seoSnapshot();
    const pair=snapshot.comparisons.find(pair=>pair.path===`/compare/${path[2]}`);
    if(!pair) return jsonError(404,"not_found","Comparison not found.");
    return Response.json(await comparisonPayload(repository,pair,snapshot));
  }
  if (path.length === 2 && path[1] === "comparisons") return Response.json({data:await repository.comparisons()});
  if (path.length === 2 && path[1] === "stats") return Response.json(await repository.stats());
  if (path.length === 2 && path[1] === "recent") return Response.json((await repository.seoSnapshot()).recent);
  if (path.length === 2 && path[1] === "home-panels") return Response.json(await repository.homePanels());
  if (path.length === 2 && path[1] === "models") return Response.json(await repository.models(params));
  if (path.length === 3 && path[1] === "models") return Response.json(await repository.model(path[2],params));
  if (path.length === 2 && path[1] === "benchmarks") return Response.json(await repository.benchmarks(params));
  if (path.length === 3 && path[1] === "benchmarks") return Response.json(await repository.benchmark(path[2]));
  if (path.length === 4 && path[1] === "benchmarks") return Response.json(await repository.benchmarkVersion(path[2],path[3],params));
  if (path.length === 2 && path[1] === "companies") return Response.json(await repository.companies(params));
  if (path.length === 3 && path[1] === "companies") return Response.json(await repository.company(path[2],params));
  if (path.length === 2 && path[1] === "search") {
    const result=await repository.search(params);
    if(result.page.total_items===0) logZeroSearch(new URL(request.url).searchParams.get("q") ?? "");
    return Response.json(result);
  }
  return jsonError(404, "not_found", "API route not found.");
}
