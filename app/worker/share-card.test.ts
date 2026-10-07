import { expect, it } from "vitest";
import { result } from "../src/compare-fixtures";
import type { ResultRow } from "./api";
import { fit, modelShareCard, modelShareCardPath, siteShareCard, SITE_SHARE_CARD_PATH } from "./share-card";

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
