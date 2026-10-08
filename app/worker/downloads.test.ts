import { expect, it } from "vitest";
import { result } from "../src/compare-fixtures";
import { llmsText, RESULTS_CSV_COLUMNS, resultsCsv } from "./downloads";

it("writes one quoted CSV row per result in a stable order", () => {
  const base = result();
  const later = { ...base, result_key: "b", model: { ...base.model, registry_no: "20001" }, publisher: 'Lab "A", Inc.' };
  const earlier = { ...base, result_key: "a", model: { ...base.model, registry_no: "10001" }, evaluator_names: ["X", "Y"] };
  const csv = resultsCsv([later, earlier]);
  const lines = csv.trimEnd().split("\r\n");
  expect(lines[0]).toBe(RESULTS_CSV_COLUMNS.join(","));
  expect(lines).toHaveLength(3);
  expect(lines[1].startsWith("10001,")).toBe(true);
  expect(lines[1]).toContain("X; Y");
  expect(lines[2]).toContain('"Lab ""A"", Inc."');
  expect(lines[1].split(",").length).toBeGreaterThanOrEqual(RESULTS_CSV_COLUMNS.length);
  expect(resultsCsv([earlier, later])).toBe(csv);
  const labelled = resultsCsv([{ ...earlier, score_setting: { key: "mmmu-pro-overall", label: "Overall (Standard 10 options + Vision)" } }]);
  expect(labelled.trimEnd().split("\r\n")[1].endsWith(",Overall (Standard 10 options + Vision)")).toBe(true);
});

it("describes the site, its counts, licence and download for AI assistants", () => {
  const text = llmsText({ models: 95, benchmarks: 84, versions: 148, results: 942 });
  expect(text.startsWith("# Benchmark Registry\n")).toBe(true);
  expect(text).toContain("942 results across 95 models, 84 benchmarks and 148 benchmark versions");
  expect(text).toContain("https://benchmarkregistry.org/downloads/benchmark-registry-results.csv");
  expect(text).toContain("CC BY 4.0");
  expect(text).toContain("not a leaderboard");
});
