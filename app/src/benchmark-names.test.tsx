import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BenchmarkLink } from "./benchmark-link";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";
import { GlobalSearchPanel } from "./ui/components";

describe("benchmark naming", () => {
  const mmmu = {
    name: "Massive Multi-discipline Multimodal Understanding",
    slug: "mmmu",
    aliases: ["MMMU"],
  };

  it("uses a sourced acronym while keeping the canonical expansion accessible", () => {
    expect(benchmarkDisplayName(mmmu)).toBe("MMMU");
    const markup = renderToStaticMarkup(<BenchmarkLink benchmark={mmmu} />);
    expect(markup).toContain('href="/benchmarks/mmmu"');
    expect(markup).toContain('title="Massive Multi-discipline Multimodal Understanding"');
    expect(markup).toContain(">MMMU</a>");
  });

  it.each(["MMMU", mmmu.name])("leads with MMMU in search results for %s", (query) => {
    const markup = renderToStaticMarkup(<GlobalSearchPanel state={{
      status: "results",
      query,
      response: {
        data: [{
          entity_type: "benchmark",
          canonical_name: mmmu.name,
          matched_text: query,
          aliases: mmmu.aliases,
          href: "/benchmarks/mmmu",
        }],
        page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
      },
    }} />);
    expect(markup).toContain('class="global-search-result__name">MMMU</span>');
    expect(markup).toContain(mmmu.name);
    expect(markup).toContain('href="/benchmarks/mmmu"');
  });

  it("keeps exact version and split labels separate from family aliases", () => {
    expect(benchmarkVersionLabel({ name: "SWE-bench", slug: "swe-bench", aliases: [] }, "Verified"))
      .toBe("SWE-bench Verified");
    expect(benchmarkVersionLabel({ name: "DeepSWE", slug: "deep-swe", aliases: [] }, "1.1"))
      .toBe("DeepSWE 1.1");
    expect(benchmarkVersionLabel({ name: "AI2D", slug: "ai2d", aliases: [] }, "TEST"))
      .toBe("AI2D TEST");
    expect(benchmarkVersionLabel({ name: "ChartQA", slug: "chartqa", aliases: [] }, "TEST"))
      .toBe("ChartQA TEST");
    expect(benchmarkVersionLabel(mmmu, "MMMU")).toBe("MMMU");
  });

  it("retains recognizable full names and long names without a sourced acronym", () => {
    expect(benchmarkDisplayName({
      name: "Humanity's Last Exam",
      aliases: ["HLE"],
    })).toBe("Humanity's Last Exam");
    expect(benchmarkDisplayName({
      name: "A Long Benchmark Name Without a Known Acronym",
      aliases: [],
    })).toBe("A Long Benchmark Name Without a Known Acronym");
    expect(benchmarkDisplayName({
      name: "OSWorld",
      aliases: ["OSWorld 2.0"],
    })).toBe("OSWorld");
  });
});
