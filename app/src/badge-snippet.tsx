import type { ResultRow } from "../worker/api";
import { CANONICAL_ORIGIN } from "./seo-config";
import { CopyText } from "./cite";
export function BadgeSnippet({result}:{result:ResultRow}) {
  const url=`${CANONICAL_ORIGIN}/badge/${result.model.registry_no}/${result.benchmark.slug}.svg`;
  const label=`${result.model.name}: ${result.benchmark.name}`.replace(/[[\]\\<>\r\n]/gu,"");
  // Each badge links back to the model's page, so an embedded badge leads readers to the sources.
  const page=`${CANONICAL_ORIGIN}/models/${result.model.registry_no}`;
  const markdown=`[![${label}](${url})](${page})`;
  const html=`<a href="${page}"><img src="${url}" alt="${label.replace(/[&"']/gu,character=>({"&":"&amp;",'"':"&quot;","'":"&#39;"})[character]!)}" height="24"></a>`;
  return <><p>Badge for this model's latest reported score in the benchmark family; it may differ from this record.</p>
    <p>Markdown <CopyText text={markdown} label="Copy badge" /></p><pre tabIndex={0}>{markdown}</pre>
    <p>HTML <CopyText text={html} label="Copy badge" /></p><pre tabIndex={0}>{html}</pre>
  </>;
}
