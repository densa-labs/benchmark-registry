import { ScoreChart } from "./score-chart-view";
import { Cite } from "./cite";
import { recordAnchor } from "./citation";
import { ReportIssue } from "./report-issue";
import { ResultSource } from "./result-source";
import { groupVersions, type VersionGroup } from "./version-groups";
import { FamilyResults } from "./seo-content";
import { ResultScoreLink } from "./result-score-link";
import type {
  BenchmarkVersionSummary,
  ResultRow,
} from "../worker/api";
import { BenchmarkLink } from "./benchmark-link";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";
import {
  DataTable,
  EmptyState,
  MetadataRows,
  PageActions,
  PageContainer,
  PageHeader,
  PageSizeSelector,
  Pagination,
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

const PRESERVED_QUERY_KEYS = ["q", "company", "sort", "order", "view", "limit", "result"];

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
    <form className="local-search" role="search" aria-label={label} method="get" action={action}>
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
          <button type="submit" data-focus-key="local-search-submit">Search</button>
        </span>
      </div>
      <HiddenQueryFields search={currentSearch} exclude={["q"]} />
      {query ? (
        <a
          className="local-search__clear" data-focus-key="clear-search"
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
      <button type="submit" data-focus-key="page-size-apply">Apply</button>
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
  const direction = explicitDirection ?? (params.has("sort") ? undefined : defaultDirection);
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
  const nameSort = sortLink(pathname, currentSearch, "name", "asc");
  const releasedSort = sortLink(pathname, currentSearch, "released");
  const versionSort = sortLink(pathname, currentSearch, "version");
  const query = new URLSearchParams(currentSearch).get("q");
  const columns: TableColumn<BenchmarkListResponse["data"][number]>[] = [
    {
      key: "benchmark",
      label: "Benchmark",
      className: "data-table__primary",
      sortHref: nameSort.href,
      sortDirection: nameSort.direction,
      render: ({ benchmark }) => <BenchmarkLink benchmark={benchmark} />,
    },
    {
      key: "version",
      label: "Latest version",
      sortHref: versionSort.href,
      sortDirection: versionSort.direction,
      // A family with no unconfigured version shows its most recent configuration, labelled as such.
      render: ({ latest_version, latest_configuration }) => latest_configuration ? `${latest_version} (configuration)` : latest_version,
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
  const displayName = benchmarkDisplayName(benchmark);
  const sharedMetric = versions.length > 0 && versions.every(version => version.metric.key === versions[0].metric.key);
  // "Latest" marks only true versions; tool and harness configurations never are.
  const latest = versions.find(version => !version.configuration);
  const counts = response.data.seo?.versionCounts;
  // Counts per version, shown only when the build supplied them.
  function countColumns<Row>(version: (row: Row) => BenchmarkVersionSummary): TableColumn<Row>[] {
    if (!counts) return [];
    return [
      { key: "models", label: "Models", className: "numeric", render: row => (counts[version(row).version_slug]?.models ?? 0).toLocaleString("en-US") },
      { key: "results", label: "Results", className: "numeric", render: row => (counts[version(row).version_slug]?.results ?? 0).toLocaleString("en-US") },
    ];
  }
  const versionLink = (version: BenchmarkVersionSummary) => (
    <span className="version-label">
      <a href={`/benchmarks/${benchmark.slug}/${version.version_slug}`}>
        {benchmarkVersionLabel(benchmark, version.version)}
      </a>
      {version.version_slug === latest?.version_slug ? <span className="latest-indicator">Latest</span> : null}
    </span>
  );
  const variantColumns: TableColumn<BenchmarkVersionSummary>[] = [
    { key: "version", label: "Variant", render: versionLink },
    { key: "configuration", label: "Configuration", render: version => version.configuration?.label ?? "—" },
    { key: "released", label: "Released", render: version => formatRegistryDate(version.released_at, version.release_precision) },
    ...(!sharedMetric ? [{ key: "metric", label: "Metric", render: metricLabel }] : []),
    ...countColumns<BenchmarkVersionSummary>(version => version),
  ];
  const columns: TableColumn<VersionGroup>[] = [
    {
      key: "version", label: "Version", className: "data-table__primary",
      render: ({ base, variants }) => <>
        {versionLink(base)}
        {base.configuration ? <span className="version-configuration">Configuration: {base.configuration.label}</span> : null}
        {variants.length ? <details className="version-variants" open={variants.length <= 4}>
          <summary>{variants.length} {variants.length === 1 ? "variant" : "variants"} of {base.version}</summary>
          <DataTable caption={`Variants of ${benchmarkVersionLabel(benchmark, base.version)}`}
            columns={variantColumns} rows={variants} getRowKey={version => version.version_slug} />
        </details> : null}
      </>,
    },
    { key: "released", label: "Released", render: ({ base }) => formatRegistryDate(base.released_at, base.release_precision) },
    ...(!sharedMetric ? [{ key: "metric", label: "Metric", render: ({ base }: VersionGroup) => metricLabel(base) }] : []),
    ...countColumns<VersionGroup>(({ base }) => base),
  ];
  const groups = groupVersions(versions);
  const variantCount = versions.length - groups.length;

  return (
    <PageContainer className="registry-page">
      <PageHeader
        title={displayName}
        description={response.data.seo?.sentence ?? (displayName === benchmark.name ? undefined : benchmark.name)}
      >
        <PageActions><ReportIssue page={`/benchmarks/${benchmark.slug}`} benchmark={benchmark.name} /></PageActions>
      </PageHeader>
      <section className="results-section" aria-labelledby="versions-heading">
        <div className="results-section__header">
          <div>
            <h2 id="versions-heading">Versions</h2>
            <p>{countLabel(groups.length, "version")}{variantCount ? `, plus ${countLabel(variantCount, "variant or configuration", "variants and configurations")}` : ""}{sharedMetric ? ` · Metric: ${versions[0].metric.name}` : ""}</p>
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
            rows={groups}
            getRowKey={({ base }) => base.version_slug}
          />
        )}
      </section>
      <FamilyResults content={response.data.seo} />
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
      label: "Provider",
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
      className: "numeric score",
      render: (result) => <ResultScoreLink result={result} />,
    },
    {
      key: "source",
      label: "Source",
      sortHref: sourceSort.href,
      sortDirection: sourceSort.direction,
      render: (result) => <ResultSource result={result} />,
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
      <PageHeader
        title={benchmarkDisplayName(version.benchmark)}
        description={benchmarkDisplayName(version.benchmark) === version.benchmark.name
          ? undefined
          : version.benchmark.name}
      >
      <section className="entity-metadata" aria-label="Benchmark version metadata">
        <MetadataRows
          items={[
            { label: "Benchmark", value: <BenchmarkLink benchmark={version.benchmark} /> },
            { label: "Evaluated by", value: evaluatorNames.join(", ") },
            {
              label: "Release date",
              value: formatRegistryDate(version.released_at, version.release_precision),
            },
            { label: "Version", value: <BenchmarkLink benchmark={version.benchmark} version={version.version} versionSlug={version.version_slug} /> },
            ...(version.configuration ? [{ label: "Configuration", value: version.configuration.label }] : []),
            { label: "Metric", value: version.metric.name },
          ]}
        />
      </section>
      <PageActions>
        <Cite input={{title:`${version.benchmark.name} ${version.version} benchmark results`,path:pathname,benchmarkIdentifier:`${version.benchmark.slug}/${version.version_slug}`}} />
        <ReportIssue page={pathname} benchmark={`${version.benchmark.name} ${version.version}`} source={response.data.source_url} />
      </PageActions>
      </PageHeader>

      <ScoreChart data={response.data.chart} />

      <section className="results-section" aria-labelledby="benchmark-results-heading">
        <div className="results-section__header">
          <div>
            <h2 id="benchmark-results-heading">Results</h2>
            <p>{countLabel(page.total_items, "result")}</p>
          </div>
          <PageSizeForm action={pathname} currentSearch={currentSearch} value={page.limit} />
        </div>
        <div className="results-toolbar">
        <LocalSearch
          action={pathname}
          currentSearch={currentSearch}
          label="Search models"
          placeholder="Search model names, aliases, or Registry Nos."
        />
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
            className="tabs--scroll"
            label="Provider filter"
            items={[
              {
                href: queryHref(pathname, currentSearch, { company: null, page: null }),
                label: "All providers",
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
        </div>
        {params.has("result") ? (
          <p className="local-search__clear" data-focus-key="clear-search">
            Showing the selected evaluation. <a href={queryHref(pathname, currentSearch, { result: null, page: null })}>Show all results</a>
          </p>
        ) : null}
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
            getRowId={recordAnchor}
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
