import type { ResultRow } from "../worker/api";
import { CANONICAL_ORIGIN } from "./seo-config";
import { DATA_LICENSE } from "./data-license";
export interface CitationInput { title:string; path:string; registryNumber?:string; benchmarkIdentifier?:string; recordNumber?:string }
export function recordAnchor(row: Pick<ResultRow,"result_key">):string {return `BR-${row.result_key}`;}
export function recordPermalink(row:ResultRow):string {
  return `/benchmarks/${row.benchmark.slug}/${row.benchmark_version_slug}?view=history&result=${row.result_key}#${recordAnchor(row)}`;
}
const bibtexEscape=(text:string)=>text.replace(/[\\{}%$&#_^~]/gu,character=>({"\\":"\\textbackslash{}","^":"\\textasciicircum{}","~":"\\textasciitilde{}"}[character] ?? `\\${character}`));
export function generateCitation(input:CitationInput):{plain:string;bibtex:string} {
  const url=CANONICAL_ORIGIN+input.path;
  const identifiers=[input.registryNumber && `Registry No. ${input.registryNumber}`,input.benchmarkIdentifier && `Benchmark identifier: ${input.benchmarkIdentifier}`,input.recordNumber && `Record No. ${input.recordNumber}`].filter(Boolean).join("; ");
  const key=`br_${input.recordNumber ?? input.registryNumber ?? input.benchmarkIdentifier ?? "registry"}`.replace(/[^a-zA-Z0-9_]/gu,"_");
  return {
    plain:`Benchmark Registry. ${input.title}. ${identifiers}. ${url}. Accessed [YYYY-MM-DD]. Data license: ${DATA_LICENSE.name} (${DATA_LICENSE.url}). Attribution: ${DATA_LICENSE.attribution}`,
    bibtex:`@misc{${key},\n  title = {${bibtexEscape(input.title)}},\n  publisher = {Benchmark Registry},\n  url = {${bibtexEscape(url)}},\n  urldate = {YYYY-MM-DD},\n  note = {${bibtexEscape(identifiers)}; data license: ${DATA_LICENSE.name}; access date to be filled by the reader}\n}`,
  };
}
export function recordCitation(row:ResultRow):CitationInput {
  return {title:`${row.model.name}: ${row.benchmark.name} ${row.benchmark_version}, ${row.score.display}${row.reasoning_level ? ` (${row.reasoning_level})` : ""}`,
    path:recordPermalink(row),registryNumber:row.model.registry_no,recordNumber:row.result_key};
}
