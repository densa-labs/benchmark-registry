import type { ResultRow } from "../worker/api";
import { CANONICAL_ORIGIN } from "./seo-config";
import { CopyText } from "./cite";
export function BadgeSnippet({result}:{result:ResultRow}) {
  const url=`${CANONICAL_ORIGIN}/badge/${result.model.registry_no}/${result.benchmark.slug}.svg`;
  const label=`${result.model.name}: ${result.benchmark.name}`.replace(/[[\]\\<>\r\n]/gu,"");
  const markdown=`![${label}](${url})`;
  const html=`<img src="${url}" alt="${label.replace(/[&"']/gu,character=>({"&":"&amp;",'"':"&quot;","'":"&#39;"})[character]!)}" height="24">`;
  return <><p>Badge for this model's latest reported score in the benchmark family; it may differ from this record.</p>
    <p>Markdown <CopyText text={markdown} label="Copy badge" /></p><pre tabIndex={0}>{markdown}</pre>
    <p>HTML <CopyText text={html} label="Copy badge" /></p><pre tabIndex={0}>{html}</pre>
  </>;
}
