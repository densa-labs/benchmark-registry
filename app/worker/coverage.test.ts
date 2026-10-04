import { afterEach, beforeEach, expect, it } from "vitest";
import { seoFixture } from "./seo-fixtures";
import { coverageOptions, queryCoverage } from "./coverage";
import { handleRequest } from "./index";
let f:ReturnType<typeof seoFixture>;
beforeEach(()=>{f=seoFixture();});afterEach(()=>f.sqlite.close());
it("computes bounded, provider-balanced coverage from canonical rows",async()=>{
  const data=await queryCoverage(f.db,{models:3,benchmarks:2,days:90});
  expect(data.models).toHaveLength(3);expect(new Set(data.models.map(row=>row.provider_slug)).size).toBe(3);
  expect(data.benchmarks).toHaveLength(2);
  const expected=f.sqlite.prepare("SELECT count(*) AS n FROM results").get() as {n:number};
  expect(data.providers.reduce((n,row)=>n+row.records,0)).toBe(expected.n);
  for(const cell of data.cells) expect(data.models.some(row=>row.registry_no===cell.registry_no)).toBe(true);
  expect(data.updated).toBe("2026-09-17T00:00:00Z");expect(data.stale.length).toBeGreaterThan(0);
});
it("renders coverage without a public API and handles an empty database",async()=>{
  const response=await handleRequest(new Request("https://benchmarkregistry.org/coverage"),f.env);
  expect(response.status).toBe(200);const html=await response.text();
  expect(html).toContain("Coverage matrix");expect(html).toContain("Stale results");expect(html).toContain('rel="canonical" href="https://benchmarkregistry.org/coverage"');
  f.sqlite.exec("DELETE FROM result_sources; DELETE FROM result_evaluators; DELETE FROM results;");
  const data=await queryCoverage(f.db,{models:25,benchmarks:15,days:90});expect(data.cells).toEqual([]);expect(data.stale).toEqual([]);
});
it("validates limits and configuration without interpolating user SQL",()=>{
  expect(coverageOptions(new URL("https://example.org/coverage"),{})).toEqual({models:25,benchmarks:15,days:90});
  for(const query of ["?models=101","?models=0","?models=1&models=2","?days=bad","?query=1"]) expect(()=>coverageOptions(new URL("https://example.org/coverage"+query),{})).toThrow();
});
it("caches expensive read queries briefly and refreshes after TTL",async()=>{
  const {cachedCoverage}=await import("./coverage");
  const {vi}=await import("vitest");
  const prepare=vi.spyOn(f.db,"prepare");const options={models:25,benchmarks:15,days:90};
  const first=await cachedCoverage(f.db,options);const count=prepare.mock.calls.length;
  expect(await cachedCoverage(f.db,options)).toBe(first);expect(prepare).toHaveBeenCalledTimes(count);
  vi.spyOn(Date,"now").mockReturnValue(Date.now()+61_000);
  await cachedCoverage(f.db,options);expect(prepare.mock.calls.length).toBeGreaterThan(count);
  vi.restoreAllMocks();
});
