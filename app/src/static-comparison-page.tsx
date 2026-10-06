import type { ComparisonResponse } from "./compare";
import { buildComparisonRows, comparisonHref, parseComparisonState } from "./compare";
import { BenchmarkSection } from "./compare-page";
import { PageContainer, PageHeader } from "./ui/components";
export function StaticComparisonPage({response,name}:{response:ComparisonResponse;name:string}) {
  const [a,b]=response.selected;if(!a || !b) return null;
  const rows=buildComparisonRows(a.data.results,b.data.results).filter(row=>row.shared);
  const models:[string,string]=[a.data.model.registry_no,b.data.model.registry_no];
  return <PageContainer className="registry-page compare-page">
    <PageHeader title={name} description={`${rows.length} shared benchmark contexts with reported scores and primary source links.`}>
      <p className="compare-pair-models"><a href={`/models/${a.data.model.registry_no}`}>{a.data.model.name}</a><span aria-hidden="true"> · </span><a href={`/models/${b.data.model.registry_no}`}>{b.data.model.name}</a></p>
      <a className="model-compare" href={comparisonHref({...parseComparisonState(""),models})}>Change models<span className="visually-hidden"> in the comparison tool</span></a>
    </PageHeader>
    <BenchmarkSection title="Shared benchmarks" rows={rows} names={[a.data.model.name,b.data.model.name]} level={2} />
  </PageContainer>;
}
