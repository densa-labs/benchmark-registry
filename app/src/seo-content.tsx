import type { BenchmarkVersionSummary, ModelSummary, ResultRow } from "../worker/api";
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
export function RelatedModels({models,label,showDates=false}:{models:ModelSummary[];label:string;showDates?:boolean}) {
  if(!models.length) return null;
  return <nav className="home-directory__group" aria-label={label}><p className="page-header__description">{label}</p><ul>{models.map(model=><li key={model.registry_no}>
    <a href={`/models/${model.registry_no}`}>{model.name}</a>{showDates ? <> — Released <time dateTime={model.released_at}>{formatRegistryDate(model.released_at,model.release_precision)}</time></> : null}
  </li>)}</ul></nav>;
}
export function FamilyResults({content}:{content?:SeoContent}) {
  if(!content?.latest) return null;
  const latest=content.latest;
  const columns:TableColumn<ResultRow>[]=[
    {key:"model",label:"Model",render:row=><a href={`/models/${row.model.registry_no}`}>{row.model.name}{row.reasoning_level ? ` (${row.reasoning_level})` : ""}</a>},
    {key:"score",label:"Score",className:"numeric",render:row=>row.score.display},
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
  return <nav className="home-directory__group" aria-label={label}><p className="page-header__description">{label}</p><ul>{links.map(link=><li key={link.path}><a href={link.path}>{link.name}</a></li>)}</ul></nav>;
}
