import type {
  BenchmarkVersionSummary,
  ResultRow,
} from "../worker/api";
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
  type BenchmarkFamilyResponse,
  type BenchmarkListResponse,
  type BenchmarkVersionPageResponse,
} from "./registry";

const PRESERVED_QUERY_KEYS = ["q", "company", "sort", "order", "view", "limit"];

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

function metricLabel(version: BenchmarkVersionSummary): string {
  return version.metric.name;
}

export function BenchmarksPage({
  response,
  currentSearch,
}: {
  response: BenchmarkListResponse;
  currentSearch: string;
}) {
  const pathname = "/benchmarks";
  const nameSort = sortLink(pathname, currentSearch, "name");
  const releasedSort = sortLink(pathname, currentSearch, "released", "desc");
  const versionSort = sortLink(pathname, currentSearch, "version");
  const query = new URLSearchParams(currentSearch).get("q");
  const columns: TableColumn<BenchmarkListResponse["data"][number]>[] = [
    {
      key: "benchmark",
      label: "Benchmark",
      className: "data-table__primary",
      sortHref: nameSort.href,
      sortDirection: nameSort.direction,
      render: ({ benchmark }) => (
        <a href={`/benchmarks/${benchmark.slug}`}>{benchmark.name}</a>
      ),
    },
    {
      key: "version",
      label: "Latest version",
      sortHref: versionSort.href,
      sortDirection: versionSort.direction,
      render: ({ latest_version }) => latest_version,
    },
    {
      key: "released",
      label: "Released",
      sortHref: releasedSort.href,
      sortDirection: releasedSort.direction,
      render: (benchmark) => formatRegistryDate(
        benchmark.latest_released_at,
        benchmark.latest_release_precision,
      ),
    },
  ];

  return (
    <PageContainer className="registry-page">
      <PageHeader
        title="Benchmarks"
        description={countLabel(response.page.total_items, "benchmark family", "benchmark families")}
      />
      <LocalSearch
        action={pathname}
        currentSearch={currentSearch}
        label="Search benchmarks"
        placeholder="Search benchmark names or aliases"
      />

      <section className="results-section" aria-labelledby="benchmark-index-heading">
        <div className="results-section__header">
          <div>
            <h2 id="benchmark-index-heading">Registry benchmarks</h2>
            <p>{countLabel(response.page.total_items, "benchmark family", "benchmark families")}</p>
          </div>
          <PageSizeForm
            action={pathname}
            currentSearch={currentSearch}
            value={response.page.limit}
          />
        </div>
        {response.data.length === 0 ? (
          <EmptyState
            title={query ? "No matching benchmarks" : "No benchmarks found"}
            description={query
              ? "Try a different benchmark name or alias."
              : "The registry does not contain any benchmarks."}
          />
        ) : (
          <DataTable
            caption="Registry benchmarks"
            columns={columns}
            rows={response.data}
            getRowKey={({ benchmark }) => benchmark.slug}
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

export function BenchmarkFamilyPage({ response }: { response: BenchmarkFamilyResponse }) {
  const { benchmark, versions } = response.data;
  const columns: TableColumn<BenchmarkVersionSummary>[] = [
    {
      key: "version",
      label: "Version",
      className: "data-table__primary",
      render: (version) => (
        <a href={`/benchmarks/${benchmark.slug}/${version.version_slug}`}>
          {version.version}
        </a>
      ),
    },
    {
      key: "released",
      label: "Released",
      render: (version) => formatRegistryDate(version.released_at, version.release_precision),
    },
    {
      key: "metric",
      label: "Metric",
      render: metricLabel,
    },
    {
      key: "status",
      label: "Status",
      render: (version) => version.version_slug === versions[0]?.version_slug
        ? <span className="latest-indicator">Latest</span>
        : null,
    },
  ];

  return (
    <PageContainer className="registry-page">
      <PageHeader title={benchmark.name} />
      <section className="results-section" aria-labelledby="versions-heading">
        <div className="results-section__header">
          <div>
            <h2 id="versions-heading">Versions</h2>
            <p>{countLabel(versions.length, "version")}</p>
          </div>
        </div>
        {versions.length === 0 ? (
          <EmptyState
            title="No benchmark versions"
            description="This benchmark does not have a published version."
          />
        ) : (
          <DataTable
            caption={`Versions of ${benchmark.name}`}
            columns={columns}
            rows={versions}
            getRowKey={(version) => version.version_slug}
          />
        )}
      </section>
    </PageContainer>
  );
}

export function BenchmarkVersionPage({
  response,
  currentSearch,
}: {
  response: BenchmarkVersionPageResponse;
  currentSearch: string;
}) {
  const {
    version,
    evaluator_names: evaluatorNames,
    results,
    result_page: page,
  } = response.data;
  const pathname = `/benchmarks/${version.benchmark.slug}/${version.version_slug}`;
  const params = new URLSearchParams(currentSearch);
  const view = params.get("view") === "history" ? "history" : "latest";
  const activeCompany = params.get("company");
  const query = params.get("q");
  const companySort = sortLink(pathname, currentSearch, "company");
  const modelSort = sortLink(pathname, currentSearch, "model");
  const sourceSort = sortLink(pathname, currentSearch, "source");
  const registrySort = sortLink(pathname, currentSearch, "registry_no");
  const columns: TableColumn<ResultRow>[] = [
    {
      key: "company",
      label: "Company",
      sortHref: companySort.href,
      sortDirection: companySort.direction,
      render: (result) => (
        <a href={`/companies/${result.model.company.slug}`}>{result.model.company.name}</a>
      ),
    },
    {
      key: "model",
      label: "Model",
      className: "data-table__primary",
      sortHref: modelSort.href,
      sortDirection: modelSort.direction,
      render: (result) => (
        <span>
          <a href={`/models/${result.model.registry_no}`}>{result.model.name}</a>
          {result.reasoning_level ? ` (${result.reasoning_level})` : null}
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

  return (
    <PageContainer className="registry-page">
      <PageHeader title={version.benchmark.name} />
      <section className="entity-metadata" aria-label="Benchmark version metadata">
        <MetadataRows
          items={[
            { label: "Evaluated by", value: evaluatorNames.join(", ") },
            {
              label: "Release date",
              value: formatRegistryDate(version.released_at, version.release_precision),
            },
            { label: "Version", value: version.version },
            { label: "Metric", value: version.metric.name },
          ]}
        />
      </section>

      <LocalSearch
        action={pathname}
        currentSearch={currentSearch}
        label="Search models"
        placeholder="Search model names, aliases, or Registry Nos."
      />

      <section className="results-section" aria-labelledby="benchmark-results-heading">
        <div className="results-section__header">
          <div>
            <h2 id="benchmark-results-heading">Results</h2>
            <p>{countLabel(page.total_items, "result")}</p>
          </div>
          <PageSizeForm action={pathname} currentSearch={currentSearch} value={page.limit} />
        </div>
        <div className="result-tabs">
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
          <Tabs
            label="Company filter"
            items={[
              {
                href: queryHref(pathname, currentSearch, { company: null, page: null }),
                label: "All companies",
                active: activeCompany === null,
              },
              ...response.available_companies.map((company) => ({
                href: queryHref(pathname, currentSearch, {
                  company: company.slug,
                  page: null,
                }),
                label: company.name,
                active: activeCompany === company.slug,
              })),
            ]}
          />
        </div>
        {results.length === 0 ? (
          <EmptyState
            title={query ? "No matching models" : "No benchmark results"}
            description={query
              ? "Try a different model name, alias, or Registry No."
              : "No results are available in this view."}
          />
        ) : (
          <DataTable
            caption={`${version.benchmark.name} ${version.version} results`}
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
