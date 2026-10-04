import { describe, expect, it, vi } from "vitest";

import {
  formatRegistryDate,
  formatRegistryMonthYear,
  loadRegistryRoute,
  queryHref,
  RegistryClientError,
  resolveRegistryRoute,
  searchRegistry,
} from "./registry";
import { accessibilityRoutes } from "./accessibility-fixtures";

describe("registry route data loading", () => {
  it("recognizes the implemented model, benchmark, and company routes", () => {
    expect(resolveRegistryRoute("/")).toEqual({ kind: "home" });
    expect(resolveRegistryRoute("/models")).toEqual({ kind: "models" });
    expect(resolveRegistryRoute("/models/10002")).toEqual({
      kind: "model",
      registryNo: "10002",
    });
    expect(resolveRegistryRoute("/benchmarks")).toEqual({ kind: "benchmarks" });
    expect(resolveRegistryRoute("/benchmarks/gpqa")).toEqual({
      kind: "benchmark",
      slug: "gpqa",
    });
    expect(resolveRegistryRoute("/benchmarks/gpqa/diamond")).toEqual({
      kind: "benchmark-version",
      slug: "gpqa",
      version: "diamond",
    });
    expect(resolveRegistryRoute("/companies")).toEqual({ kind: "companies" });
    expect(resolveRegistryRoute("/companies/openai")).toEqual({
      kind: "company",
      slug: "openai",
    });
    expect(resolveRegistryRoute("/models/10002/results")).toEqual({ kind: "not-found" });
    expect(resolveRegistryRoute("/benchmarks/gpqa/diamond/results"))
      .toEqual({ kind: "not-found" });
  });

  it("loads homepage panels and the complete model directory", async () => {
    const panels = { explore_benchmarks: [], latest_additions: [] };
    const directory = { data: [{ registry_no: "10001", name: "Alpha" }], page: { number: 1, limit: 500, total_items: 2, total_pages: 2 } };
    const finalPage = { data: [{ registry_no: "10002", name: "Beta" }], page: { number: 2, limit: 500, total_items: 2, total_pages: 2 } };
    const stats = { data: { benchmark_results: 594, models: 2, benchmarks: 53, versions: 104 } };
    const fetcher = vi.fn().mockImplementation((path: string) => Promise.resolve(Response.json(
      path === "/api/stats" ? stats : path === "/api/home-panels" ? panels : path.endsWith("page=2") ? finalPage : directory,
    )));
    const loaded = await loadRegistryRoute({ kind: "home" }, "", fetcher);
    expect(fetcher.mock.calls.map(([path]) => path)).toEqual([
      "/api/stats", "/api/home-panels", "/api/models?sort=name&order=asc&limit=500", "/api/models?sort=name&order=asc&limit=500&page=2",
    ]);
    expect(loaded).toEqual({ kind: "home", payload: { stats, panels, all_models: [...directory.data, ...finalPage.data] } });
  });

  it("surfaces homepage panel failures", async () => {
    const fetcher = vi.fn().mockImplementation((path: string) => Promise.resolve(
      path === "/api/home-panels" ? Response.json({ error: { message: "Panels unavailable." } }, { status: 503 }) : Response.json({ data: [], page: { total_pages: 0 } }),
    ));
    await expect(loadRegistryRoute({ kind: "home" }, "", fetcher)).rejects.toEqual(new RegistryClientError("Panels unavailable."));
  });

  it("loads company list and detail routes through canonical API paths", async () => {
    const fetcher = vi.fn().mockImplementation(() =>
      Promise.resolve(Response.json({ data: [], page: {} })),
    );

    const companies = await loadRegistryRoute(
      { kind: "companies" },
      "?sort=name",
      fetcher,
    );
    const company = await loadRegistryRoute(
      { kind: "company", slug: "openai" },
      "?view=history",
      fetcher,
    );

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "/api/companies?sort=name",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/companies/openai?view=history",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(companies.kind).toBe("companies");
    expect(company.kind).toBe("company");
  });

  it("forwards shareable query state to the matching read API", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [], page: {} }));

    const loaded = await loadRegistryRoute(
      { kind: "models" },
      "?q=gpt&limit=100",
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "/api/models?q=gpt&limit=100",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(loaded.kind).toBe("models");
  });

  it("loads benchmark family and version routes through canonical API paths", async () => {
    const fetcher = vi.fn().mockImplementation((path: string) => {
      if (path === "/api/benchmarks/swe-bench") {
        return Promise.resolve(Response.json({ data: {} }));
      }
      return Promise.resolve(Response.json({
        data: {
          results: [{ model: { company: { name: "OpenAI", slug: "openai" } } }],
          result_page: { total_pages: 1 },
        },
      }));
    });

    const family = await loadRegistryRoute(
      { kind: "benchmark", slug: "swe-bench" },
      "",
      fetcher,
    );
    const version = await loadRegistryRoute(
      { kind: "benchmark-version", slug: "gpqa", version: "diamond" },
      "?view=history&company=openai",
      fetcher,
    );

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "/api/benchmarks/swe-bench",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/benchmarks/gpqa/diamond?view=history&company=openai",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      "/api/benchmarks/gpqa/diamond?view=history&limit=500&page=1",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(family.kind).toBe("benchmark");
    expect(version.kind).toBe("benchmark-version");
    if (version.kind === "benchmark-version") {
      expect(version.payload.available_companies).toEqual([
        { name: "OpenAI", slug: "openai" },
      ]);
    }
  });

  it("maps missing records and stable API errors to UI states", async () => {
    const missing = vi.fn().mockResolvedValue(Response.json(
      { error: { code: "not_found", message: "Model not found." } },
      { status: 404 },
    ));
    await expect(loadRegistryRoute({ kind: "model", registryNo: "99999" }, "", missing))
      .resolves.toEqual({ kind: "not-found" });

    const invalid = vi.fn().mockResolvedValue(Response.json(
      { error: { code: "invalid_query", message: "Limit is invalid." } },
      { status: 400 },
    ));
    await expect(loadRegistryRoute({ kind: "models" }, "?limit=1", invalid))
      .rejects.toEqual(new RegistryClientError("Limit is invalid."));

    const failedStats = vi.fn().mockImplementation((path: string) => Promise.resolve(
      path === "/api/stats"
        ? Response.json({ error: { message: "Statistics unavailable." } }, { status: 503 })
        : Response.json({ data: [], page: { total_pages: 0 } }),
    ));
    await expect(loadRegistryRoute({ kind: "home" }, "", failedStats))
      .rejects.toEqual(new RegistryClientError("Statistics unavailable."));
  });
});

describe("model URL state and date presentation", () => {
  it("preserves filters while replacing requested query fields", () => {
    expect(queryHref(
      "/models/10002",
      "?q=swe&view=history&page=4&limit=100",
      { view: "latest", page: null },
    )).toBe("/models/10002?q=swe&view=latest&limit=100");
  });

  it("formats date and timestamp precision without inferring local time", () => {
    expect(formatRegistryDate("2025-04-14", "date")).toBe("April 14, 2025");
    expect(formatRegistryDate("2025-04-14T16:30:00Z", "timestamp"))
      .toContain("April 14, 2025");
    expect(formatRegistryDate("2025-04-14T16:30:00Z", "timestamp")).toContain("UTC");
    expect(formatRegistryDate("2015", "year")).toBe("2015");
    expect(formatRegistryMonthYear("2025-04-14")).toBe("April 2025");
  });
});

describe("complete model observations for HTML", () => {
  const route = accessibilityRoutes.find(entry => entry.loaded.kind === "model")!.loaded;
  if (route.kind !== "model") throw new Error("Missing model fixture");
  const seed = route.payload;
  it("collects all API pages before grouping, preserves query state and defaults to benchmark name", async () => {
    const calls: string[] = [];
    const a = { ...seed.data.results[0], result_key: "a", reasoning_level: "medium", benchmark: { ...seed.data.results[0].benchmark, name: "Alpha" } };
    const b = { ...a, result_key: "b", reasoning_level: "max", benchmark: { ...a.benchmark, name: "Beta" } };
    const c = { ...a, result_key: "c", reasoning_level: "max" };
    const fetcher = (async (input: string) => {
      calls.push(input);
      const params = new URL(input, "https://registry.test").searchParams;
      const rows = params.get("limit") !== "500" ? [a] : params.get("page") === "1" ? [b, a] : [c];
      return Response.json({ data: { ...seed.data, results: rows, result_page: { number: Number(params.get("page") ?? 1), limit: Number(params.get("limit") ?? 50), total_items: 3, total_pages: 2 } } });
    }) as typeof fetch;
    const loaded = await loadRegistryRoute({ kind: "model", registryNo: "10001" }, "?q=alpha&view=latest&page=2", fetcher);
    expect(loaded.kind).toBe("model");
    if (loaded.kind !== "model") throw new Error("Expected model");
    expect(loaded.payload.data.all_results).toEqual([a, c, b]);
    expect(calls).toEqual(["/api/models/10001?q=alpha&view=latest&page=2", "/api/models/10001?q=alpha&view=latest&page=1&limit=500", "/api/models/10001?q=alpha&view=latest&page=2&limit=500"]);
  });
  it("retains explicit source order and avoids extra requests for a complete page", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(seed)));
    const loaded = await loadRegistryRoute({ kind: "model", registryNo: "10001" }, "?sort=source&order=desc", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    if (loaded.kind !== "model") throw new Error("Expected model");
    expect(loaded.payload.data.all_results).toEqual(seed.data.results);
  });
  it("surfaces failures when a remaining API page is unavailable", async () => {
    const fetcher = vi.fn().mockImplementationOnce(() => Promise.resolve(Response.json({ data: { ...seed.data, result_page: { ...seed.data.result_page, total_items: 501 } } })))
      .mockImplementationOnce(() => Promise.resolve(Response.json({ error: { message: "Unavailable" } }, { status: 503 })));
    await expect(loadRegistryRoute({ kind: "model", registryNo: "10001" }, "", fetcher)).rejects.toThrow("Unavailable");
  });
});

describe("global search client", () => {
  it("requests the bounded search endpoint and returns its stable response", async () => {
    const payload = {
      data: [{
        entity_type: "model",
        canonical_name: "GPT-6 Astra",
        matched_text: "GPT-6 Astra",
        href: "/models/10006",
      }],
      page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
    };
    const fetcher = vi.fn().mockResolvedValue(Response.json(payload));

    await expect(searchRegistry("GPT-6 Astra", fetcher)).resolves.toEqual(payload);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/search?q=GPT-6+Astra&limit=50",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("surfaces the API's stable search error message", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(
      { error: { code: "invalid_query", message: "Search query is too long." } },
      { status: 400 },
    ));

    await expect(searchRegistry("query", fetcher))
      .rejects.toEqual(new RegistryClientError("Search query is too long."));
  });
});
