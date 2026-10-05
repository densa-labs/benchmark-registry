import type { SearchEntity } from "./search";
import type { SearchRelationship } from "./search-response";
import { normalizeSearch } from "./params";
import { pageMetadata } from "./api";
import type { ParsedListParams } from "./params";
const expression=/(brand|benchmark|record|model|metric|date|org):(?:"([^"]+)"|([^\s]+))/giu;
const text=(value:string|null|undefined)=>value ?? "";
/** Newest report first, then model, benchmark, version, metric and reasoning names; never the result_key hash. */
function byReportedThenName(a:SearchRelationship,b:SearchRelationship,models:Map<number,SearchEntity>,benchmarks:Map<number,SearchEntity>):number {
  const reported=text(b.reported_at).slice(0,10).localeCompare(text(a.reported_at).slice(0,10),"en");
  if(reported) return reported;
  for(const [left,right] of [[models.get(a.model_id)?.canonical_name,models.get(b.model_id)?.canonical_name],[benchmarks.get(a.benchmark_id)?.canonical_name,benchmarks.get(b.benchmark_id)?.canonical_name],
    [a.version,b.version],[a.metric_name,b.metric_name],[a.reasoning_level,b.reasoning_level]]) {
    const comparison=normalizeSearch(text(left)).localeCompare(normalizeSearch(text(right)),"en");
    if(comparison) return comparison;
  }
  return 0;
}
export async function operatorSearch(params:ParsedListParams,entities:SearchEntity[],relationships:(models:number[],benchmarks:number[])=>Promise<SearchRelationship[]>) {
  const query=params.q ?? "",operators=[...query.matchAll(expression)].map(match=>({key:match[1].toLowerCase(),value:normalizeSearch(match[2] ?? match[3])}));
  if(!operators.length) return null;
  const free=normalizeSearch(query.replace(expression,"").trim());
  const matches=(value:string|undefined,part:string)=>normalizeSearch(value ?? "").includes(part);
  const nameMatches=(entity:SearchEntity,part:string)=>[entity.canonical_name,...entity.aliases,entity.href].some(value=>matches(value,part));
  const models=entities.filter(entity=>entity.entity_type==="model" && operators.filter(op=>op.key==="model").every(op=>nameMatches(entity,op.value)));
  const benchmarks=entities.filter(entity=>entity.entity_type==="benchmark" && operators.filter(op=>op.key==="benchmark").every(op=>nameMatches(entity,op.value)));
  const rows=models.length && benchmarks.length ? await relationships(models.map(model=>model.id),benchmarks.map(benchmark=>benchmark.id)) : [];
  const modelMap=new Map(models.map(model=>[model.id,model])),benchmarkMap=new Map(benchmarks.map(benchmark=>[benchmark.id,benchmark]));
  const hits=rows.filter(row=>operators.every(op=>op.key==="record" ? row.result_key.includes(op.value)
    : op.key==="metric" ? matches(row.metric_name,op.value) || matches(row.metric_key,op.value)
    : op.key==="date" ? row.reported_at?.startsWith(op.value)
    // brand: is an alias of org:, the model's company.
    : op.key==="org" || op.key==="brand" ? matches(row.provider_name,op.value) || matches(row.provider_slug,op.value)
    : true)).filter(row=>!free || [modelMap.get(row.model_id)?.canonical_name,benchmarkMap.get(row.benchmark_id)?.canonical_name,row.version,row.reasoning_level,row.configuration_label ?? undefined].some(value=>matches(value,free)))
    .sort((a,b)=>byReportedThenName(a,b,modelMap,benchmarkMap)).map(row=>({entity_type:"result" as const,
      canonical_name:`${modelMap.get(row.model_id)!.canonical_name} × ${benchmarkMap.get(row.benchmark_id)!.canonical_name} ${row.version}`,
      matched_text:[row.metric_name,row.reported_at?.slice(0,10),row.reasoning_level,row.configuration_label].filter(Boolean).join(" · "),
      href:`${benchmarkMap.get(row.benchmark_id)!.href}/${row.version_slug}?view=history&result=${row.result_key}#BR-${row.result_key}`,
    }));
  return {direct_href:undefined as string|undefined,data:hits.slice((params.page-1)*params.limit,params.page*params.limit),page:pageMetadata(params.page,params.limit,hits.length)};
}
