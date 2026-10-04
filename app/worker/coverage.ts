import { measuredDatabase, type QueryMetrics } from "./query-metrics";
import { ApiError } from "./api";
import type { CoverageData, CoverageOptions } from "../src/coverage-data";
export interface CoverageEnvironment { DB?: D1Database; COVERAGE_MODELS?: string; COVERAGE_BENCHMARKS?: string; COVERAGE_STALE_DAYS?: string }
export function coverageOptions(url: URL, env: CoverageEnvironment): CoverageOptions {
  for(const key of url.searchParams.keys()) if(!["models","benchmarks","days"].includes(key) || url.searchParams.getAll(key).length!==1) throw new ApiError(400,"invalid_query","Invalid coverage option.");
  const number=(key:string,fallback:string,max:number)=>{
    const value=url.searchParams.get(key) ?? fallback;
    if(!/^[1-9][0-9]*$/u.test(value) || Number(value)>max) throw new ApiError(400,"invalid_query",`Coverage ${key} must be between 1 and ${max}.`);
    return Number(value);
  };
  return {models:number("models",env.COVERAGE_MODELS ?? "25",100),benchmarks:number("benchmarks",env.COVERAGE_BENCHMARKS ?? "15",50),days:number("days",env.COVERAGE_STALE_DAYS ?? "90",3650)};
}
export const COVERAGE_MODEL_SQL = `WITH recent AS (
  SELECT m.registry_no, m.canonical_name AS name, c.name AS provider, c.slug AS provider_slug,
    substr(m.release_at,1,10) AS released,
    row_number() OVER (PARTITION BY c.id ORDER BY substr(m.release_at,1,10) DESC, m.normalized_name, m.registry_no) AS provider_rank
  FROM models m JOIN companies c ON c.id=m.company_id
  WHERE NOT EXISTS (SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=m.id)
) SELECT registry_no,name,provider,provider_slug FROM recent ORDER BY provider_rank,released DESC,name,registry_no LIMIT ?`;
export async function queryCoverage(db: D1Database, options: CoverageOptions): Promise<CoverageData> {
  const [models, benchmarks, providers, timestamps] = await Promise.all([
    db.prepare(COVERAGE_MODEL_SQL).bind(options.models).all<CoverageData["models"][number]>(),
    db.prepare(`SELECT b.slug,b.canonical_name AS name,count(r.id) AS records FROM benchmarks b
      JOIN benchmark_versions bv ON bv.benchmark_id=b.id JOIN results r ON r.benchmark_version_id=bv.id
      JOIN models m ON m.id=r.model_id WHERE NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=m.id)
      GROUP BY b.id ORDER BY records DESC,b.normalized_name,b.slug LIMIT ?`).bind(options.benchmarks).all<CoverageData["benchmarks"][number]>(),
    db.prepare(`SELECT c.slug,c.name,count(DISTINCT m.id) AS models,count(DISTINCT bv.benchmark_id) AS benchmarks,count(r.id) AS records
      FROM companies c LEFT JOIN models m ON m.company_id=c.id AND NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=m.id)
      LEFT JOIN results r ON r.model_id=m.id LEFT JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id
      GROUP BY c.id ORDER BY c.normalized_name,c.slug`).all<CoverageData["providers"][number]>(),
    db.prepare(`SELECT max(checked) AS updated FROM (
      SELECT primary_source_checked_at AS checked FROM results UNION ALL SELECT source_checked_at FROM models
      UNION ALL SELECT source_checked_at FROM benchmarks UNION ALL SELECT source_checked_at FROM benchmark_versions)`).first<{updated:string|null}>(),
  ]);
  const updated=timestamps?.updated ?? null;
  const cells:CoverageData["cells"]=[];
  if(models.results.length && benchmarks.results.length) {
    const modelSlots=models.results.map(()=>"?").join(","),benchmarkSlots=benchmarks.results.map(()=>"?").join(",");
    const rows=await db.prepare(`WITH ranked AS (
      SELECT m.registry_no,b.slug,r.result_key,bv.version_slug,
        row_number() OVER (PARTITION BY m.id,b.id ORDER BY substr(r.reported_at,1,10) DESC,r.result_key) AS rank
      FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id
      JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.registry_no IN (${modelSlots}) AND b.slug IN (${benchmarkSlots})
    ) SELECT registry_no,slug,result_key,version_slug FROM ranked WHERE rank=1`).bind(...models.results.map(row=>row.registry_no),...benchmarks.results.map(row=>row.slug)).all<CoverageData["cells"][number]>();
    cells.push(...rows.results);
  }
  const stale=updated ? (await db.prepare(`SELECT b.slug,b.canonical_name AS name,max(substr(r.reported_at,1,10)) AS newest
    FROM benchmarks b JOIN benchmark_versions bv ON bv.benchmark_id=b.id JOIN results r ON r.benchmark_version_id=bv.id
    JOIN models m ON m.id=r.model_id WHERE NOT EXISTS(SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id=m.id)
    GROUP BY b.id HAVING julianday(?) - julianday(newest) > ? ORDER BY newest,b.slug`).bind(updated,options.days).all<CoverageData["stale"][number]>()).results : [];
  return {options,updated,models:models.results,benchmarks:benchmarks.results,cells,providers:providers.results,stale};
}

const coverageCache=new WeakMap<D1Database,Map<string,{expires:number;data:Promise<CoverageData>}>>();
/** Bounded isolate-local cache; failures are evicted, no durable/visitor state. */
export async function cachedCoverage(db:D1Database,options:CoverageOptions,metrics?:QueryMetrics):Promise<CoverageData> {
  let cache=coverageCache.get(db);if(!cache) {cache=new Map();coverageCache.set(db,cache);}
  const key=JSON.stringify(options),now=Date.now(),cached=cache.get(key);
  if(cached && cached.expires>now) return cached.data;
  cache.delete(key);
  const data=queryCoverage(measuredDatabase(db,metrics),options);
  cache.set(key,{expires:now+60_000,data});
  if(cache.size>32) cache.delete(cache.keys().next().value!);
  try {return await data;} catch(error) {if(cache.get(key)?.data===data) cache.delete(key);throw error;}
}
