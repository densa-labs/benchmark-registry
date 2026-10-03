import type { ComparisonResponse } from "./compare";
import { buildComparisonRows } from "./compare";
import { BenchmarkSection } from "./compare-page";
import { PageContainer, PageHeader } from "./ui/components";
export function StaticComparisonPage({response,name}:{response:ComparisonResponse;name:string}) {
  const [a,b]=response.selected;if(!a || !b) return null;
  const rows=buildComparisonRows(a.data.results,b.data.results).filter(row=>row.shared);
  return <PageContainer className="registry-page compare-page">
    <PageHeader title={name} description={`${rows.length} shared benchmark contexts with reported scores and primary source links.`} />
    <p><a href={`/models/${a.data.model.registry_no}`}>{a.data.model.name}</a>{" · "}<a href={`/models/${b.data.model.registry_no}`}>{b.data.model.name}</a></p>
    <BenchmarkSection title="Shared benchmarks" rows={rows} names={[a.data.model.name,b.data.model.name]} />
  </PageContainer>;
}
