import type { SearchResponse } from "./registry";
import { DataTable, PageContainer, PageHeader, Pagination } from "./ui/components";
export function SearchPage({response,search}:{response:SearchResponse;search:string}) {
  const query=new URLSearchParams(search).get("q") ?? "";
  return <PageContainer className="registry-page"><PageHeader title="Search" description="Find recorded models, benchmarks, providers and individual results." />
    <form className="local-search" method="get" action="/search" role="search" aria-label="Search registry entries"><label htmlFor="registry-search-page">Search the registry</label><div className="local-search__controls"><input id="registry-search-page" type="search" name="q" maxLength={50} defaultValue={query} required /><button type="submit">Search</button></div></form>
    <p className="compare-note" id="search-operators">Filters: {['model:opus','brand:openai','benchmark:swe-bench','record:','metric:accuracy','date:2026-09','org:anthropic'].map(value=><code key={value}>{value}{' '}</code>)}</p>
    {query ? response.data.length ? <section className="results-section" aria-label="Search results"><DataTable caption="Search results" rows={response.data} getRowKey={row=>row.href} columns={[
      {key:"type",label:"Type",className:"search-type",render:row=>row.entity_type},
      {key:"name",label:"Result",className:"data-table__primary",render:row=><a href={row.href}>{row.canonical_name}</a>},
      {key:"context",label:"Context",render:row=>row.matched_text},
    ]} /></section> : <p>No registry entries found for “{query}”.</p> : <p>Enter a model, benchmark or provider name.</p>}
    {response.page.total_pages>1 ? <Pagination page={response.page.number} totalPages={response.page.total_pages} getHref={page=>`/search?${new URLSearchParams({q:query,page:String(page)})}`} /> : null}
  </PageContainer>;
}
