import type { RecentRecord } from "./seo-data";
import { CANONICAL_ORIGIN } from "../src/seo-config";
import { recordPermalink } from "../src/citation";
const xml=(value:string)=>value.replace(/[&<>"']/gu,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[character]!);
function timestamp(value:string):string|null {
  if(!/^\d{4}-\d{2}-\d{2}T/u.test(value) || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
export function renderAtomFeed(records:RecentRecord[],dataUpdated?:string):string {
  const rows=records.filter(record=>timestamp(record.checked)).sort((a,b)=>Date.parse(b.checked)-Date.parse(a.checked) || a.row.result_key.localeCompare(b.row.result_key)).slice(0,50);
  const updated=rows[0] ? timestamp(rows[0].checked) : dataUpdated ? timestamp(dataUpdated) : null;
  if(!updated) throw new Error("Atom feed requires a recorded data timestamp.");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><id>${CANONICAL_ORIGIN}/feed.xml</id><title>Benchmark Registry results</title><updated>${updated}</updated><author><name>Benchmark Registry</name></author><link rel="self" href="${CANONICAL_ORIGIN}/feed.xml" type="application/atom+xml"/><link rel="alternate" href="${CANONICAL_ORIGIN}/"/>${rows.map(({row,checked})=>{
    const link=CANONICAL_ORIGIN+recordPermalink(row);
    const title=`${row.model.name}: ${row.benchmark.name} ${row.benchmark_version} ${row.score.display}`;
    const summary=`${row.reasoning_level ? `Reasoning: ${row.reasoning_level}. ` : ""}Reported ${row.reported_at}. Evaluator: ${row.evaluator_names.join(", ")}. Source: <a href="${xml(row.primary_source_url)}" rel="noopener noreferrer">${xml(row.primary_source_url)}</a>.`;
    return `<entry><id>${xml(CANONICAL_ORIGIN+`/benchmarks/${row.benchmark.slug}/${row.benchmark_version_slug}#BR-${row.result_key}`)}</id><title>${xml(title)}</title><link href="${xml(link)}"/><updated>${timestamp(checked)}</updated><summary type="html">${xml(summary)}</summary></entry>`;
  }).join("")}</feed>\n`;
}
