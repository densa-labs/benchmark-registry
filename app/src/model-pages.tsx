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
  queryHref,
  type ModelDetailResponse,
  type ModelListResponse,
} from "./registry";

const PRESERVED_QUERY_KEYS = ["q", "company", "sort", "order", "view", "limit"];

function resultCount(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "result" : "results"}`;
}

function modelCount(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "model" : "models"}`;
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
  const params = new URLSearchParams(currentSearch);
  const query = params.get("q") ?? "";
  const clearHref = queryHref(action, currentSearch, { q: null, page: null });

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
        <a className="local-search__clear" href={clearHref}>
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
  const nextDirection = direction === "asc" ? "desc" : "asc";
  return {
    href: queryHref(pathname, currentSearch, {
      sort: key,
      order: nextDirection,
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

export function ModelsPage({
  response,
  currentSearch,
}: {
  response: ModelListResponse;
  currentSearch: string;
}) {
  const pathname = "/models";
  const nameSort = sortLink(pathname, currentSearch, "name");
  const releasedSort = sortLink(pathname, currentSearch, "released", "desc");
  const companySort = sortLink(pathname, currentSearch, "company");
  const registrySort = sortLink(pathname, currentSearch, "registry_no");
  const columns: TableColumn<ModelSummary>[] = [
    {
      key: "model",
      label: "Model",
      className: "data-table__primary",
      sortHref: nameSort.href,
      sortDirection: nameSort.direction,
      render: (model) => <a href={`/models/${model.registry_no}`}>{model.name}</a>,
    },
    {
      key: "company",
      label: "Provider",
      sortHref: companySort.href,
      sortDirection: companySort.direction,
      render: (model) => (
        <a href={`/companies/${model.company.slug}`}>{model.company.name}</a>
      ),
    },
    {
      key: "released",
      label: "Released",
      sortHref: releasedSort.href,
      sortDirection: releasedSort.direction,
      render: (model) => formatRegistryDate(model.released_at, model.release_precision),
    },
    {
      key: "status",
      label: "Status",
      render: (model) => <span className="model-status">{model.status}</span>,
    },
    {
      key: "registry-no",
      label: "Registry No.",
      className: "numeric registry-number",
      sortHref: registrySort.href,
      sortDirection: registrySort.direction,
      render: (model) => <a href={`/models/${model.registry_no}`}>{model.registry_no}</a>,
    },
  ];
  const query = new URLSearchParams(currentSearch).get("q");

  return (
    <PageContainer className="registry-page">
      <PageHeader title="Models" description={modelCount(response.page.total_items)} />
      <LocalSearch
        action={pathname}
        currentSearch={currentSearch}
        label="Search models"
        placeholder="Search model names, aliases, or Registry Nos."
      />

      <section className="results-section" aria-labelledby="models-heading">
        <div className="results-section__header">
          <div>
            <h2 id="models-heading">Registry models</h2>
            <p>{modelCount(response.page.total_items)}</p>
          </div>
          <PageSizeForm
            action={pathname}
            currentSearch={currentSearch}
            value={response.page.limit}
          />
        </div>
        {response.data.length === 0 ? (
          <EmptyState
            title={query ? "No matching models" : "No models found"}
            description={query ? "Try a different model name, alias, or Registry No." : "The registry does not contain any models."}
          />
        ) : (
          <DataTable
            caption="Registry models"
            columns={columns}
            rows={response.data}
            getRowKey={(model) => model.registry_no}
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

export function ModelDetailPage({
  response,
  currentSearch,
}: {
  response: ModelDetailResponse;
  currentSearch: string;
}) {
  const { model, results, result_page: page } = response.data;
  const pathname = `/models/${model.registry_no}`;
  const benchmarkSort = sortLink(pathname, currentSearch, "benchmark");
  const sourceSort = sortLink(pathname, currentSearch, "source");
  const params = new URLSearchParams(currentSearch);
  const view = params.get("view") === "history" ? "history" : "latest";
  const query = params.get("q");
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
          {result.reasoning_level ? (
            <span>{model.name} ({result.reasoning_level})</span>
          ) : null}
        </span>
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
  ];

  return (
    <PageContainer className="registry-page">
      <PageHeader title={model.name} />

      <section className="entity-metadata" aria-label="Model metadata">
        <MetadataRows
          items={[
            {
              label: "Released",
              value: formatRegistryDate(model.released_at, model.release_precision),
            },
            {
              label: "Provider",
              value: <a href={`/companies/${model.company.slug}`}>{model.company.name}</a>,
            },
            {
              label: "Source",
              value: <SourceLink href={model.source_url}>Release source</SourceLink>,
            },
            {
              label: "Registry No.",
              value: <span className="registry-number">{model.registry_no}</span>,
            },
          ]}
        />
      </section>

      <LocalSearch
        action={pathname}
        currentSearch={currentSearch}
        label="Search benchmarks"
        placeholder="Search benchmark names or aliases"
      />

      <section className="results-section" aria-labelledby="benchmarks-heading">
        <div className="results-section__header">
          <div>
            <h2 id="benchmarks-heading">Benchmarks</h2>
            <p>{resultCount(page.total_items)}</p>
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
            title={query ? "No matching benchmarks" : "No benchmark results"}
            description={query ? "Try a different benchmark name or alias." : "No results are available in this view."}
          />
        ) : (
          <DataTable
            caption={`Benchmark results for ${model.name}`}
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
