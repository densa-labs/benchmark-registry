import { operatorSearch } from "./search-operators";
import { pageMetadata } from './api';
import { interpretSearch, orderSearch, type SearchEntity } from './search';
import type { ParsedListParams } from './params';

export interface SearchRelationship {
  metric_key?:string; metric_name?:string; reported_at?:string; provider_name?:string; provider_slug?:string;
  model_id:number; benchmark_id:number; version_id:number; version:string;
  version_slug:string; reasoning_level:string; result_key:string;
}
export async function searchResponse(params:ParsedListParams, entities:SearchEntity[], relationships:(models:number[],benchmarks:number[])=>Promise<SearchRelationship[]>) {
  const operated=await operatorSearch(params,entities,relationships);if(operated) return operated;
  const {ranked,interpretations,readings}=interpretSearch(params.q!,entities);
  let directHref:string|undefined;
  if(interpretations.length) {
    const rows=await relationships([...new Set(readings.map(i=>i.model.id))],[...new Set(readings.map(i=>i.benchmark.id))]);
    // Results any reading of the query could mean, e.g. "swe-bench" as SWE-bench or SWE-bench Pro.
    const candidates=rows.filter(row=>readings.some(i=>i.model.id===row.model_id && i.benchmark.id===row.benchmark_id && (i.versionId===undefined || i.versionId===row.version_id)));
    const connected=rows.flatMap(row=>{
      const intent=interpretations.find(i=>i.model.id===row.model_id && i.benchmark.id===row.benchmark_id && (i.versionId===undefined || i.versionId===row.version_id));
      if(!intent) return [];
      return [{hit:{entity_type:'result' as const,canonical_name:`${intent.model.canonical_name} × ${intent.benchmark.canonical_name} ${row.version}`,matched_text:row.reasoning_level ? `Reasoning: ${row.reasoning_level}` : 'Evaluation result',href:`${intent.benchmark.href}/${row.version_slug}?view=history&result=${row.result_key}`},rank:intent.high?3:5}];
    });
    ranked.push(...connected);
    // Jump straight to a result only when exactly one candidate matches the query.
    if(interpretations.length===1 && interpretations[0].high && connected.length===1 && candidates.length===1 && !ranked.some(entry=>entry.rank<3)) directHref=connected[0].hit.href;
  }
  const hits=orderSearch(ranked);
  return {data:hits.slice((params.page-1)*params.limit,params.page*params.limit),page:pageMetadata(params.page,params.limit,hits.length),...(params.page===1 && directHref?{direct_href:directHref}:{})};
}
