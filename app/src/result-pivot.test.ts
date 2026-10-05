import { describe, expect, it } from "vitest";
import type { Effort, ResultRow } from "../worker/api";
import { OTHER_SETTINGS, pivotResults, providerLabel, usesEffortLayout } from "./result-pivot";
import { accessibilityRoutes } from "./accessibility-fixtures";

const route = accessibilityRoutes.find(entry => entry.loaded.kind === "model")!.loaded;
if (route.kind !== "model") throw new Error("Missing model fixture");
const fixture = route.payload.data.results[0];
const result = (benchmark: string, effort: Effort | null, label: string | null = effort, key = `${benchmark}-${label}`): ResultRow => ({
  ...fixture, result_key: key, benchmark: { ...fixture.benchmark, slug: benchmark }, reasoning_level: label, effort, configuration: null,
});

describe("result pivot", () => {
  it("retains a single effort and its score and citation", () => {
    const input = result("gpqa", "medium");
    const pivot = pivotResults([input]);
    expect(pivot.multiple).toBe(false);
    expect(pivot.variants).toEqual(["medium"]);
    expect(pivot.rows[0].cells.get("medium")).toEqual([input]);
  });
  it("aligns mixed efforts in vocabulary order and leaves missing cells absent", () => {
    const pivot = pivotResults([result("a", "max"), result("a", "medium"), result("b", "low"), result("b", "high"), result("a", "xhigh"), result("b", "none")]);
    expect(pivot.multiple).toBe(true);
    expect(pivot.variants).toEqual(["none", "low", "medium", "high", "xhigh", "max"]);
    expect(pivot.rows).toHaveLength(2);
    expect(pivot.rows[0].cells.has("low")).toBe(false);
    expect(pivot.rows[1].cells.has("max")).toBe(false);
  });
  it("keys columns on the reviewed effort, not the provider label", () => {
    const pivot = pivotResults([result("a", "max", "adaptive thinking, max"), result("a", "max", "max"), result("a", "high", "adaptive thinking, high")]);
    expect(pivot.variants).toEqual(["high", "max"]);
    expect(pivot.rows[0].cells.get("max")).toHaveLength(2);
  });
  it("puts unreviewed labels in one column and never counts them toward the layout", () => {
    const pivot = pivotResults([result("a", null, "thinking"), result("a", null, "contemplating"), result("a", "high"), result("b", null, null)]);
    expect(pivot.variants).toEqual(["high", OTHER_SETTINGS]);
    expect(pivot.rows[0].cells.get(OTHER_SETTINGS)?.map(row => row.reasoning_level)).toEqual(["thinking", "contemplating"]);
    expect(pivot.multiple).toBe(false);
  });
  it("preserves every evaluator observation and keeps versions, metrics and configurations separate", () => {
    const a = result("a", "max", "max", "run-a"), b = result("a", "max", "max", "run-b");
    const tools = { ...a, result_key: "tools", configuration: { key: "with-tools", label: "With tools", kind: "tools" as const } };
    const pivot = pivotResults([a, b, { ...a, benchmark_version_slug: "other" }, { ...a, metric: { ...a.metric, key: "other" } }, tools]);
    expect(pivot.rows).toHaveLength(4);
    expect(pivot.rows[0].cells.get("max")).toEqual([a, b]);
  });
  it("handles empty results", () => {
    expect(pivotResults([])).toEqual({ rows: [], variants: [], multiple: false });
  });
  it("shows the provider label only when it says more than the effort", () => {
    expect(providerLabel(result("a", "high", "High"))).toBeNull();
    expect(providerLabel(result("a", "max", "adaptive thinking, max"))).toBe("adaptive thinking, max");
    expect(providerLabel(result("a", null, "thinking"))).toBe("thinking");
    expect(providerLabel(result("a", null, ""))).toBeNull();
  });
  it("uses the effort layout only on request, in the Latest view, when offered", () => {
    expect(usesEffortLayout("", { multiple: true })).toBe(false);
    expect(usesEffortLayout("?layout=effort", { multiple: true })).toBe(true);
    expect(usesEffortLayout("?layout=effort&view=history", { multiple: true })).toBe(false);
    expect(usesEffortLayout("?layout=effort", { multiple: false })).toBe(false);
  });
});
