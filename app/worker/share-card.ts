// Build-time share cards (Open Graph / X large image). Each card is a
// 1200x630 SVG that scripts/build-static.mjs rasterises to PNG, because social
// platforms do not accept SVG images. Text is laid out for the Inter font the
// build bundles, so every build draws the same pixels.
import type { ResultRow } from "./api";
import { effortDisplay } from "../src/result-pivot";
import { latestReportedResults } from "./featured-result";

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;
export const SITE_SHARE_CARD_PATH = "og/site.png";
export const MODEL_CARD_RESULTS = 4;
export const modelShareCardPath = (registryNo: string) => `og/models/${registryNo}.png`;

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
