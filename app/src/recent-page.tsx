import { RecordCite } from "./cite";
import { recordAnchor } from "./citation";
import type { RecentRecord } from "../worker/seo-data";
import { BenchmarkLink } from "./benchmark-link";
import { formatRegistryDate } from "./registry";
import { DataTable, PageContainer, PageHeader, SourceLink, type TableColumn } from "./ui/components";
export function RecentPage({records}:{records:RecentRecord[]}) {
  const groups=new Map<string,RecentRecord[]>();
  for(const record of records) {const date=record.checked.slice(0,10);groups.set(date,[...(groups.get(date) ?? []),record]);}
  const columns:TableColumn<RecentRecord>[]=[
    {key:"model",label:"Model",className:"data-table__primary",render:({row})=><a href={`/models/${row.model.registry_no}`}>{row.model.name}</a>},
    {key:"benchmark",label:"Benchmark",render:({row})=><BenchmarkLink benchmark={row.benchmark} version={row.benchmark_version} versionSlug={row.benchmark_version_slug} />},
    {key:"score",label:"Score",className:"numeric score",render:({row})=>row.score.display},
    {key:"source",label:"Source",render:({row})=><span className="table-cell-stack"><SourceLink href={row.primary_source_url} context={`${row.model.name} on ${row.benchmark.name}`} /><RecordCite result={row} /></span>},
  ];
  return <PageContainer className="registry-page recent-page"><PageHeader title="Recently added benchmark results" description={`${records.length} recent records from primary sources. Dates show when evidence was checked.`} />
    {[...groups].map(([date,rows])=><section className="results-section" key={date}>
      <div className="results-section__header"><h2>Evidence checked <time dateTime={date}>{formatRegistryDate(date,"date")}</time></h2></div>
      <DataTable caption={`Recent benchmark records with evidence checked ${date}`} rows={rows} columns={columns} getRowKey={({row})=>row.result_key} getRowId={({row})=>recordAnchor(row)} />
    </section>)}
  </PageContainer>;
}
