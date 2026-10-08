import { expect, it } from "vitest";
import { result } from "../src/compare-fixtures";
import type { ResultRow } from "./api";
import { benchmarkShareCard, comparisonCardRows, comparisonShareCard, fit, modelShareCard, modelShareCardPath, siteShareCard, SITE_SHARE_CARD_PATH } from "./share-card";

const row = (slug: string, reported: string, score: string | null, extra: Partial<ResultRow> = {}): ResultRow => {
  const base = result();
  return { ...base, ...extra, result_key: `${slug}-${reported}`, benchmark: { ...base.benchmark, name: slug.toUpperCase(), slug },
    reported_at: reported, score: { raw: score ?? "n/a", value: score, display: score === null ? "n/a" : `${score}%` } };
};

it("draws a model card from its most recent numeric results, one per benchmark, never by score", () => {
  const card = modelShareCard({ registry_no: "20012", name: "Example <Model>", company: "Example Labs", results: [
    row("old", "2026-01-01", "99.9"), row("a", "2026-09-01", "10.0"), row("a", "2026-08-01", "90.0"),
    row("b", "2026-09-02", "20.0", { effort: "xhigh" }), row("c", "2026-09-03", null), row("d", "2026-07-01", "30.0"), row("e", "2026-06-01", "40.0"),
  ] });
  expect(card.path).toBe(modelShareCardPath("20012"));
  expect(card.path).toBe("og/models/20012.png");
  expect(card.svg).toContain('width="1200" height="630"');
  expect(card.svg).toContain("Example &lt;Model&gt;");
  expect(card.svg).toContain("Registry No. 20012");
  expect(card.svg).toContain("xHigh effort");
  const shown = [...card.svg.matchAll(/>([A-Z]+)<tspan/gu)].map((match) => match[1]);
  expect(shown).toEqual(["B", "A", "D", "E"]);
  expect(card.svg).toContain(">10.0%<");
  expect(card.svg).not.toContain("90.0%");
  expect(card.svg).not.toContain("99.9%");
});

it("says so when a model has no numeric result, and fits long text", () => {
  expect(modelShareCard({ registry_no: "1", name: "M", company: "C", results: [] }).svg).toContain("No numeric results recorded yet");
  expect(fit("abcdef", 4)).toBe("abc…");
  expect(fit("abc", 4)).toBe("abc");
});

it("draws the site card with the current counts", () => {
  const card = siteShareCard({ models: 95, benchmarks: 84, results: 1942 });
  expect(card.path).toBe(SITE_SHARE_CARD_PATH);
  expect(card.svg).toContain("95 models · 84 benchmarks · 1,942 results");
});

it("draws a benchmark card from the family's recently reported results in the given order", () => {
  const card = benchmarkShareCard({ slug: "gpqa", name: "GPQA", models: 1, versions: 2, latest: "GPQA Diamond", results: [
    { ...row("gpqa", "2026-09-02", "20.0"), model: { ...result().model, name: "Newer <Model>" } },
    { ...row("gpqa", "2026-09-01", null), model: { ...result().model, name: "No Score" } },
    { ...row("gpqa", "2026-08-01", "90.0"), model: { ...result().model, name: "Older" } },
  ] });
  expect(card.path).toBe("og/benchmarks/gpqa.png");
  expect(card.svg).toContain("1 model · 2 versions · latest GPQA Diamond");
  expect(card.svg).toContain("Newer &lt;Model&gt;");
  expect(card.svg).not.toContain("No Score");
  expect(card.svg.indexOf("20.0%")).toBeLessThan(card.svg.indexOf("90.0%"));
});

it("draws a comparison card only from unambiguous shared results", () => {
  const a = [row("a", "2026-09-01", "10.0"), row("b", "2026-09-01", "11.0", { reasoning_level: "low" }), row("b", "2026-09-02", "12.0", { reasoning_level: "high" }), row("c", "2026-09-01", "13.0")];
  const b = [row("a", "2026-09-01", "20.0"), row("b", "2026-09-01", "21.0"), row("d", "2026-09-01", "22.0")];
  const rows = comparisonCardRows(a, b);
  expect(rows).toEqual([{ benchmark: "A", scores: ["10.0%", "20.0%"] }]);
  expect(comparisonCardRows([row("a", "2026-09-01", "10.0", { reasoning_level: "high" })], [row("a", "2026-09-01", "20.0", { reasoning_level: "low" })])).toEqual([]);
  const card = comparisonShareCard({ slug: "x-vs-y", models: [{ name: "X", company: "Lab" }, { name: "Y", company: "Lab" }], sharedBenchmarks: 2, rows });
  expect(card.path).toBe("og/compare/x-vs-y.png");
  expect(card.svg).toContain("2 shared benchmarks");
  expect(card.svg).toContain(">10.0%<");
  expect(card.svg).toContain(">20.0%<");
  expect(comparisonShareCard({ slug: "z", models: [{ name: "X", company: "L" }, { name: "Y", company: "L" }], sharedBenchmarks: 1, rows: [] }).svg).toContain("1 shared benchmark<");
});
