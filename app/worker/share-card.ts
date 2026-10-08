// Build-time share cards (Open Graph / X large image). Each card is a
// 1200x630 SVG that scripts/build-static.mjs rasterises to PNG, because social
// platforms do not accept SVG images. Text is laid out for the Inter font the
// build bundles, so every build draws the same pixels.
import type { ResultRow } from "./api";
import { effortDisplay } from "../src/result-pivot";
import { latestReportedResults } from "./featured-result";
import { buildComparisonRows } from "../src/compare";
import { benchmarkDisplayName } from "../src/benchmark-names";

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;
export const SITE_SHARE_CARD_PATH = "og/site.png";
export const MODEL_CARD_RESULTS = 4;
export const modelShareCardPath = (registryNo: string) => `og/models/${registryNo}.png`;
export const benchmarkShareCardPath = (slug: string) => `og/benchmarks/${slug}.png`;
export const comparisonShareCardPath = (slug: string) => `og/compare/${slug}.png`;

export interface ShareCard { path: string; svg: string }
export interface ModelCardInput {
  registry_no: string;
  name: string;
  company: string;
  results: ResultRow[];
}

const escapeXml = (value: string) => value.replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
/** Cuts text to a character budget sized for Inter at the given font size. */
export function fit(value: string, maxCharacters: number): string {
  const characters = [...value];
  return characters.length <= maxCharacters ? value : characters.slice(0, maxCharacters - 1).join("").trimEnd() + "…";
}

const FONT = "Inter";
const INK = "#18181b", MUTED = "#52525b", RULE = "#e4e4e7", ACCENT = "#1e3a5f";
function frame(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" viewBox="0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}">`
    + `<rect width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" fill="#ffffff"/><rect width="${SHARE_CARD_WIDTH}" height="10" fill="${ACCENT}"/>`
    + `<g font-family="${FONT}">${body}`
    + `<text x="80" y="580" font-size="24" fill="${MUTED}">benchmarkregistry.org · Every score links to its primary source</text></g></svg>`;
}
const wordmark = `<text x="80" y="90" font-size="24" font-weight="600" fill="${ACCENT}" letter-spacing="2">BENCHMARK REGISTRY</text>`;

/** The model's name, developer, Registry No. and its most recent results, one per benchmark. */
export function modelShareCard(model: ModelCardInput): ShareCard {
  const nameSize = [...model.name].length > 26 ? 52 : 64;
  const rows = latestReportedResults(model.results, MODEL_CARD_RESULTS).map((result, index) => {
    const y = 300 + index * 64;
    const version = result.benchmark_version === result.benchmark.name ? null : result.benchmark_version;
    const detail = [version, result.effort ? `${effortDisplay(result.effort)} effort` : null].filter(Boolean).join(" · ");
    return `<line x1="80" y1="${y - 42}" x2="1120" y2="${y - 42}" stroke="${RULE}" stroke-width="2"/>`
      + `<text x="80" y="${y}" font-size="30" fill="${INK}">${escapeXml(fit(result.benchmark.name, 28))}<tspan dx="16" fill="${MUTED}" font-size="24">${escapeXml(fit(detail, 34))}</tspan></text>`
      + `<text x="1120" y="${y}" font-size="32" font-weight="700" fill="${INK}" text-anchor="end">${escapeXml(fit(result.score.display, 12))}</text>`;
  }).join("");
  return {
    path: modelShareCardPath(model.registry_no),
    svg: frame(wordmark
      + `<text x="1120" y="90" font-size="24" fill="${MUTED}" text-anchor="end">Registry No. ${escapeXml(model.registry_no)}</text>`
      + `<text x="80" y="170" font-size="${nameSize}" font-weight="700" fill="${INK}">${escapeXml(fit(model.name, nameSize === 64 ? 26 : 34))}</text>`
      + `<text x="80" y="218" font-size="28" fill="${MUTED}">${escapeXml(fit(`by ${model.company}`, 60))}</text>`
      + (rows || `<text x="80" y="300" font-size="30" fill="${MUTED}">No numeric results recorded yet</text>`)),
  };
}

export interface BenchmarkCardInput {
  slug: string;
  name: string;
  models: number;
  versions: number;
  /** The latest version's label, as the family page names it. */
  latest?: string;
  /** The family page's recently reported results, newest report first. */
  results: ResultRow[];
}

const count = (value: number, noun: string) => `${value.toLocaleString("en-US")} ${noun}${value === 1 ? "" : "s"}`;

/** A benchmark family: its name, coverage and its most recently reported results (by report date, never by score). */
export function benchmarkShareCard(benchmark: BenchmarkCardInput): ShareCard {
  const rows = benchmark.results.filter((result) => result.score.value !== null).slice(0, MODEL_CARD_RESULTS).map((result, index) => {
    const y = 330 + index * 56;
    const detail = result.effort ? `${effortDisplay(result.effort)} effort` : "";
    return `<line x1="80" y1="${y - 38}" x2="1120" y2="${y - 38}" stroke="${RULE}" stroke-width="2"/>`
      + `<text x="80" y="${y}" font-size="28" fill="${INK}">${escapeXml(fit(result.model.name, 30))}<tspan dx="16" fill="${MUTED}" font-size="22">${escapeXml(fit(detail, 24))}</tspan></text>`
      + `<text x="1120" y="${y}" font-size="30" font-weight="700" fill="${INK}" text-anchor="end">${escapeXml(fit(result.score.display, 12))}</text>`;
  }).join("");
  const nameSize = [...benchmark.name].length > 26 ? 52 : 64;
  const summary = [count(benchmark.models, "model"), count(benchmark.versions, "version"), benchmark.latest ? `latest ${benchmark.latest}` : null].filter(Boolean).join(" · ");
  return {
    path: benchmarkShareCardPath(benchmark.slug),
    svg: frame(wordmark
      + `<text x="80" y="170" font-size="${nameSize}" font-weight="700" fill="${INK}">${escapeXml(fit(benchmark.name, nameSize === 64 ? 26 : 34))}</text>`
      + `<text x="80" y="218" font-size="28" fill="${MUTED}">${escapeXml(fit(summary, 60))}</text>`
      + (rows ? `<text x="80" y="268" font-size="22" fill="${MUTED}">Recently reported</text>${rows}` : "")),
  };
}

export interface ComparisonCardInput {
  slug: string;
  models: [{ name: string; company: string }, { name: string; company: string }];
  sharedBenchmarks: number;
  /** Shared benchmarks where each side has exactly one result in the same version and metric. */
  rows: { benchmark: string; scores: [string, string] }[];
}

/** Shared rows the card can show without context: same version, metric, evaluators, reasoning level and configuration, one numeric result per side; one row per benchmark. */
export function comparisonCardRows(a: ResultRow[], b: ResultRow[]): ComparisonCardInput["rows"] {
  const seen = new Set<string>();
  return buildComparisonRows(a, b).filter((row) => row.shared && !row.differences.length && row.results.every((side) => side.length === 1 && side[0].score.value !== null)
    && (row.results[0][0].reasoning_level ?? "") === (row.results[1][0].reasoning_level ?? "")
    && (row.results[0][0].configuration?.label ?? "") === (row.results[1][0].configuration?.label ?? ""))
    .filter((row) => !seen.has(row.benchmark.slug) && Boolean(seen.add(row.benchmark.slug)))
    .map((row) => ({ benchmark: benchmarkDisplayName(row.benchmark), scores: [row.results[0][0].score.display, row.results[1][0].score.display] }));
}

/** Two models side by side on their unambiguous shared results; no score is highlighted. */
export function comparisonShareCard(pair: ComparisonCardInput): ShareCard {
  const [a, b] = pair.models;
  const rows = pair.rows.slice(0, MODEL_CARD_RESULTS).map((row, index) => {
    const y = 360 + index * 52;
    return `<line x1="80" y1="${y - 36}" x2="1120" y2="${y - 36}" stroke="${RULE}" stroke-width="2"/>`
      + `<text x="80" y="${y}" font-size="28" fill="${INK}">${escapeXml(fit(row.benchmark, 34))}</text>`
      + row.scores.map((score, side) => `<text x="${side ? 1120 : 880}" y="${y}" font-size="30" font-weight="700" fill="${INK}" text-anchor="end">${escapeXml(fit(score, 10))}</text>`).join("");
  }).join("");
  const header = rows ? [a, b].map((model, side) => `<text x="${side ? 1120 : 880}" y="300" font-size="20" fill="${MUTED}" text-anchor="end">${escapeXml(fit(model.name, 16))}</text>`).join("") : "";
  return {
    path: comparisonShareCardPath(pair.slug),
    svg: frame(wordmark
      + `<text x="80" y="160" font-size="52" font-weight="700" fill="${INK}">${escapeXml(fit(a.name, 34))}</text>`
      + `<text x="80" y="225" font-size="52" font-weight="700" fill="${INK}"><tspan fill="${MUTED}" font-weight="400">vs </tspan>${escapeXml(fit(b.name, 30))}</text>`
      + `<text x="80" y="300" font-size="24" fill="${MUTED}">${escapeXml(fit(`${count(pair.sharedBenchmarks, "shared benchmark")}`, 40))}</text>`
      + header + rows),
  };
}

/** The card every page without its own card shares. */
export function siteShareCard(counts: { models: number; benchmarks: number; results: number }): ShareCard {
  const number = (value: number) => value.toLocaleString("en-US");
  return {
    path: SITE_SHARE_CARD_PATH,
    svg: frame(wordmark
      + `<text x="80" y="250" font-size="72" font-weight="700" fill="${INK}">AI model benchmark results,</text>`
      + `<text x="80" y="340" font-size="72" font-weight="700" fill="${INK}">each linked to its source.</text>`
      + `<text x="80" y="440" font-size="34" fill="${MUTED}">${number(counts.models)} models · ${number(counts.benchmarks)} benchmarks · ${number(counts.results)} results</text>`),
  };
}
