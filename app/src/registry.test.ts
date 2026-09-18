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

  it("loads both homepage sections from ordered Models API requests", async () => {
    const recent = {
      data: [{ registry_no: "10002", name: "Recent release" }],
      page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
    };
    const added = {
      data: [{ registry_no: "30001", name: "Recent addition" }],
      page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
    };
    const fetcher = vi.fn().mockImplementation((path: string) =>
      Promise.resolve(Response.json(path.includes("sort=published") ? added : recent)),
    );

    const loaded = await loadRegistryRoute({ kind: "home" }, "", fetcher);

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "/api/models?limit=50",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/models?sort=published&order=desc&limit=50",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(loaded).toEqual({
      kind: "home",
      payload: { recent_models: recent, recently_added: added },
    });
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
