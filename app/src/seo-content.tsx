import { recordAnchor } from "./citation";
import { ResultSource } from "./result-source";
import type { BenchmarkVersionSummary, ModelSummary, ResultRow } from "../worker/api";
import { formatRegistryDate } from "./registry";
import { benchmarkVersionLabel } from "./benchmark-names";
import { DataTable, type TableColumn } from "./ui/components";
export interface SeoContent {
  sentence: string;
  updated?: string;
  related?: ModelSummary[];
  top?: ResultRow[];
  latest?: BenchmarkVersionSummary;
  links?: Array<{name:string;path:string}>;
  /** Family pages: models and retained results per version slug, from the version pages' own counts. */
  versionCounts?: Record<string,{models:number;results:number}>;
}
const headingId=(label:string)=>`related-${label.toLowerCase().replace(/[^a-z0-9]+/gu,"-")}`;
/** Secondary internal links after the primary content, under their own heading. */
function RelatedSection({label,children}:{label:string;children:React.ReactNode}) {
  return <section className="related-links" aria-labelledby={headingId(label)}><h2 id={headingId(label)}>{label}</h2><nav aria-label={label}><ul>{children}</ul></nav></section>;
}
export function RelatedModels({models,label,showDates=false}:{models:ModelSummary[];label:string;showDates?:boolean}) {
  if(!models.length) return null;
  return <RelatedSection label={label}>{models.map(model=><li key={model.registry_no}>
    <a href={`/models/${model.registry_no}`}>{model.name}</a>{showDates ? <> — Released <time dateTime={model.released_at}>{formatRegistryDate(model.released_at,model.release_precision)}</time></> : null}
  </li>)}</RelatedSection>;
}
export function FamilyResults({content}:{content?:SeoContent}) {
  if(!content?.latest) return null;
  const latest=content.latest;
  const label=benchmarkVersionLabel(latest.benchmark,latest.version);
  // Name the configuration unless the version label already does.
  const configuration=latest.configuration && !label.toLowerCase().includes(latest.configuration.label.toLowerCase()) ? latest.configuration.label : "";
  const columns:TableColumn<ResultRow>[]=[
    {key:"model",label:"Model",className:"data-table__primary",render:row=><a href={`/models/${row.model.registry_no}`}>{row.model.name}{row.reasoning_level ? ` (${row.reasoning_level})` : ""}</a>},
    {key:"score",label:"Score",className:"numeric score",render:row=>row.score.display},
    {key:"source",label:"Source",render:row=><ResultSource result={row} />},
  ];
  return <section className="results-section" aria-labelledby="recent-results-heading">
    <div className="results-section__header"><h2 id="recent-results-heading">{`Recently reported results: ${label}${configuration ? `, ${configuration}` : ""}`}</h2></div>
    <p className="results-section__note">{latest.configuration ? "Most recent configuration" : "Latest version"}: <a href={`/benchmarks/${latest.benchmark.slug}/${latest.version_slug}`}>{benchmarkVersionLabel(latest.benchmark,latest.version)}</a></p>
    {content.top?.length ? <DataTable caption={`Recently reported results for ${benchmarkVersionLabel(latest.benchmark,latest.version)}`} rows={content.top} columns={columns} getRowKey={row=>row.result_key} getRowId={recordAnchor} /> : null}
  </section>;
}

export function RelatedLinks({links,label}:{links?:Array<{name:string;path:string}>;label:string}) {
  if(!links?.length) return null;
  return <RelatedSection label={label}>{links.map(link=><li key={link.path}><a href={link.path}>{link.name}</a></li>)}</RelatedSection>;
}
