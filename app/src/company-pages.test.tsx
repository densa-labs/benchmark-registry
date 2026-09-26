import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CompaniesPage, CompanyDetailPage } from "./company-pages";
import type { CompanyDetailResponse, CompanyListResponse } from "./registry";

const model = {
  registry_no: "10002",
  name: "GPT-4.1",
  company: { name: "OpenAI", slug: "openai" },
  released_at: "2025-04-14",
  release_precision: "date" as const,
  published_at: "2026-09-17T00:00:00Z",
  status: "active" as const,
};

const companyListResponse: CompanyListResponse = {
  data: [{
    name: "OpenAI",
    slug: "openai",
    established_at: "2015-12-11",
    established_precision: "date",
    entity_kind: "company",
    established_basis: "source",
    latest_model: model,
  }],
  page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
};

const companyDetailResponse: CompanyDetailResponse = {
  data: {
    company: {
      name: "OpenAI",
      slug: "openai",
      established_at: "2015-12-11",
      established_precision: "date",
      entity_kind: "company",
      established_basis: "source",
    },
    latest_model: model,
    results: [{
      result_key: "a".repeat(64),
      model,
      benchmark: { name: "SWE-bench", slug: "swe-bench", aliases: [] },
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
      primary_source_url: "https://example.com/openai-result",
      reported_at: "2025-04-14",
      reported_precision: "date",
    }],
    result_page: { number: 1, limit: 100, total_items: 1, total_pages: 1 },
  },
};

describe("P7.3 company pages", () => {
  it("renders the company index with search, allowed sorting, and pagination controls", () => {
    const markup = renderToStaticMarkup(
      <CompaniesPage response={companyListResponse} currentSearch="?limit=50" />,
    );

    expect(markup).toContain("Registry organizations");
    expect(markup).toContain("1 organization");
    expect(markup).toContain('action="/companies"');
    expect(markup).toContain("Search organization names");
    expect(markup).toContain('href="/companies/openai"');
    expect(markup).toContain("December 11, 2015");
    expect(markup).toContain('href="/models/10002"');
    expect(markup).toContain("GPT-4.1");
    expect(markup).toContain("April 2025");
    expect(markup).toContain("Sort by Latest model ascending");
    expect(markup).not.toContain("Sort by Score");
  });

  it("renders company metadata and the frozen benchmark result controls", () => {
    const markup = renderToStaticMarkup(
      <CompanyDetailPage
        response={companyDetailResponse}
        currentSearch="?view=history&q=swe&limit=100"
      />,
    );

    expect(markup).toContain('aria-label="Organization metadata"');
    expect(markup).toContain("Established");
    expect(markup).toContain("December 11, 2015");
    expect(markup).toContain("Latest model");
    expect(markup).toContain("GPT-4.1</a> (April 2025)");
    expect(markup).toContain("Search benchmarks or models");
    expect(markup).toContain('aria-label="Result view"');
    expect(markup).toContain('aria-current="page">History</a>');
    expect(markup).toContain('href="/benchmarks/swe-bench"');
    expect(markup).toContain("Verified");
    expect(markup).toContain("GPT-4.1 (high)");
    expect(markup).toContain("54.6%");
    expect(markup).toContain('href="/models/10002"');
    expect(markup).toContain('<option value="100" selected="">100</option>');
    expect(markup).not.toContain("Sort by Score");
  });

  it("renders valid absence states for missing establishment and latest-model data", () => {
    const response: CompanyDetailResponse = {
      data: {
        ...companyDetailResponse.data,
        company: {
          ...companyDetailResponse.data.company,
          established_at: null,
          established_precision: null,
        },
        latest_model: null,
        results: [],
        result_page: { number: 1, limit: 50, total_items: 0, total_pages: 0 },
      },
    };
    const markup = renderToStaticMarkup(
      <CompanyDetailPage response={response} currentSearch="" />,
    );

    expect(markup.match(/Not available/gu)).toHaveLength(2);
    expect(markup).toContain("No benchmark results");
    expect(markup).not.toContain('aria-label="Pagination"');
  });

  it("preserves query state and clears the page when changing result view", () => {
    const markup = renderToStaticMarkup(
      <CompanyDetailPage
        response={companyDetailResponse}
        currentSearch="?q=gpt&view=history&page=2&limit=50"
      />,
    );

    expect(markup).toContain(
      "/companies/openai?q=gpt&amp;view=latest&amp;limit=50",
    );
    expect(markup).not.toContain("view=latest&amp;page=2");
  });

  it("renders standalone AI-unit establishment dates without a qualifier", () => {
    const response: CompanyDetailResponse = {
      data: {
        ...companyDetailResponse.data,
        company: {
          ...companyDetailResponse.data.company,
          name: "Tongyi",
          slug: "tongyi",
          established_basis: "user_attested",
        },
      },
    };
    const unitMarkup = renderToStaticMarkup(<CompanyDetailPage response={response} currentSearch="" />);
    expect(unitMarkup).toContain("December 11, 2015");
    expect(unitMarkup).not.toContain("user-provided");
    expect(unitMarkup).not.toContain("Parent company");
  });
});
