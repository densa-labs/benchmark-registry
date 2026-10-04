import { describe, expect, it } from "vitest";
import type { ResultRow } from "../worker/api";
import { pivotResults } from "./result-pivot";
import { accessibilityRoutes } from "./accessibility-fixtures";

const route = accessibilityRoutes.find(entry => entry.loaded.kind === "model")!.loaded;
if (route.kind !== "model") throw new Error("Missing model fixture");
const fixture = route.payload.data.results[0];
const result = (benchmark: string, variant: string | null, key = `${benchmark}-${variant}`): ResultRow => ({
  ...fixture, result_key: key, benchmark: { ...fixture.benchmark, slug: benchmark }, reasoning_level: variant,
});

describe("result pivot", () => {
  it("retains a single variant and its score and citation", () => {
    const input = result("gpqa", "medium");
    const pivot = pivotResults([input]);
    expect(pivot.multiple).toBe(false);
    expect(pivot.variants).toEqual(["medium"]);
    expect(pivot.rows[0].cells.get("medium")).toEqual([input]);
  });
  it("aligns mixed variants, orders known efforts and leaves missing cells absent", () => {
    const pivot = pivotResults([result("a", "max"), result("a", "medium"), result("b", "low"), result("b", "high"), result("a", "xhigh")]);
    expect(pivot.multiple).toBe(true);
    expect(pivot.variants).toEqual(["low", "medium", "high", "xhigh", "max"]);
    expect(pivot.rows).toHaveLength(2);
    expect(pivot.rows[0].cells.has("low")).toBe(false);
    expect(pivot.rows[1].cells.has("max")).toBe(false);
  });
  it("sorts unknown labels alphabetically without rewriting them or null", () => {
    expect(pivotResults([result("a", "thinking"), result("a", "adaptive thinking, max"), result("b", null)]).variants)
      .toEqual(["", "adaptive thinking, max", "thinking"]);
  });
  it("preserves every evaluator observation and keeps versions and metrics separate", () => {
    const a = result("a", "max", "run-a"), b = result("a", "max", "run-b");
    const pivot = pivotResults([a, b, { ...a, benchmark_version_slug: "other" }, { ...a, metric: { ...a.metric, key: "other" } }]);
    expect(pivot.rows).toHaveLength(3);
    expect(pivot.rows[0].cells.get("max")).toEqual([a, b]);
  });
  it("handles empty results", () => {
    expect(pivotResults([])).toEqual({ rows: [], variants: [], multiple: false });
  });
});
