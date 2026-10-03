import { expect, it } from "vitest";
import { buildPageMetadata, cleanSeoText, seoDescription, seoTitle, entityTitle } from "./seo";
import type { SeoPage, SeoKind } from "../worker/seo-data";
const fixture = (kind:SeoKind,name:string):SeoPage => ({kind,name,records:11,models:8,benchmarks:7,versions:3,organizations:2,updated:"2026-10-02T12:00:00Z",sources:[]});
it("bounds metadata for every page type and retains unique factual templates", () => {
  const pages:SeoPage[] = [fixture("home","Registry"),fixture("models","Models"),fixture("benchmarks","Benchmarks"),fixture("companies","Organizations"),
    {...fixture("model","Jamba 1.7 Mini"),provider:"AI21",registryNo:"21001"},fixture("model","Claude Opus 5.5"),
    fixture("benchmark","MMMU-Pro"),{...fixture("benchmark-version","MMMU-Pro With tools"),metric:"Accuracy",released:"2026-03-05"},fixture("company","Anthropic")];
  const metadata=pages.map(buildPageMetadata);
  expect(new Set(metadata.map(page=>page.title)).size).toBe(pages.length);
  expect(new Set(metadata.map(page=>page.description)).size).toBe(pages.length);
  for(const page of metadata) {
    expect(page.title.length).toBeLessThanOrEqual(70);
    expect(page.description.length).toBeLessThanOrEqual(160);
    expect(page.title+page.description).not.toMatch(/\b(Unspecified|Unknown|undefined|null|default)\b/iu);
  }
});
it("omits missing facts and placeholder clauses without inventing values",()=>{
  const metadata=buildPageMetadata({...fixture("benchmark-version","MMMU-Pro default"),metric:"Unknown",released:undefined});
  expect(metadata.title).toBe("MMMU-Pro Results & Scores | Benchmark Registry");
  expect(metadata.description).not.toContain("Metric:");
  expect(metadata.description).not.toContain("Released");
  expect(cleanSeoText("Unspecified undefined null default Unknown")).toBe("");
});
it("shortens long labels without removing the primary benchmark keywords first",()=>{
  expect(seoTitle("An exceptionally long model name with many recorded variants Benchmark Results").length).toBeLessThanOrEqual(70);
  expect(seoDescription(["A".repeat(200)]).length).toBeLessThanOrEqual(160);
});
it("includes real homepage counts and a data date",()=>{
  expect(buildPageMetadata(fixture("home","Registry")).description).toBe("AI model benchmark results from primary sources: 8 models, 7 benchmarks, 11 records. Updated 2026-10-02.");
});

it("preserves result keywords and compacts repeated family names in long comparison titles",()=>{
  const long=entityTitle("NVIDIA Nemotron 3 Super 120B-A12B","Benchmark Results & Scores","Benchmark Results");
  expect(long).toContain("Benchmark Results | Benchmark Registry");expect(long.length).toBeLessThanOrEqual(70);
  const comparison=buildPageMetadata(fixture("comparison","Claude Opus 5 vs Claude Opus 5.5"));
  expect(comparison.title).toBe("Claude Opus 5 vs 5.5: Benchmark Comparison | Benchmark Registry");
});
