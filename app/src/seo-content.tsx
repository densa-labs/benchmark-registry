import type { BenchmarkVersionSummary, ModelSummary, ResultRow } from "../worker/api";
import type { SeoSnapshot } from "../worker/seo-data";
import type { LoadedRegistryRoute } from "./registry";
import { formatRegistryDate } from "./registry";
import { benchmarkVersionLabel } from "./benchmark-names";
import { DataTable, SourceLink, type TableColumn } from "./ui/components";
export interface SeoContent {
  sentence: string;
  updated?: string;
  related?: ModelSummary[];
  top?: ResultRow[];
  latest?: BenchmarkVersionSummary;
  links?: Array<{name:string;path:string}>;
}
export function enrichSeoContent(loaded:LoadedRegistryRoute,snapshot:SeoSnapshot):LoadedRegistryRoute {
  const kind=loaded.kind;
  loaded={...loaded,updated:snapshot.pages["/"]?.updated};
  if(kind!=="model" && kind!=="benchmark" && kind!=="company") return loaded;
  const path=kind==="model" ? `/models/${loaded.payload.data.model.registry_no}` : kind==="benchmark" ? `/benchmarks/${loaded.payload.data.benchmark.slug}` : `/companies/${loaded.payload.data.company.slug}`;
  const page=snapshot.pages[path];if(!page) return loaded;
  const updated=page.updated?.slice(0,10);
  const ending=updated ? ` Updated ${updated}.` : "";
  const sentence=kind==="model" ? `${page.records} benchmark results for ${page.name} from primary sources, covering ${page.benchmarks} benchmarks.${ending}`
    : kind==="benchmark" ? `${page.name} results reported for ${page.models} models across ${page.versions} versions.${ending}`
    : `Benchmark results for ${page.models} ${page.name} models from official publications.${ending}`;
  const content:SeoContent={sentence,updated,links:page.coveredBenchmarks};
  if(kind==="model") {
    content.links=[...(content.links ?? []),...snapshot.comparisons.filter(pair=>pair.models.includes(loaded.payload.data.model.registry_no)).map(pair=>({path:pair.path,name:`Compare with ${snapshot.models.find(model=>model.registry_no===pair.models.find(no=>no!==loaded.payload.data.model.registry_no))!.name}`}))];
    const model=loaded.payload.data.model;
    // Closest published siblings by release date, with stable Registry No. ties.
    content.related=snapshot.models.filter(peer=>peer.company.slug===model.company.slug && peer.registry_no!==model.registry_no)
      .sort((a,b)=>Math.abs(Date.parse(a.released_at)-Date.parse(model.released_at))-Math.abs(Date.parse(b.released_at)-Date.parse(model.released_at)) || a.registry_no.localeCompare(b.registry_no,"en")).slice(0,6);
  } else if(kind==="company") content.related=snapshot.models.filter(model=>model.company.slug===loaded.payload.data.company.slug);
  else {content.top=page.topResults;content.latest=page.latestVersion;}
  return {...loaded,updated:page.updated,payload:{...loaded.payload,data:{...loaded.payload.data,seo:content}}} as LoadedRegistryRoute;
}
export function RelatedModels({models,label,showDates=false}:{models:ModelSummary[];label:string;showDates?:boolean}) {
  if(!models.length) return null;
  return <nav aria-label={label}><p>{label}</p><ul>{models.map(model=><li key={model.registry_no}>
    <a href={`/models/${model.registry_no}`}>{model.name}</a>{showDates ? <> — Released <time dateTime={model.released_at}>{formatRegistryDate(model.released_at,model.release_precision)}</time></> : null}
  </li>)}</ul></nav>;
}
export function FamilyResults({content}:{content?:SeoContent}) {
  if(!content?.latest) return null;
  const latest=content.latest;
  const columns:TableColumn<ResultRow>[]=[
    {key:"model",label:"Model",render:row=><a href={`/models/${row.model.registry_no}`}>{row.model.name}{row.reasoning_level ? ` (${row.reasoning_level})` : ""}</a>},
    {key:"score",label:"Score",render:row=>row.score.display},
    {key:"source",label:"Source",render:row=><SourceLink href={row.primary_source_url} context={`${row.model.name} on ${latest.benchmark.name}`} />},
  ];
  return <section className="results-section" aria-labelledby="recent-results-heading">
    <div className="results-section__header"><h2 id="recent-results-heading">Recently reported results</h2></div>
    <p>Latest version: <a href={`/benchmarks/${latest.benchmark.slug}/${latest.version_slug}`}>{benchmarkVersionLabel(latest.benchmark,latest.version)}</a></p>
    {content.top?.length ? <DataTable caption={`Recently reported results for ${benchmarkVersionLabel(latest.benchmark,latest.version)}`} rows={content.top} columns={columns} getRowKey={row=>row.result_key} /> : null}
  </section>;
}

export function RelatedLinks({links,label}:{links?:Array<{name:string;path:string}>;label:string}) {
  if(!links?.length) return null;
  return <nav aria-label={label}><p>{label}</p><ul>{links.map(link=><li key={link.path}><a href={link.path}>{link.name}</a></li>)}</ul></nav>;
}
