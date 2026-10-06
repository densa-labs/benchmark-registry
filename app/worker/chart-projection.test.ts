import {expect,it} from "vitest";
import {seoFixture} from "./seo-fixtures";
import {RegistryRepository} from "./repository";
import worker from "./canonical-reference";
it("renders the chart from an explicitly recorded direction and keeps absent direction hidden",async()=>{
  const f=seoFixture();try {
    const url=new Request("https://benchmarkregistry.org/benchmarks/gpqa/diamond");
    const absent=await (await worker.fetch(url,f.env)).text();expect(absent).not.toContain('id="score-chart-heading"');
    // Disposable test metadata only; production direction remains nullable.
    f.sqlite.exec("UPDATE metrics SET direction='higher', direction_source_url='https://example.com/scoring', direction_normalized_source_url='https://example.com/scoring', direction_source_checked_at='2026-09-17T00:00:00Z'");
    const response=await new RegistryRepository(f.db).benchmarkVersion("gpqa","diamond",{page:1,limit:50});
    expect(response.data.chart?.points.length).toBeGreaterThanOrEqual(5);
    const html=await (await worker.fetch(url,f.env)).text();expect(html).toContain('id="score-chart-heading"');expect(html).toContain("Data table");expect(html).toContain("score-chart-frontier");
  } finally {f.sqlite.close();}
});
