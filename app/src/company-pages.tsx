import type { ModelSummary, ResultRow } from "../worker/api";
import {
  DataTable,
  EmptyState,
  MetadataRows,
  PageContainer,
  PageHeader,
  PageSizeSelector,
  Pagination,
  SourceLink,
  Tabs,
  type SortDirection,
  type TableColumn,
} from "./ui/components";
import {
  formatRegistryDate,
  formatRegistryMonthYear,
  queryHref,
  type CompanyDetailResponse,
  type CompanyListResponse,
} from "./registry";

const PRESERVED_QUERY_KEYS = ["q", "sort", "order", "view", "limit"];

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
}

function HiddenQueryFields({
  search,
  exclude,
}: {
  search: string;
  exclude: string[];
}) {
  const params = new URLSearchParams(search);
  return (
    <>
      {PRESERVED_QUERY_KEYS.filter((key) => !exclude.includes(key)).flatMap((key) =>
        params.getAll(key).map((value) => (
          <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
        )),
      )}
    </>
  );
}

function LocalSearch({
  action,
  currentSearch,
  label,
  placeholder,
}: {
  action: string;
  currentSearch: string;
  label: string;
  placeholder: string;
}) {
  const query = new URLSearchParams(currentSearch).get("q") ?? "";
  return (
    <form className="local-search" role="search" method="get" action={action}>
      <div className="local-search__field">
        <label className="local-search__label" htmlFor="local-search-input">
          {label}
        </label>
        <span className="local-search__controls">
          <input
            id="local-search-input"
            name="q"
            type="search"
            maxLength={50}
            defaultValue={query}
            placeholder={placeholder}
            autoComplete="off"
            required
          />
          <button type="submit">Search</button>
        </span>
      </div>
      <HiddenQueryFields search={currentSearch} exclude={["q"]} />
      {query ? (
        <a
          className="local-search__clear"
          href={queryHref(action, currentSearch, { q: null, page: null })}
        >
          Clear search
        </a>
      ) : null}
    </form>
  );
}

function PageSizeForm({
  action,
  currentSearch,
  value,
}: {
  action: string;
  currentSearch: string;
  value: 50 | 100 | 500;
}) {
  return (
    <form className="page-size-form" method="get" action={action}>
      <HiddenQueryFields search={currentSearch} exclude={["limit"]} />
      <PageSizeSelector value={value} id="results-page-size" />
      <button type="submit">Apply</button>
    </form>
  );
}

function sortLink(
  pathname: string,
  currentSearch: string,
  key: string,
  defaultDirection?: SortDirection,
): { href: string; direction?: SortDirection } {
  const params = new URLSearchParams(currentSearch);
  const explicitDirection = params.get("sort") === key
    ? (params.get("order") ?? "asc") as SortDirection
    : undefined;
  const direction = explicitDirection ?? defaultDirection;
  return {
    href: queryHref(pathname, currentSearch, {
      sort: key,
      order: direction === "asc" ? "desc" : "asc",
      page: null,
    }),
    direction,
  };
}

function PaginationFor({
  pathname,
  currentSearch,
  page,
  totalPages,
}: {
  pathname: string;
  currentSearch: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages === 0) return null;
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      getHref={(nextPage) => queryHref(pathname, currentSearch, { page: nextPage })}
    />
  );
}

function LatestModel({ model }: { model: ModelSummary | null }) {
  if (model === null) return <span>Not available</span>;
  return (
    <span className="table-cell-stack">
      <a href={`/models/${model.registry_no}`}>{model.name}</a>
      <span>{formatRegistryMonthYear(model.released_at)}</span>
    </span>
  );
}

export function CompaniesPage({
  response,
  currentSearch,
}: {
  response: CompanyListResponse;
  currentSearch: string;
}) {
  const pathname = "/companies";
  const nameSort = sortLink(pathname, currentSearch, "name", "asc");
  const establishedSort = sortLink(pathname, currentSearch, "established");
  const latestModelSort = sortLink(pathname, currentSearch, "latest_model");
  const query = new URLSearchParams(currentSearch).get("q");
  const columns: TableColumn<CompanyListResponse["data"][number]>[] = [
    {
      key: "company",
      label: "Company",
      className: "data-table__primary",
      sortHref: nameSort.href,
      sortDirection: nameSort.direction,
      render: (company) => <a href={`/companies/${company.slug}`}>{company.name}</a>,
    },
    {
      key: "established",
      label: "Established",
      sortHref: establishedSort.href,
      sortDirection: establishedSort.direction,
      render: (company) => company.established_at && company.established_precision
        ? formatRegistryDate(company.established_at, company.established_precision)
        : "Not available",
    },
    {
      key: "latest-model",
      label: "Latest model",
      sortHref: latestModelSort.href,
      sortDirection: latestModelSort.direction,
      render: (company) => <LatestModel model={company.latest_model} />,
    },
  ];

  return (
    <PageContainer className="registry-page">
      <PageHeader
        title="Companies"
        description={countLabel(response.page.total_items, "company", "companies")}
      />
      <LocalSearch
        action={pathname}
        currentSearch={currentSearch}
        label="Search companies"
        placeholder="Search company names"
      />

      <section className="results-section" aria-labelledby="company-index-heading">
        <div className="results-section__header">
          <div>
            <h2 id="company-index-heading">Registry companies</h2>
            <p>{countLabel(response.page.total_items, "company", "companies")}</p>
          </div>
          <PageSizeForm
            action={pathname}
            currentSearch={currentSearch}
            value={response.page.limit}
          />
        </div>
        {response.data.length === 0 ? (
          <EmptyState
            title={query ? "No matching companies" : "No companies found"}
            description={query
              ? "Try a different company name."
              : "The registry does not contain any companies."}
          />
        ) : (
          <DataTable
            caption="Registry companies"
            columns={columns}
            rows={response.data}
            getRowKey={(company) => company.slug}
          />
        )}
        <PaginationFor
          pathname={pathname}
          currentSearch={currentSearch}
          page={response.page.number}
          totalPages={response.page.total_pages}
        />
      </section>
    </PageContainer>
  );
}

export function CompanyDetailPage({
  response,
  currentSearch,
}: {
  response: CompanyDetailResponse;
  currentSearch: string;
}) {
  const { company, latest_model: latestModel, results, result_page: page } = response.data;
  const pathname = `/companies/${company.slug}`;
  const params = new URLSearchParams(currentSearch);
  const view = params.get("view") === "history" ? "history" : "latest";
  const query = params.get("q");
  const benchmarkSort = sortLink(pathname, currentSearch, "benchmark");
  const modelSort = sortLink(pathname, currentSearch, "model");
  const sourceSort = sortLink(pathname, currentSearch, "source");
  const registrySort = sortLink(pathname, currentSearch, "registry_no");
  const columns: TableColumn<ResultRow>[] = [
    {
      key: "benchmark",
      label: "Benchmark",
      className: "data-table__primary",
      sortHref: benchmarkSort.href,
      sortDirection: benchmarkSort.direction,
      render: (result) => (
        <span className="table-cell-stack">
          <a href={`/benchmarks/${result.benchmark.slug}`}>{result.benchmark.name}</a>
          <span>{result.benchmark_version}</span>
        </span>
      ),
    },
    {
      key: "model",
      label: "Model",
      sortHref: modelSort.href,
      sortDirection: modelSort.direction,
      render: (result) => (
        <a href={`/models/${result.model.registry_no}`}>
          {result.model.name}{result.reasoning_level ? ` (${result.reasoning_level})` : null}
        </a>
      ),
    },
    {
      key: "score",
      label: "Score",
      className: "numeric",
      render: (result) => result.score.display,
    },
    {
      key: "source",
      label: "Source",
      sortHref: sourceSort.href,
      sortDirection: sourceSort.direction,
      render: (result) => <SourceLink href={result.primary_source_url} />,
    },
    {
      key: "registry-no",
      label: "Registry No.",
      className: "numeric registry-number",
      sortHref: registrySort.href,
      sortDirection: registrySort.direction,
      render: (result) => (
        <a href={`/models/${result.model.registry_no}`}>{result.model.registry_no}</a>
      ),
    },
  ];

  const established = company.established_at && company.established_precision
    ? formatRegistryDate(company.established_at, company.established_precision)
    : "Not available";
  const latestModelValue = latestModel ? (
    <span>
      <a href={`/models/${latestModel.registry_no}`}>{latestModel.name}</a>
      {` (${formatRegistryMonthYear(latestModel.released_at)})`}
    </span>
  ) : "Not available";

  return (
    <PageContainer className="registry-page">
      <PageHeader title={company.name} />
      <section className="entity-metadata" aria-label="Company metadata">
        <MetadataRows
          items={[
            { label: "Established", value: established },
            { label: "Latest model", value: latestModelValue },
          ]}
        />
      </section>

      <LocalSearch
        action={pathname}
        currentSearch={currentSearch}
        label="Search benchmarks or models"
        placeholder="Search benchmark or model names"
      />

      <section className="results-section" aria-labelledby="company-results-heading">
        <div className="results-section__header">
          <div>
            <h2 id="company-results-heading">Benchmarks</h2>
            <p>{countLabel(page.total_items, "result")}</p>
          </div>
          <PageSizeForm action={pathname} currentSearch={currentSearch} value={page.limit} />
        </div>
        <Tabs
          label="Result view"
          items={[
            {
              href: queryHref(pathname, currentSearch, { view: "latest", page: null }),
              label: "Latest",
              active: view === "latest",
            },
            {
              href: queryHref(pathname, currentSearch, { view: "history", page: null }),
              label: "History",
              active: view === "history",
            },
          ]}
        />
        {results.length === 0 ? (
          <EmptyState
            title={query ? "No matching benchmarks or models" : "No benchmark results"}
            description={query
              ? "Try a different benchmark or model name."
              : "No results are available in this view."}
          />
        ) : (
          <DataTable
            caption={`Benchmark results for ${company.name}`}
            columns={columns}
            rows={results}
            getRowKey={(result) => result.result_key}
          />
        )}
        <PaginationFor
          pathname={pathname}
          currentSearch={currentSearch}
          page={page.number}
          totalPages={page.total_pages}
        />
      </section>
    </PageContainer>
  );
}
