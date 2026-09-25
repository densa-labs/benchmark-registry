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

    expect(markup).toContain("Skip to content");
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('role="search"');
    expect(markup).toContain('maxLength="50"');
    expect(markup).toContain("Models");
    expect(markup).toContain("Benchmarks");
    expect(markup).toContain("Organizations");
    expect(markup).toContain('id="main-content"');
    expect(markup).toContain("Benchmark-Registry-B-Logo-Dark.png");
    expect(markup).toContain("© 2026");
    expect(markup).toContain('href="https://densa-labs.github.io/">Densa Labs</a>');
    expect(markup).toContain('name="color-theme"');
    expect(markup).toContain('value="light"');
    expect(markup).toContain('value="dark"');
  });

  it("uses the contrast-appropriate official header logo", () => {
    const lightMarkup = renderToStaticMarkup(<Header navigation={[]} theme="light" />);
    const darkMarkup = renderToStaticMarkup(<Header navigation={[]} theme="dark" />);

    expect(lightMarkup).toContain("Benchmark-Registry-B-Logo-Dark.png");
    expect(lightMarkup).not.toContain("Benchmark-Registry-B-Logo-White.png");
    expect(darkMarkup).toContain("Benchmark-Registry-B-Logo-White.png");
    expect(darkMarkup).not.toContain("Benchmark-Registry-B-Logo-Dark.png");
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
              canonical_name: "Humanity's Last Exam",
              matched_text: "HLE",
              href: "/benchmarks/humanitys-last-exam",
            }],
            page,
          },
        }} />
      </>,
    );

    expect(markup).toContain("Searching the registry...");
    expect(markup).toContain("No registry entries found for “missing”.");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('href="/benchmarks/humanitys-last-exam"');
    expect(markup).toContain("Humanity&#x27;s Last Exam");
    expect(markup).toContain("Matched HLE");
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
      benchmark: { name: "SWE-bench", slug: "swe-bench" },
      benchmark_version: "Verified",
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
    expect(markup).toContain("Released");
    expect(markup).toContain("Provider");
    expect(markup).toContain("Source");
    expect(markup).toContain("Registry No.");
    expect(markup).toContain("Search benchmarks");
    expect(markup).toContain('aria-label="Result view"');
    expect(markup).toContain('aria-current="page">History</a>');
    expect(markup).toContain("GPT-4.1 (high)");
    expect(markup).toContain('href="/benchmarks/swe-bench"');
    expect(markup).toContain("54.6%");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('<option value="100" selected="">100</option>');
    expect(markup).not.toContain("Sort by Score");
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
