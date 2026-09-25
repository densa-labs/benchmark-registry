import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeLoadingState, HomePage } from "./home-page";
import type { HomePageResponse } from "./registry";
import { AppShell } from "./ui/components";

function model(
  registryNo: string,
  name: string,
  releasedAt: string,
  publishedAt: string,
) {
  return {
    registry_no: registryNo,
    name,
    company: { name: "Example Company", slug: "example-company" },
    released_at: releasedAt,
    release_precision: "date" as const,
    published_at: publishedAt,
    status: "active" as const,
  };
}

const response: HomePageResponse = {
  stats: { data: { benchmark_results: 594, models: 92, benchmarks: 53, versions: 104 } },
  recent_models: {
    data: [
      model("10002", "Newest release", "2026-09-18", "2026-09-18T01:00:00Z"),
      model("10001", "Earlier release", "2026-09-17", "2026-09-18T02:00:00Z"),
    ],
    page: { number: 1, limit: 50, total_items: 4506, total_pages: 91 },
  },
  recently_added: {
    data: [
      model("10001", "Latest addition", "2026-09-17", "2026-09-18T02:00:00Z"),
      model("10002", "Earlier addition", "2026-09-18", "2026-09-18T01:00:00Z"),
    ],
    page: { number: 1, limit: 50, total_items: 4506, total_pages: 91 },
  },
  all_models: [
    model("10001", "Earlier release", "2026-09-17", "2026-09-18T02:00:00Z"),
    model("10002", "Newest release", "2026-09-18", "2026-09-18T01:00:00Z"),
  ],
};

describe("homepage", () => {
  it("shows a homepage loading state", () => {
    const markup = renderToStaticMarkup(<HomeLoadingState />);
    expect(markup).toContain("Loading homepage data");
    expect(markup).toContain('aria-busy="true"');
  });

  it("renders global search and both frozen model sections without rankings", () => {
    const markup = renderToStaticMarkup(
      <AppShell navigation={[]}>
        <HomePage response={response} />
      </AppShell>,
    );

    expect(markup).toContain('role="search"');
    expect(markup).toContain("594</strong> benchmark results");
    expect(markup).toContain("92 models");
    expect(markup).toContain("53 benchmarks");
    expect(markup).toContain("104 versions");
    expect(markup).not.toContain("One place for AI model benchmark results.");
    expect(markup).toContain("Recent Models");
    expect(markup).toContain("Recently Added");
    expect(markup).toContain("All Models");
    expect(markup).not.toContain("Top Models");
  });

  it("preserves the release and publication ordering returned by the API", () => {
    const markup = renderToStaticMarkup(<HomePage response={response} />);
    const recentSection = markup.slice(
      markup.indexOf('id="recent-models-heading"'),
      markup.indexOf('id="recently-added-heading"'),
    );
    const addedSection = markup.slice(markup.indexOf('id="recently-added-heading"'));

    expect(recentSection.indexOf("Newest release"))
      .toBeLessThan(recentSection.indexOf("Earlier release"));
    expect(addedSection.indexOf("Latest addition"))
      .toBeLessThan(addedSection.indexOf("Earlier addition"));
  });

  it("renders every directory model with a canonical model link", () => {
    const models = Array.from({ length: 92 }, (_, index) => model(
      String(10000 + index), `Model ${index + 1}`, "2026-09-17", "2026-09-18T00:00:00Z",
    ));
    const markup = renderToStaticMarkup(
      <HomePage response={{ ...response, all_models: models }} />,
    );
    const directory = markup.slice(markup.indexOf('id="all-models-heading"'));
    expect(directory.match(/class="home-directory__model"/gu)).toHaveLength(92);
    for (const entry of models) {
      expect(directory).toContain(`href="/models/${entry.registry_no}"`);
    }
  });

  it("renders exact zero counts and empty sections", () => {
    const emptyPage = { data: [], page: { number: 1, limit: 50 as const, total_items: 0, total_pages: 0 } };
    const markup = renderToStaticMarkup(<HomePage response={{
      stats: { data: { benchmark_results: 0, models: 0, benchmarks: 0, versions: 0 } },
      recent_models: emptyPage,
      recently_added: emptyPage,
      all_models: [],
    }} />);
    expect(markup).toContain("0</strong> benchmark results");
    expect(markup).toContain("0 models");
    expect(markup.match(/No models found/gu)).toHaveLength(3);
  });
});
