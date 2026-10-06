import { describe, expect, it, vi } from "vitest";
import { buildComparisonRows, comparisonHref, parseComparisonState, reasoningSelection } from "./compare";
import { loadRegistryRoute, resolveRegistryRoute } from "./registry";
import { modelA, modelB, detail, result } from "./compare-fixtures";


describe("comparison state and result identity", () => {
  it("recognizes the compare route and preserves both model and reasoning slots", () => {
    expect(resolveRegistryRoute("/compare/")).toEqual({ kind: "compare" });
    const state = parseComparisonState("?models=10001,20001&reasoning=high,max&q=GPQA&benchmarks=shared&limit=100&page=2");
    expect(state).toMatchObject({ models: ["10001", "20001"], reasoning: ["high", "max"], query: "GPQA", sharedOnly: true, limit: 100, page: 2 });
    expect(parseComparisonState(comparisonHref(state).split("?")[1])).toEqual(state);
  });

  it("round-trips unspecified and arbitrary sourced reasoning levels without delimiter collisions", () => {
    const state = parseComparisonState("?models=,20001&reasoning=,high");
    expect(state.reasoning).toEqual(["", "high"]);
    state.reasoning = ["high, extended", "50% effort"];
    expect(parseComparisonState(comparisonHref(state).split("?")[1]).reasoning).toEqual(state.reasoning);
    state.reasoning = [undefined, "high"];
    expect(parseComparisonState(comparisonHref(state).split("?")[1]).reasoning).toEqual(state.reasoning);
    state.reasoning = ["~", ""];
    expect(parseComparisonState(comparisonHref(state).split("?")[1]).reasoning).toEqual(state.reasoning);
  });

  it.each(["?models=10001,20001,30001", "?models=oops,20001", "?reasoning=high,max,low", "?page=0", "?limit=20", "?benchmarks=unknown", "?models=10001&models=20001", "?sort=score"])("rejects ambiguous or unsupported state %s", (search) => {
    expect(() => parseComparisonState(search)).toThrow();
  });

  it("filters reasoning exactly and reports an unavailable requested level", () => {
    const response = detail(modelA, [result(), result({ result_key: "b", reasoning_level: null }), result({ result_key: "c", reasoning_level: "max" })]);
    expect(reasoningSelection(response, undefined)).toMatchObject({ value: "", available: ["", "high", "max"] });
    expect(reasoningSelection(response, "max").results.map(row => row.result_key)).toEqual(["c"]);
    expect(reasoningSelection(response, "low")).toMatchObject({ value: "low", results: [], unavailable: true });
  });

  it("matches exact version/metric identities before pairing different versions", () => {
    const a = [result(), result({ result_key: "a2", benchmark_version: "Main", benchmark_version_slug: "main" })];
    const b = [result({ model: modelB, result_key: "b1" }), result({ model: modelB, result_key: "b2", benchmark_version: "Extended", benchmark_version_slug: "extended" })];
    const rows = buildComparisonRows(a, b);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ shared: true, differences: [] });
    expect(rows[1].differences).toContain("Benchmark versions differ.");
    expect(rows.flatMap(row => row.results.flat())).toHaveLength(4);
  });

  it("preserves every evaluator series and warns on different evaluator sets and metrics", () => {
    const a = [result(), result({ result_key: "a2", evaluator_names: ["Other evaluator"] })];
    const b = [result({ model: modelB, result_key: "b1", metric: { ...result().metric, key: "points", unit: "points" } })];
    const [row] = buildComparisonRows(a, b);
    expect(row.results[0]).toHaveLength(2);
    expect(row.differences).toContain("Metrics differ.");
    expect(row.differences).toContain("Evaluator sets differ.");
  });

  it("keeps one-sided benchmarks and multiple unpaired versions without inventing a match", () => {
    const a = [result(), result({ result_key: "a2", benchmark_version_slug: "main", benchmark_version: "Main" })];
    const b = [result({ result_key: "b1", benchmark: { name: "Terminal-Bench", slug: "terminal-bench", aliases: [] } })];
    const rows = buildComparisonRows(a, b);
    expect(rows).toHaveLength(3);
    expect(rows.every(row => !row.shared)).toBe(true);
  });
});

describe("comparison data loading", () => {
  it("loads the whole model directory and all latest result pages using supported API page sizes", async () => {
    const fetcher = vi.fn(async (path: RequestInfo | URL) => {
      const url = new URL(String(path), "https://example.com");
      if (url.pathname === "/api/models") return Response.json({ data: url.searchParams.get("page") === "2" ? [modelB] : [modelA], page: { number: 1, limit: 500, total_pages: 2, total_items: 2 } });
      const response = detail(url.pathname.endsWith("20001") ? modelB : modelA, [result({ result_key: url.searchParams.get("page") === "2" ? "second" : "first" })]);
      response.data.result_page.total_pages = 2;
      return Response.json(response);
    });
    const loaded = await loadRegistryRoute({ kind: "compare" }, "?models=10001,20001&reasoning=high,max&q=GPQA", fetcher);
    expect(loaded.kind).toBe("compare");
    if (loaded.kind !== "compare") throw new Error("Wrong route");
    expect(loaded.payload.models).toHaveLength(2);
    expect(loaded.payload.selected[0]?.data.results).toHaveLength(2);
    expect(fetcher.mock.calls).toHaveLength(6);
    for (const [path] of fetcher.mock.calls) {
      const url = new URL(String(path), "https://example.com");
      expect(url.searchParams.get("limit")).toBe("500");
      expect(url.searchParams.has("models")).toBe(false);
      expect(url.searchParams.has("reasoning")).toBe(false);
      expect(url.searchParams.has("q")).toBe(false);
    }
  });

  it("keeps a missing model as a recoverable selection and propagates service errors", async () => {
    const fetcher = vi.fn(async (path: RequestInfo | URL) => String(path).startsWith("/api/models?")
      ? Response.json({ data: [modelA], page: { number: 1, limit: 500, total_items: 1, total_pages: 1 } })
      : Response.json({ error: { message: "Model not found." } }, { status: 404 }));
    const loaded = await loadRegistryRoute({ kind: "compare" }, "?models=99999,", fetcher);
    expect(loaded).toMatchObject({ kind: "compare", payload: { selected: [null, null], issues: [expect.stringContaining("99999")] } });
    fetcher.mockImplementation(async () => Response.json({ error: { message: "Unavailable" } }, { status: 500 }));
    await expect(loadRegistryRoute({ kind: "compare" }, "", fetcher)).rejects.toThrow("Unavailable");
  });
});

it("defaults to shared results and drops the retired provider/release filter from old links",()=>{
  const state=parseComparisonState("?models=10001,20001&provider=openai&released_from=2026-01-01&released_to=2026-12-31");
  expect(state.sharedOnly).toBe(true);
  expect(comparisonHref(state)).toBe("/compare?models=10001%2C20001");
  expect(parseComparisonState(comparisonHref(state).split("?")[1])).toEqual(state);
  expect(parseComparisonState("?benchmarks=all").sharedOnly).toBe(false);
});
