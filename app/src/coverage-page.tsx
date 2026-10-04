import type { CoverageData } from "./coverage-data";
import { DataTable, PageContainer, PageHeader } from "./ui/components";
export function CoveragePage({ data }: {data:CoverageData}) {
  const cells=new Map(data.cells.map(cell=>[`${cell.registry_no}:${cell.slug}`,cell]));
  return <PageContainer className="registry-page"><PageHeader title="Coverage" description="Recorded results across recent models and the most covered benchmark families. Empty cells indicate gaps in this registry." />
    {data.updated ? <p className="last-updated">Updated <time dateTime={data.updated}>{data.updated.slice(0,10)}</time></p> : null}
    <form className="coverage-options" method="get" action="/coverage">
      <label>Models <input name="models" type="number" min="1" max="100" defaultValue={data.options.models} /></label>
      <label>Benchmarks <input name="benchmarks" type="number" min="1" max="50" defaultValue={data.options.benchmarks} /></label>
      <label>Stale after (days) <input name="days" type="number" min="1" max="3650" defaultValue={data.options.days} /></label>
      <button type="submit">Apply</button>
    </form>
    <p className="compare-note">Recent models are selected in rounds across providers, up to {data.options.models} models total. Cells link to the newest reported observation in each family.</p>
    <h2>Coverage matrix</h2>
    {data.models.length ? <DataTable caption="Recent model coverage" rows={data.models} getRowKey={row=>row.registry_no} columns={[
      {key:"model",label:"Model",render:row=><span className="table-cell-stack"><a href={`/models/${row.registry_no}`}>{row.name}</a><a href={`/companies/${row.provider_slug}`}>{row.provider}</a></span>},
      ...data.benchmarks.map(benchmark=>({key:benchmark.slug,label:benchmark.name,render:(row:CoverageData["models"][number])=>{
        const cell=cells.get(`${row.registry_no}:${benchmark.slug}`);
        return cell ? <a href={`/benchmarks/${cell.slug}/${cell.version_slug}?view=history&result=${cell.result_key}#BR-${cell.result_key}`} aria-label={`${row.name}: ${benchmark.name}, reported`}>Reported</a> : <span aria-label="No recorded result">—</span>;
      }})),
    ]} /> : <p>No models are recorded yet.</p>}
    <h2>By provider</h2><DataTable caption="Provider coverage" rows={data.providers} getRowKey={row=>row.slug} columns={[
      {key:"provider",label:"Provider",render:row=><a href={`/companies/${row.slug}`}>{row.name}</a>},
      {key:"models",label:"Models",render:row=>row.models},
      {key:"benchmarks",label:"Benchmarks covered",render:row=>row.benchmarks},
      {key:"records",label:"Records",render:row=>row.records},
    ]} />
    <h2>Stale results</h2><p>Benchmarks whose newest reported result is more than {data.options.days} days before the latest data timestamp.</p>
    {data.stale.length ? <ul>{data.stale.map(row=><li key={row.slug}><a href={`/benchmarks/${row.slug}`}>{row.name}</a> · newest reported <time dateTime={row.newest}>{row.newest}</time></li>)}</ul> : <p>No stale results at this threshold.</p>}
  </PageContainer>;
}
