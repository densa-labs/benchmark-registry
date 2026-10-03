import type { ModelSummary, ResultRow } from "../worker/api";
export const MAX_COMPARISON_PAIRS = 100;
export const MIN_SHARED_BENCHMARKS = 3;
export interface ComparisonPair {path:string;models:[string,string];sharedBenchmarks:number}
const slug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/gu,"-").replace(/^-|-$/gu,"");
const version=(model:ModelSummary)=>{
  const match=/^(.*?)(\d+(?:\.\d+)*)(.*)$/u.exec(model.name);
  return match ? {family:JSON.stringify([model.company.slug,match[1].trim().toLowerCase(),match[3].trim().toLowerCase()]),number:match[2].split(".").map(Number)} : null;
};
/** Conservative numbered-family pairs; provider flagship status is not recorded. */
export function generateComparisonPairs(models:ModelSummary[],results:ResultRow[]):ComparisonPair[] {
  const groups=new Map<string,ModelSummary[]>();
  for(const model of models) {
    const parsed=version(model);if(!parsed) continue;
    const list=groups.get(parsed.family) ?? [];list.push(model);groups.set(parsed.family,list);
  }
  const coverage=new Map<string,Map<string,Set<string>>>();
  for(const row of results) {
    const family=coverage.get(row.model.registry_no) ?? new Map<string,Set<string>>();
    const contexts=family.get(row.benchmark.slug) ?? new Set<string>();
    contexts.add(JSON.stringify([row.benchmark_version_slug,row.metric.key,row.metric.unit,row.metric.storage_kind]));
    family.set(row.benchmark.slug,contexts);coverage.set(row.model.registry_no,family);
  }
  const pairs:ComparisonPair[]=[];
  for(const [,group] of [...groups].sort(([a],[b])=>a.localeCompare(b,"en"))) {
    group.sort((a,b)=>{
      const x=version(a)!.number,y=version(b)!.number;
      for(let index=0;index<Math.max(x.length,y.length);index++) {const d=(x[index] ?? 0)-(y[index] ?? 0);if(d) return d;}
      return a.registry_no.localeCompare(b.registry_no,"en");
    });
    for(let index=1;index<group.length;index++) {
      const [a,b]=[group[index-1],group[index]];
      if(JSON.stringify(version(a)!.number)===JSON.stringify(version(b)!.number)) continue;
      const left=coverage.get(a.registry_no),right=coverage.get(b.registry_no);
      const shared=[...(left?.entries() ?? [])].filter(([family,contexts])=>[...contexts].some(context=>right?.get(family)?.has(context))).length;
      if(shared<MIN_SHARED_BENCHMARKS) continue;
      pairs.push({path:`/compare/${slug(a.name)}-vs-${slug(b.name)}`,models:[a.registry_no,b.registry_no],sharedBenchmarks:shared});
    }
  }
  return pairs.slice(0,MAX_COMPARISON_PAIRS);
}
