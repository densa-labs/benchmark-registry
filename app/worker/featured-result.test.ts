import { describe, expect, it } from "vitest";
import type { ResultRow } from "./api";
import { highestRecordedResult } from "./featured-result";

const result = (value: string | null, key = "a".repeat(64), reasoning: string | null = "max"): ResultRow => ({
  result_key: key, exact_result_href: null,
  model: { registry_no: "10001", name: "Example", company: { name: "Example", slug: "example" },
    released_at: "2026-01-01", release_precision: "date", published_at: "2026-01-01T00:00:00Z", status: "active" },
  benchmark: { name: "SWE-bench", slug: "swe-bench", aliases: [] },
  benchmark_version: "Verified", benchmark_version_slug: "verified", reasoning_level: reasoning,
  metric: { name: "Resolved", key: "resolved", unit: "percent", storage_kind: "decimal", display_precision: 1 },
  score: { value, raw: value ?? "not reported", display: value ? `${value}%` : "not reported" },
  evaluator_names: ["Example"], primary_source_url: "https://example.com/result",
  reported_at: "2026-01-01", reported_precision: "date",
});

describe("highest recorded benchmark result", () => {
  it("chooses the numeric maximum across benchmarks, reasoning levels and retained runs", () => {
    const highest = { ...result("94.2", "c".repeat(64), "high"),
      benchmark: { name: "GPQA", slug: "gpqa", aliases: [] },
      benchmark_version: "Diamond", benchmark_version_slug: "diamond",
      reported_at: "2025-01-01", exact_result_href: "/benchmarks/gpqa/diamond?view=history&result=" + "c".repeat(64) };
    const selected = highestRecordedResult([result("73.3"), highest, result("89", "b".repeat(64), null)]);
    expect(selected).toMatchObject({ benchmark: { name: "GPQA" }, reasoning_level: "high", score: highest.score,
      exact_result_href: highest.exact_result_href });
    expect(selected).not.toHaveProperty("model");
  });
  it("uses exact decimal values rather than display rounding, floats or string order", () => {
    expect(highestRecordedResult([result("9"), result("100", "b".repeat(64))])?.score.value).toBe("100");
    expect(highestRecordedResult([result("90.00000000000000001"), result("90.00000000000000002", "b".repeat(64))])?.result_key).toBe("b".repeat(64));
    expect(highestRecordedResult([result("-0.2"), result("-0.1", "b".repeat(64))])?.score.value).toBe("-0.1");
  });
  it("breaks equal-score ties deterministically by result key", () => {
    const a = result("73.3"), b = result("73.3", "b".repeat(64));
    expect(highestRecordedResult([b, a])?.result_key).toBe(a.result_key);
    expect(highestRecordedResult([a, b])?.result_key).toBe(a.result_key);
  });
  it("ignores text scores and preserves valid zero scores", () => {
    expect(highestRecordedResult([])).toBeNull();
    expect(highestRecordedResult([result(null)])).toBeNull();
    expect(highestRecordedResult([result(null), result("0")])?.score.value).toBe("0");
  });
});
