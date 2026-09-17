import { describe, expect, it, vi } from "vitest";

import {
  formatRegistryDate,
  loadRegistryRoute,
  queryHref,
  RegistryClientError,
  resolveRegistryRoute,
} from "./registry";

describe("model route data loading", () => {
  it("recognizes only the P7.1 model routes", () => {
    expect(resolveRegistryRoute("/models")).toEqual({ kind: "models" });
    expect(resolveRegistryRoute("/models/10002")).toEqual({
      kind: "model",
      registryNo: "10002",
    });
    expect(resolveRegistryRoute("/benchmarks")).toEqual({ kind: "not-found" });
    expect(resolveRegistryRoute("/models/10002/results")).toEqual({ kind: "not-found" });
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
  });
});
