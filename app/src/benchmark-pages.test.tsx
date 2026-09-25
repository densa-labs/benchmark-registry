import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BenchmarkFamilyPage,
  BenchmarksPage,
  BenchmarkVersionPage,
} from "./benchmark-pages";
import type {
  BenchmarkFamilyResponse,
  BenchmarkListResponse,
  BenchmarkVersionPageResponse,
} from "./registry";

const metric = {
  name: "Accuracy",
  key: "gpqa-diamond-accuracy",
  unit: "percent",
  storage_kind: "decimal" as const,
  display_precision: 1,
};

const latestVersion = {
  benchmark: { name: "GPQA", slug: "gpqa" },
  version: "Diamond",
  version_slug: "diamond",
  released_at: "2023-11-20",
  release_precision: "date" as const,
  metric,
};

const olderVersion = {
  ...latestVersion,
  version: "Main",
  version_slug: "main",
  released_at: "2023-11-01",
};

const benchmarkListResponse: BenchmarkListResponse = {
  data: [{
    benchmark: latestVersion.benchmark,
    latest_version: latestVersion.version,
    latest_released_at: latestVersion.released_at,
    latest_release_precision: latestVersion.release_precision,
  }],
  page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
};

const benchmarkFamilyResponse: BenchmarkFamilyResponse = {
  data: {
    benchmark: { ...latestVersion.benchmark, aliases: ["Graduate-Level Google-Proof Q&A"] },
    versions: [latestVersion, olderVersion],
  },
};

const openAiModel = {
  registry_no: "10002",
  name: "GPT-4.1",
  company: { name: "OpenAI", slug: "openai" },
  released_at: "2025-04-14",
  release_precision: "date" as const,
  published_at: "2026-09-17T00:00:00Z",
  status: "active" as const,
};

const googleModel = {
  ...openAiModel,
  registry_no: "30002",
  name: "Gemini 2.5 Pro",
  company: { name: "Google", slug: "google" },
};

const benchmarkVersionResponse: BenchmarkVersionPageResponse = {
  available_companies: [
    { name: "Anthropic", slug: "anthropic" },
    { name: "Google", slug: "google" },
    { name: "OpenAI", slug: "openai" },
  ],
  data: {
    version: latestVersion,
    evaluator_names: ["Center for AI Safety", "Scale AI"],
    source_url: "https://example.com/gpqa",
    view: "history",
    company: null,
    results: [
      {
        result_key: "a".repeat(64),
        model: openAiModel,
        benchmark: latestVersion.benchmark,
        benchmark_version: latestVersion.version,
        reasoning_level: "high",
        metric,
        score: { raw: "66.3%", value: "66.3", display: "66.3%" },
        evaluator_names: ["OpenAI"],
        primary_source_url: "https://example.com/openai-result",
        reported_at: "2025-04-14",
        reported_precision: "date",
      },
      {
        result_key: "b".repeat(64),
        model: googleModel,
        benchmark: latestVersion.benchmark,
        benchmark_version: latestVersion.version,
        reasoning_level: null,
        metric,
        score: { raw: "86.4%", value: "86.4", display: "86.4%" },
        evaluator_names: ["Google DeepMind"],
        primary_source_url: "https://example.com/google-result",
        reported_at: "2025-07-02",
        reported_precision: "date",
      },
    ],
    result_page: { number: 1, limit: 100, total_items: 2, total_pages: 1 },
  },
};

describe("P7.2 benchmark pages", () => {
  it("renders the benchmark index with local search, allowed sorting, and pagination", () => {
    const markup = renderToStaticMarkup(
      <BenchmarksPage response={benchmarkListResponse} currentSearch="?limit=50" />,
    );

    expect(markup).toContain("Registry benchmarks");
    expect(markup).toContain("1 benchmark family");
    expect(markup).toContain('action="/benchmarks"');
    expect(markup).toContain("Search benchmark names or aliases");
    expect(markup).toContain('href="/benchmarks/gpqa"');
    expect(markup).toContain("Diamond");
    expect(markup).toContain("November 20, 2023");
    expect(markup).toContain("Sort by Released ascending");
    expect(markup).not.toContain("Sort by Score");
    expect(markup).not.toContain("/benchmarks/gpqa/Diamond");
  });

  it("labels the index total as families rather than versions or results", () => {
    const markup = renderToStaticMarkup(
      <BenchmarksPage
        response={{
          ...benchmarkListResponse,
          page: { ...benchmarkListResponse.page, total_items: 53 },
        }}
        currentSearch=""
      />,
    );

    expect(markup).toContain("53 benchmark families");
    expect(markup).not.toContain("53 benchmark versions");
    expect(markup).not.toContain("53 results");
  });

  it("renders every family version and marks only the deterministically latest one", () => {
    const markup = renderToStaticMarkup(
      <BenchmarkFamilyPage response={benchmarkFamilyResponse} />,
    );

    expect(markup).toContain("GPQA");
    expect(markup).toContain("2 versions");
    expect(markup).toContain('href="/benchmarks/gpqa/diamond"');
    expect(markup).toContain('href="/benchmarks/gpqa/main"');
    expect(markup.match(/>Latest</gu)).toHaveLength(1);
    expect(markup).toContain("Accuracy");
  });

  it("renders benchmark metadata, scoped controls, dynamic company tabs, and results", () => {
    const markup = renderToStaticMarkup(
      <BenchmarkVersionPage
        response={benchmarkVersionResponse}
        currentSearch="?view=history&limit=100"
      />,
    );

    expect(markup).toContain('aria-label="Benchmark version metadata"');
    expect(markup).toContain("Evaluated by");
    expect(markup).toContain("Center for AI Safety, Scale AI");
    expect(markup).toContain("Release date");
    expect(markup).toContain("Version");
    expect(markup).toContain("Metric");
    expect(markup).toContain('aria-label="Result view"');
    expect(markup).toContain('aria-current="page">History</a>');
    expect(markup).toContain('aria-label="Company filter"');
    expect(markup).toContain("All companies");
    expect(markup).toContain("Anthropic");
    expect(markup).toContain("Google");
    expect(markup).toContain("OpenAI");
    expect(markup).toContain("company=google");
    expect(markup).toContain("company=openai");
    expect(markup).toContain("GPT-4.1");
    expect(markup).toContain("GPT-4.1</a> (high)");
    expect(markup).toContain("86.4%");
    expect(markup).toContain('href="/models/30002"');
    expect(markup).toContain('<option value="100" selected="">100</option>');
    expect(markup).not.toContain("Sort by Score");
  });

  it("preserves view and search state when applying a company tab", () => {
    const markup = renderToStaticMarkup(
      <BenchmarkVersionPage
        response={benchmarkVersionResponse}
        currentSearch="?view=history&q=gemini&limit=50&page=2"
      />,
    );

    expect(markup).toContain(
      "/benchmarks/gpqa/diamond?view=history&amp;q=gemini&amp;limit=50&amp;company=google",
    );
    expect(markup).not.toContain("company=google&amp;page=2");
  });

  it("renders the scoped empty state without pagination", () => {
    const response: BenchmarkVersionPageResponse = {
      data: {
        ...benchmarkVersionResponse.data,
        results: [],
        result_page: { number: 1, limit: 50, total_items: 0, total_pages: 0 },
      },
      available_companies: benchmarkVersionResponse.available_companies,
    };
    const markup = renderToStaticMarkup(
      <BenchmarkVersionPage response={response} currentSearch="?q=missing" />,
    );

    expect(markup).toContain("No matching models");
    expect(markup).toContain("Clear search");
    expect(markup).not.toContain('aria-label="Pagination"');
  });
});
