import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeLoadingState, HomePage } from "./home-page";
import type { HomePageResponse } from "./registry";
import { AppShell } from "./ui/components";
import { accessibilityRoutes } from "./accessibility-fixtures";

const home = accessibilityRoutes[0].loaded;
if (home.kind !== "home") throw new Error("Missing home fixture");
const response: HomePageResponse = home.payload;
const result = response.panels.latest_additions[0];

describe("homepage", () => {
  it("renders global search and discovery panels before the complete directory", () => {
    const markup = renderToStaticMarkup(<AppShell navigation={[]}><HomePage response={response} /></AppShell>);
    expect(markup).toContain('role="search"');
    expect(markup).toContain("1</strong> benchmark result");
    expect(markup).toContain("Explore Benchmarks");
    expect(markup).toContain("Latest Additions");
    expect(markup.indexOf("Latest Additions")).toBeLessThan(markup.indexOf("All Models"));
    expect(markup).not.toContain("Recent Models");
    expect(markup).not.toContain("Recently Added");
    expect(markup).not.toContain("Top Models");
  });
  it("shows family coverage, result context, score and primary source links", () => {
    const markup = renderToStaticMarkup(<HomePage response={response} />);
    expect(markup).toContain("1 model evaluated");
    expect(markup).toContain('href="/benchmarks/gpqa"');
    expect(markup).toContain('href="/benchmarks/gpqa/diamond"');
    expect(markup).toContain("Test model (high)");
    expect(markup).toContain("80.0%");
    expect(markup).toContain('href="https://example.com/result"');
    expect(markup).toContain(`result=${result.result_key}`);
    expect(markup).not.toContain("2026-01-01");
  });
  it("keeps featured scores and absence states in the alphabetical model directory", () => {
    const withScore = { ...response.all_models[0], featured_result: result };
    const markup = renderToStaticMarkup(<HomePage response={{ ...response, all_models: [withScore] }} />);
    const directory = markup.slice(markup.indexOf('id="all-models-heading"'));
    expect(directory).toContain("GPQA Diamond (high)");
    expect(directory).toContain('class="model-benchmark-score__value"');
    expect(directory).not.toContain('class="registry-number"');
    const absent = renderToStaticMarkup(<HomePage response={response} />);
    expect(absent).toContain("No benchmark results");
  });
  it("preserves insertion order even when the new addition has an older report date", () => {
    const results = [
      { ...result, model: { ...result.model, name: "Backfilled addition" }, reported_at: "2010-01-01" },
      { ...result, result_key: "b".repeat(64), model: { ...result.model, name: "Earlier addition" }, reported_at: "2026-01-01" },
    ];
    const markup = renderToStaticMarkup(<HomePage response={{ ...response, panels: { ...response.panels, latest_additions: results } }} />);
    expect(markup.indexOf("Backfilled addition")).toBeLessThan(markup.indexOf("Earlier addition"));
  });
  it("limits both panels to five entries", () => {
    const latest_additions = Array.from({ length: 6 }, (_, i) => ({ ...result, result_key: String(i).repeat(64), model: { ...result.model, name: `Addition ${i}` } }));
    const explore_benchmarks = Array.from({ length: 6 }, (_, i) => ({ ...response.panels.explore_benchmarks[0], benchmark: { name: `Benchmark ${i}`, slug: `benchmark-${i}`, aliases: [] } }));
    const markup = renderToStaticMarkup(<HomePage response={{ ...response, panels: { explore_benchmarks, latest_additions } }} />);
    expect(markup).toContain("Benchmark 4");
    expect(markup).toContain("Addition 4");
    expect(markup).not.toContain("Benchmark 5");
    expect(markup).not.toContain("Addition 5");
  });
  it("renders every model with a canonical directory link", () => {
    const models = Array.from({ length: 92 }, (_, i) => ({ ...response.all_models[0], registry_no: String(10000 + i), name: `Model ${i}` }));
    const markup = renderToStaticMarkup(<HomePage response={{ ...response, all_models: models }} />);
    const directory = markup.slice(markup.indexOf('id="all-models-heading"'));
    expect(directory.match(/class="home-directory__model"/gu)).toHaveLength(92);
    for (const model of models) expect(directory).toContain(`href="/models/${model.registry_no}"`);
  });
  it("shows meaningful empty states and exact zero counts", () => {
    const markup = renderToStaticMarkup(<HomePage response={{ stats: { data: { models: 0, benchmarks: 0, versions: 0, benchmark_results: 0 } }, panels: { explore_benchmarks: [], latest_additions: [] }, all_models: [] }} />);
    expect(markup).toContain("0</strong> benchmark results");
    expect(markup).toContain("No models found");
    expect(markup).toContain("No benchmarks found");
    expect(markup).toContain("No benchmark results yet");
  });
  it("shows a homepage loading state", () => {
    const markup = renderToStaticMarkup(<HomeLoadingState />);
    expect(markup).toContain("Loading homepage data");
    expect(markup).toContain('aria-busy="true"');
  });
});
