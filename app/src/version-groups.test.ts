import { describe, expect, it } from "vitest";
import { groupVersions } from "./version-groups";
import type { BenchmarkVersionSummary } from "../worker/api";
import { buildSeoSnapshot } from "../worker/seo-data";
import { buildPageMetadata } from "./seo";

const version = (name: string, slug = name): BenchmarkVersionSummary => ({
  benchmark: { name: "Terminal-Bench", slug: "terminal-bench", aliases: [] },
  version: name, version_slug: slug, released_at: "2026-05-06", release_precision: "date",
  metric: { name: "Accuracy", key: "accuracy", unit: "percent", storage_kind: "decimal", display_precision: 1 },
});

describe("version grouping", () => {
  it("groups exact base variants while retaining original routes and dates", () => {
    const child = { ...version("2.1 — Claude Code", "2-1-claude-code"), released_at: "2026-06-01" };
    const base = version("2.1", "2-1");
    const groups = groupVersions([child, version("4.0"), base, version("2.1 - Terminus-2")]);
    expect(groups.map(group => group.base.version)).toEqual(["2.1", "4.0"]);
    expect(groups[0].variants).toEqual([child, version("2.1 - Terminus-2")]);
    expect(groups[0].base).toBe(base);
  });
  it("keeps absent, ambiguous and unspaced parents flat", () => {
    const input = [version("2.1 - Missing"), version("Science 0.1"), version("2.0-Terminus"),
      version("2.0", "a"), version("2.0", "b"), version("2.0 — Child"), version("2.0 — Child — Detail")];
    expect(groupVersions(input).map(group => group.base)).toEqual(input);
    expect(groupVersions(input).every(group => group.variants.length === 0)).toBe(true);
  });
  it("handles empty lists and standalone versions", () => {
    expect(groupVersions([])).toEqual([]);
    expect(groupVersions([version("1.0")])).toEqual([{ base: version("1.0"), variants: [] }]);
  });
  it("groups configuration rows under the version their dataset label names", () => {
    const harness = (name: string, slug: string, dataset: string) => ({ ...version(name, slug),
      configuration: { key: "x", label: "X harness", kind: "harness" as const }, dataset_label: dataset });
    const science = version("Science 0.1", "science-0.1");
    const timeout = harness("Science 0.1 — 6x verifier timeout", "science-0.1-6x", "Science 0.1");
    const orphan = harness("Reasoning — No tools", "reasoning-no-tools", "Reasoning");
    const groups = groupVersions([timeout, science, orphan]);
    expect(groups.map(group => group.base.version_slug)).toEqual(["science-0.1", "reasoning-no-tools"]);
    expect(groups[0].variants).toEqual([timeout]);
  });
});

describe("family SEO version count", () => {
  it("counts versions as the page does, not variants and configurations", () => {
    const checked = { checked: "2026-10-01T00:00:00Z", source: "https://example.com/" };
    const versions = [version("4.0"), version("2.1"), version("2.1 — Claude Code", "2-1-claude-code")].map(row => ({ ...row, ...checked }));
    const family = { name: "Terminal-Bench", slug: "terminal-bench", aliases: [], checked: checked.checked };
    const page = buildSeoSnapshot({ models: [], companies: [], families: [family], versions, results: [] }).pages["/benchmarks/terminal-bench"];
    expect(page.versions).toBe(2);
    expect(buildPageMetadata(page).description).toContain("across 2 versions");
  });
});
