import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { ModelDetailPage, ModelsPage } from "./model-pages";
import type { ModelDetailResponse, ModelListResponse } from "./registry";
import {
  DataTable,
  EmptyState,
  ErrorState,
  GlobalSearchPanel,
  Header,
  LoadingState,
  MetadataRows,
  NotFoundState,
  PageSizeSelector,
  Pagination,
  SourceLink,
  Tabs,
  ThemeToggle,
} from "./ui/components";
import { resultColumns, resultFixtures } from "./ui/fixtures";

describe("Registry foundation view", () => {
  it("renders the application shell, navigation, search, and container", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Skip to main content");
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('role="search"');
    expect(markup).toContain('maxLength="50"');
    expect(markup).toContain("Models");
    expect(markup).toContain("Benchmarks");
    expect(markup).toContain("Organizations");
    expect(markup).toContain('id="main-content"');
    expect(markup).toContain('class="wordmark__logo"');
    expect(markup).toContain("© 2026");
    expect(markup).toContain('href="https://densa-labs.github.io/">Densa Labs</a>');
    expect(markup).toContain('name="color-theme"');
    expect(markup).toContain('value="light"');
    expect(markup).toContain('value="dark"');
  });

  it("uses the contrast-appropriate official header logo", () => {
    const lightMarkup = renderToStaticMarkup(<Header navigation={[]} theme="light" />);
    const darkMarkup = renderToStaticMarkup(<Header navigation={[]} theme="dark" />);

    expect(lightMarkup).toContain('fill="currentColor"');
    expect(darkMarkup).toBe(lightMarkup);
  });

  it("renders the theme choice as text labels backed by native radio controls", () => {
    const markup = renderToStaticMarkup(
      <ThemeToggle theme="dark" onSelectTheme={() => undefined} />,
    );

    expect(markup).toContain("<fieldset");
    expect(markup).toContain("Color theme");
    expect(markup).toContain('type="radio"');
    expect(markup).toMatch(/id="theme-dark"[^>]*checked=""[^>]*value="dark"/);
    expect(markup).toContain('for="theme-light">Light</label>');
    expect(markup).toContain('for="theme-dark">Dark</label>');
    expect(markup).not.toContain("<button");
  });

  it("renders metadata and source links with external-link treatment", () => {
    const markup = renderToStaticMarkup(
      <MetadataRows
        items={[
          { label: "Registry No.", value: "30002" },
          {
            label: "Source",
            value: <SourceLink href="https://example.com/evidence">Evidence</SourceLink>,
          },
        ]}
      />,
    );

    expect(markup).toContain("<dl");
    expect(markup).toContain("Registry No.");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
    expect(markup).toContain("opens in a new tab");
  });

  it("renders a scrollable data table with sortable headers and a display-only score", () => {
    const markup = renderToStaticMarkup(
      <DataTable
        caption="Fixture results"
        columns={resultColumns}
        rows={resultFixtures}
        getRowKey={(row) => row.resultKey}
      />,
    );

    expect(markup).toContain('class="table-scroll"');
    expect(markup).toContain('aria-sort="ascending"');
    expect(markup).toContain('class="sortable-header sortable-header--active"');
    expect(markup).toContain("Sort by Model descending");
    expect(markup).toContain('?sort=model&amp;order=desc');
    expect(markup).toContain("Gemini 2.5 Pro");
    expect(markup).toContain(">Score<");
    expect(markup).not.toContain("Sort by Score");
  });

  it("renders only the frozen page-size options", () => {
    const markup = renderToStaticMarkup(<PageSizeSelector value={100} />);

    expect(markup).toContain('<option value="50">50</option>');
    expect(markup).toContain('<option value="100" selected="">100</option>');
    expect(markup).toContain('<option value="500">500</option>');
    expect(markup).not.toContain("All");
  });

  it("renders tabs and pagination with shareable links and active semantics", () => {
    const markup = renderToStaticMarkup(
      <>
        <Tabs
          label="Result view"
          items={[
            { href: "?view=latest", label: "Latest", active: true },
            { href: "?view=history", label: "History" },
          ]}
        />
        <Pagination page={2} totalPages={4} getHref={(page) => `?page=${page}&limit=50`} />
      </>,
    );

    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('?view=history');
    expect(markup).toContain('?page=1&amp;limit=50');
    expect(markup).toContain('?page=3&amp;limit=50');
    expect(markup).toContain("Page <strong>2</strong> of <strong>4</strong>");
  });

  it("renders loading, empty, and not-found states", () => {
    const markup = renderToStaticMarkup(
      <>
        <LoadingState rows={2} />
        <EmptyState title="No matching results" description="Clear the filter." />
        <ErrorState title="Unable to load" description="Try again." />
        <NotFoundState />
      </>,
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Loading registry results");
    expect(markup).toContain("No matching results");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Registry entry not found");
    expect(markup).toContain('href="/models"');
  });

  it("renders a route loading state without the old fixture framing", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Loading registry results");
    expect(markup).not.toContain("Gemini 2.5 Pro");
    expect(markup).not.toContain("UI foundation");
    expect(markup).not.toContain("Registry interface primitives");
    expect(markup).not.toContain("System states");
  });

  it("renders accessible global search loading, empty, error, and result states", () => {
    const page = { number: 1, limit: 50 as const, total_items: 1, total_pages: 1 };
    const markup = renderToStaticMarkup(
      <>
        <GlobalSearchPanel state={{ status: "loading", query: "HLE" }} />
        <GlobalSearchPanel state={{
          status: "results",
          query: "missing",
          response: { data: [], page: { ...page, total_items: 0, total_pages: 0 } },
        }} />
        <GlobalSearchPanel state={{
          status: "error",
          query: "HLE",
          message: "Search is unavailable.",
        }} />
        <GlobalSearchPanel state={{
          status: "results",
          query: "HLE",
          response: {
            data: [{
              entity_type: "benchmark",
              aliases: ["HLE"],
              canonical_name: "Humanity's Last Exam",
              matched_text: "HLE",
              href: "/benchmarks/humanitys-last-exam",
            }],
            page,
          },
        }} />
      </>,
    );

    expect(markup).toContain('class="global-search-loading" aria-hidden="true"');
    expect(markup).toContain("No registry entries found for “missing”.");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('href="/benchmarks/humanitys-last-exam"');
    expect(markup).toContain("Humanity&#x27;s Last Exam");
    expect(markup).toContain("Matched HLE");
  });
  it("renders compact combined actions with reasoning context and selected-link semantics", () => {
    const href = `/benchmarks/cursorbench/4-0?view=history&result=${"a".repeat(64)}`;
    const markup = renderToStaticMarkup(<GlobalSearchPanel activeIndex={0} state={{
      status: "results", query: "cursorbench 4 opus 5.5", response: {
        data: [{ entity_type: "result", canonical_name: "Claude Opus 5.5 × CursorBench 4.0", matched_text: "Reasoning: max", href }],
        page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
      },
    }} />);
    expect(markup).toContain("Claude Opus 5.5 × CursorBench 4.0");
    expect(markup).toContain("Reasoning: max");
    expect(markup).not.toContain("Matched Reasoning");
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain(href.replaceAll("&", "&amp;"));
  });

});

const model = {
  registry_no: "10002",
  name: "GPT-4.1",
  company: { name: "OpenAI", slug: "openai" },
  released_at: "2025-04-14",
  release_precision: "date" as const,
  published_at: "2026-09-17T00:00:00Z",
  status: "active" as const,
};

const modelListResponse: ModelListResponse = {
  data: [model],
  page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
};

const modelDetailResponse: ModelDetailResponse = {
  data: {
    model: {
      ...model,
      source_url: "https://openai.com/index/gpt-4-1/",
      aliases: ["gpt-4.1-2025-04-14"],
    },
    redirected_from: null,
    results: [{
      result_key: "a".repeat(64),
      model,
      benchmark: { name: "SWE-bench", slug: "swe-bench", aliases: [] },
      benchmark_version: "Verified",
      benchmark_version_slug: "verified",
      exact_result_href: null,
      reasoning_level: "high",
      metric: {
        name: "Resolved",
        key: "resolved",
        unit: "percent",
        storage_kind: "decimal",
        display_precision: 1,
      },
      score: { raw: "54.6%", value: "54.6", display: "54.6%" },
      evaluator_names: ["OpenAI", "SWE-bench"],
      primary_source_url: "https://openai.com/index/gpt-4-1/",
      reported_at: "2025-04-14",
      reported_precision: "date",
    }],
    result_page: { number: 1, limit: 100, total_items: 1, total_pages: 1 },
  },
};

describe("P7.1 model pages", () => {
  it("replaces Registry numbers with a display-only recorded benchmark score", () => {
    const markup = renderToStaticMarkup(<ModelsPage response={{ ...modelListResponse, data: [{ ...model,
      featured_result: modelDetailResponse.data.results[0],
    }] }} currentSearch="" />);
    expect(markup).toContain("Benchmark score");
    expect(markup).toContain("SWE-bench Verified (high)");
    expect(markup).toContain("54.6%");
    expect(markup).not.toContain(">Registry No.<");
    expect(markup).not.toContain("Sort by Benchmark score");
    expect(markup).not.toContain(">10002<");
  });
  it("renders the model index with local search, allowed sorting, and pagination controls", () => {
    const markup = renderToStaticMarkup(
      <ModelsPage response={modelListResponse} currentSearch="?limit=50" />,
    );

    expect(markup).toContain("Registry models");
    expect(markup).toContain("1 model");
    expect(markup).toContain('action="/models"');
    expect(markup).toContain("Search model names, aliases, or Registry Nos.");
    expect(markup).toContain('href="/models/10002"');
    expect(markup).toContain('href="/companies/openai"');
    expect(markup).toContain("April 14, 2025");
    expect(markup).toContain("Sort by Released ascending");
    expect(markup).not.toContain("Sort by Status");
  });

  it("shows the API's implicit ascending order as active sort state", () => {
    const markup = renderToStaticMarkup(
      <ModelsPage response={modelListResponse} currentSearch="?sort=name" />,
    );

    expect(markup).toContain('aria-sort="ascending"');
    expect(markup).toContain("Sort by Model descending");
    expect(markup).toContain("?sort=name&amp;order=desc");
  });

  it("renders model metadata and the frozen benchmark result controls", () => {
    const markup = renderToStaticMarkup(
      <ModelDetailPage
        response={modelDetailResponse}
        currentSearch="?view=history&q=swe&limit=100"
      />,
    );

    expect(markup).toContain("GPT-4.1");
    expect(markup).toContain('aria-label="Model metadata"');
    expect(markup).toContain('href="/compare?models=10002%2C"');
    expect(markup).toContain('title="Stable ID composed of a developer namespace');
    expect(markup).toContain("docs/registry-numbering.md");
    expect(markup).toContain("Released");
    expect(markup).toContain("Provider");
    expect(markup).toContain("Source");
    expect(markup).toContain("Registry No.");
    expect(markup).toContain("Search benchmarks");
    expect(markup).toContain('aria-label="Result view"');
    expect(markup).toContain('aria-current="page">History</a>');
    expect(markup).toContain("GPT-4.1 (high)");
    expect(markup).toContain('href="/benchmarks/swe-bench/verified"');
    expect(markup).toContain("54.6%");
    expect(markup).toContain('target="_blank"');
    expect(markup).not.toContain("Rows per page");
    expect(markup).not.toContain("Sort by Score");
  });

  it("shows model search and paging only above their thresholds, retaining active search", () => {
    const render = (count: number, search = "") => renderToStaticMarkup(<ModelDetailPage response={{
      data: { ...modelDetailResponse.data, result_page: { ...modelDetailResponse.data.result_page, total_items: count } },
    }} currentSearch={search} />);
    expect(render(25)).not.toContain("Search benchmarks");
    expect(render(26)).toContain("Search benchmarks");
    expect(render(50)).not.toContain("Rows per page");
    expect(render(51)).toContain('<noscript><button type="submit"');
    expect(render(51)).toContain('<option value="100" selected="">100</option>');
    expect(render(0, "?q=missing")).toContain("Clear search");
    expect(render(1)).toContain('class="metadata-inline"');
  });

  it("paginates after the effort pivot and counts distinct benchmark families", () => {
    const first = modelDetailResponse.data.results[0];
    const paired = [{ ...first, reasoning_level: "medium" }, { ...first, result_key: "max", reasoning_level: "max", primary_source_url: "https://example.com/max" }];
    const markup = renderToStaticMarkup(<ModelDetailPage response={{ data: { ...modelDetailResponse.data,
      all_results: paired, results: [paired[0]], result_page: { number: 1, limit: 50, total_items: 2, total_pages: 1 },
    } }} currentSearch="" />);
    expect(markup).toContain("2 results across 1 benchmark");
    expect(markup.match(/<tbody><tr>/g)).toHaveLength(1);
    expect(markup).toContain(">medium</th>");
    expect(markup).toContain(">max</th>");
    expect(markup).toContain('href="https://example.com/max"');
    expect(markup).toContain('aria-sort="ascending"');
    const history = renderToStaticMarkup(<ModelDetailPage response={{ data: { ...modelDetailResponse.data, results: paired } }} currentSearch="?view=history" />);
    expect(history).not.toContain(">medium</th>");
  });

  it("renders a scoped empty state for a model benchmark search", () => {
    const response = {
      data: {
        ...modelDetailResponse.data,
        results: [],
        result_page: { number: 1, limit: 50 as const, total_items: 0, total_pages: 0 },
      },
    };
    const markup = renderToStaticMarkup(
      <ModelDetailPage response={response} currentSearch="?q=missing" />,
    );

    expect(markup).toContain("No matching benchmarks");
    expect(markup).toContain("Clear search");
    expect(markup).not.toContain('aria-label="Pagination"');
  });
});
