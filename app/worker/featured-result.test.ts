import { describe, expect, it } from "vitest";
import type { ResultRow } from "./api";
import { compareDecimal, latestReportedResult } from "./featured-result";

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

const on = (reported_at: string, value: string | null, name: string, key: string, extra: Partial<ResultRow> = {}): ResultRow =>
  ({ ...result(value, key), reported_at, benchmark: { name, slug: name.toLowerCase(), aliases: [] }, ...extra });

describe("featured result: the latest reported result, never the highest score", () => {
  it("picks the most recent report even when an older result scores higher", () => {
    const older = on("2025-01-01", "99.9", "GPQA", "a".repeat(64));
    const newer = on("2026-03-01", "12.5", "SWE-bench", "b".repeat(64), { exact_result_href: "/benchmarks/swe-bench/verified?view=history&result=" + "b".repeat(64) });
    const selected = latestReportedResult([older, newer]);
    expect(selected).toMatchObject({ result_key: newer.result_key, benchmark: { name: "SWE-bench" }, score: newer.score, exact_result_href: newer.exact_result_href });
    expect(selected).not.toHaveProperty("model");
  });
  it("breaks same-day ties by benchmark name, not by score or input order", () => {
    const a = on("2026-03-01", "10", "AIME", "c".repeat(64));
    const b = on("2026-03-01", "90", "Terminal-Bench", "a".repeat(64));
    expect(latestReportedResult([b, a])?.benchmark.name).toBe("AIME");
    expect(latestReportedResult([a, b])?.benchmark.name).toBe("AIME");
  });
  it("then by version, metric and reasoning level, and compares date and timestamp reports by day", () => {
    const base = on("2026-03-01", "50", "HealthBench", "c".repeat(64));
    const hard = { ...base, benchmark_version: "Hard", result_key: "d".repeat(64) };
    const timestamped = { ...base, reported_at: "2026-03-01T18:00:00Z", reported_precision: "timestamp" as const, benchmark_version: "Consensus", result_key: "e".repeat(64) };
    expect(latestReportedResult([hard, timestamped, base])?.result_key).toBe("e".repeat(64));
    const low = { ...base, reasoning_level: "low", result_key: "f".repeat(64) };
    expect(latestReportedResult([{ ...base, reasoning_level: "max" }, low])?.reasoning_level).toBe("low");
    const rerun = { ...base, result_key: "0".repeat(64) };
    expect(latestReportedResult([base, rerun])?.result_key).toBe(rerun.result_key);
  });
  it("ignores text scores and preserves valid zero scores", () => {
    expect(latestReportedResult([])).toBeNull();
    expect(latestReportedResult([result(null)])).toBeNull();
    expect(latestReportedResult([on("2026-09-01", null, "A", "a".repeat(64)), on("2026-01-01", "0", "B", "b".repeat(64))])?.score.value).toBe("0");
  });
});

describe("exact decimal comparison", () => {
  it("uses exact decimal values rather than floats or string order", () => {
    expect(compareDecimal("9", "100")).toBe(-1);
    expect(compareDecimal("90.00000000000000001", "90.00000000000000002")).toBe(-1);
    expect(compareDecimal("-0.1", "-0.2")).toBe(1);
    expect(compareDecimal("73.30", "73.3")).toBe(0);
  });
});
