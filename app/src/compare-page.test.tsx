// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryDocument, App } from "./App";
import { ComparePage } from "./compare-page";
import { buildComparisonRows, comparisonPage, parseComparisonState, type ComparisonResponse } from "./compare";
import { detail, modelA, modelB, result } from "./compare-fixtures";
import { serializeInitialDocument } from "./bootstrap";
import { RouteLoadingState } from "./ui/route-loading";

const shared = result({ model: modelB, result_key: "b" });
const other = result({ result_key: "c", benchmark: { name: "Terminal-Bench", slug: "terminal-bench", aliases: ["TB"] }, benchmark_version: "2.0", benchmark_version_slug: "2.0" });
const payload: ComparisonResponse = { models: [modelA, modelB], selected: [detail(modelA, [result(), other]), detail(modelB, [shared])], issues: [] };
let container: HTMLDivElement;
let root: Root | undefined;
const search = "?models=10001,20001&reasoning=high,high";
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  window.scrollTo = vi.fn();
  history.replaceState(null, "", "/compare" + search);
  document.documentElement.lang = "en";
  document.head.innerHTML = "<title>Compare models</title>";
  container = document.createElement("div"); document.body.appendChild(container);
});
afterEach(async () => {
  if (root) await act(() => root?.unmount()); root = undefined;
  document.body.replaceChildren(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});
async function mount(node: React.ReactNode) { root = createRoot(container); await act(() => root?.render(node)); }
function selectControl(selector: string) {
  const element = container.querySelector(selector);
  if (!(element instanceof HTMLSelectElement)) throw new Error(`Missing select: ${selector}`);
  return element;
}

describe("Compare page", () => {
  it("renders aligned metadata, shared/other scores, provenance, and the active header link", async () => {
    await mount(<RegistryDocument loaded={{ kind: "compare", payload }} currentSearch={search+"&benchmarks=all"} />);
    expect(container.querySelector('a[href="/compare"][aria-current="page"]')?.textContent).toBe("Compare");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("#shared-benchmarks")?.textContent).toBe("Shared benchmarks");
    expect(container.querySelector("#other-benchmarks")?.textContent).toBe("Other benchmarks");
    expect(container.querySelectorAll(".compare-result-row")).toHaveLength(2);
    expect(container.querySelectorAll('.compare-result-row [aria-label="Not available"]')).toHaveLength(1);
    expect(container.querySelectorAll('.compare-table [scope="row"]')).toHaveLength(7);
    expect(container.querySelector('a[href="https://example.com/result"]')?.getAttribute("target")).toBe("_blank");
    expect(container.textContent).toContain("September 1, 2026");
    expect(container.textContent).not.toMatch(/wins|better model|average score/i);
    const audit = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
    expect(audit.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([]);
  });

  it("explains version and evaluator differences and retains separate evaluations", async () => {
    const variant = { ...payload, selected: [detail(modelA, [result(), result({ result_key: "a2", evaluator_names: ["Other evaluator"] })]), detail(modelB, [result({ ...shared, benchmark_version: "Main", benchmark_version_slug: "main", evaluator_names: ["Different evaluator"] })])] as ComparisonResponse["selected"] };
    await mount(<ComparePage response={variant} currentSearch={search} />);
    expect(container.querySelector(".compare-context-warning")?.textContent).toContain("Potentially non-equivalent");
    expect(container.querySelectorAll(".compare-evaluation")).toHaveLength(3);
    expect(container.querySelectorAll(".compare-details > summary")).toHaveLength(1);
    expect(container.querySelector("summary")?.textContent).toContain("Evaluation details");
    expect(container.textContent).toContain("Benchmark versions differ.");
    expect(container.textContent).toContain("Evaluator sets differ.");
    expect(container.textContent).toContain("methodology is not recorded");
  });

  it.each([
    ["", "Choose two models to compare"],
    [search + "&q=absent", "No matching benchmarks"],
    ["?models=10001,20001&reasoning=missing,high&benchmarks=shared", "No shared benchmarks"],
    [search + "&page=2", "No benchmarks on this page"],
  ])("provides a useful empty state for %s", (query, title) => {
    const response = query ? payload : { models: [modelA, modelB], selected: [null, null] as ComparisonResponse["selected"], issues: [] };
    container.innerHTML = renderToString(<ComparePage response={response} currentSearch={query} />);
    expect(container.querySelector(".state-message h3")?.textContent).toBe(title);
    if (query.includes("missing")) expect(container.textContent).toContain("No results at this reasoning level");
  });

  it("supports a no-JavaScript GET selection form and exposes only sourced reasoning levels", () => {
    container.innerHTML = renderToString(<ComparePage response={payload} currentSearch={search} />);
    const form = container.querySelector<HTMLFormElement>(".compare-selectors")!;
    expect(form.method).toBe("get");
    const fields = new URLSearchParams([...new FormData(form)].map(([key, value]) => [key, String(value)]));
    expect(parseComparisonState(fields.toString())).toMatchObject({ models: ["10001", "20001"], reasoning: ["high", "high"] });
    expect([...selectControl("#compare-reasoning-0").options].map(option => option.value)).toEqual(["high"]);
    expect(container.querySelectorAll('#compare-page-size option')).toHaveLength(3);
  });

  it("searches aliases and paginates the union after shared-only filtering", () => {
    const rows = buildComparisonRows(payload.selected[0]!.data.results, payload.selected[1]!.data.results);
    expect(comparisonPage(rows, parseComparisonState("?q=TB&benchmarks=all"))).toMatchObject({ shared: [], other: [expect.objectContaining({ shared: false })], total: 1 });
    expect(comparisonPage(rows, parseComparisonState("?benchmarks=shared"))).toMatchObject({ other: [], total: 1 });
    const many = Array.from({ length: 70 }, (_, index) => result({ result_key: String(index), benchmark: { name: `Benchmark ${index}`, slug: `benchmark-${index}`, aliases: [] } }));
    const page = comparisonPage(buildComparisonRows(many, []), parseComparisonState("?page=2&benchmarks=all"));
    expect(page.other).toHaveLength(20);
    expect(page.totalPages).toBe(2);
  });

  it("updates a model with automatic reasoning, restores focus, and supports browser back", async () => {
    const loaded = { kind: "compare" as const, payload };
    const initial = { loaded, currentSearch: search };
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const href = String(input);
      const currentSearch = new URL(href, "http://localhost").search;
      const state = parseComparisonState(currentSearch);
      const selected = state.models.map(number => number === "20001" ? detail(modelB, [shared]) : detail(modelA, [result(), other])) as ComparisonResponse["selected"];
      const next = { kind: "compare" as const, payload: { ...payload, selected } };
      return new Response(`<html><head><title>Compare models</title></head><body><script id="registry-initial-document" type="application/json">${serializeInitialDocument({ loaded: next, currentSearch })}</script></body></html>`);
    });
    vi.stubGlobal("fetch", fetcher);
    await mount(<App initial={initial} />);
    const selector = selectControl("#compare-model-0");
    selector.focus();
    await act(() => { selector.value = "20001"; selector.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(window.location.search).toContain("models=20001%2C20001");
    expect(parseComparisonState(window.location.search).reasoning).toEqual([undefined, "high"]);
    expect(document.activeElement?.id).toBe("compare-model-0");
    expect(selectControl("#compare-model-0").value).toBe("20001");
    history.replaceState(null, "", "/compare" + search);
    await act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(window.location.search).toBe(search);
    expect(container.querySelector("h1")?.textContent).toBe("Compare models");
    expect(container.querySelector('[data-route-status]')?.textContent).toContain("Compare models");
  });

  it("renders a comparison loading state and preserves comparison content on navigation failure", () => {
    container.innerHTML = renderToString(<RouteLoadingState route={{ kind: "compare" }} />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll("thead th")).toHaveLength(3);
    container.innerHTML = renderToString(<RegistryDocument loaded={{ kind: "compare", payload }} currentSearch={search} navigationError="The registry data could not be loaded." />);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Unable to load registry data");
    expect(container.querySelector("h1")?.textContent).toBe("Compare models");
  });
});
