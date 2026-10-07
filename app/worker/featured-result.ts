import type { ResultRow } from "./api";

export type FeaturedResult = Pick<ResultRow,
  "result_key" | "exact_result_href" | "benchmark" | "benchmark_version" |
  "benchmark_version_slug" | "reasoning_level" | "score"
>;

// Compare the canonical decimal strings exactly, without rounding to floats.
export function compareDecimal(left: string, right: string): number {
  const [leftWhole, leftFraction = ""] = left.split(".");
  const [rightWhole, rightFraction = ""] = right.split(".");
  const precision = Math.max(leftFraction.length, rightFraction.length);
  const scaled = (whole: string, fraction: string) =>
    BigInt(`${whole}${fraction.padEnd(precision, "0")}`);
  const a = scaled(leftWhole, leftFraction), b = scaled(rightWhole, rightFraction);
  return a > b ? 1 : a < b ? -1 : 0;
}

const text = (value: string | null | undefined) => value ?? "";
/**
 * Order for the featured result: the latest report day first, then benchmark
 * name, version, metric and reasoning level, so a tie never depends on the score
 * or on hash order. Same-day date and timestamp reports compare as peers.
 */
function latestFirst(a: ResultRow, b: ResultRow): number {
  const day = b.reported_at.slice(0, 10).localeCompare(a.reported_at.slice(0, 10), "en");
  if (day) return day;
  for (const [left, right] of [[a.benchmark.name, b.benchmark.name], [a.benchmark_version, b.benchmark_version],
    [a.metric.name, b.metric.name], [text(a.reasoning_level), text(b.reasoning_level)]] as const) {
    const comparison = left.localeCompare(right, "en");
    if (comparison) return comparison;
  }
  // Identical descriptors (a retained rerun) still resolve the same way every build.
  return a.result_key.localeCompare(b.result_key, "en");
}

/** The model's most recently reported numeric result. Never the highest score. */
export function latestReportedResult(results: ResultRow[]): FeaturedResult | null {
  const latest = results.filter((result) => result.score.value !== null).sort(latestFirst)[0];
  if (!latest) return null;
  const { result_key, exact_result_href, benchmark, benchmark_version,
    benchmark_version_slug, reasoning_level, score } = latest;
  return { result_key, exact_result_href, benchmark, benchmark_version,
    benchmark_version_slug, reasoning_level, score };
}

/**
 * Up to `limit` of the model's most recently reported numeric results, one per
 * benchmark family, in the featured order. Never chosen by score.
 */
export function latestReportedResults(results: ResultRow[], limit: number): ResultRow[] {
  const seen = new Set<string>();
  return results.filter((result) => result.score.value !== null).sort(latestFirst)
    .filter((result) => !seen.has(result.benchmark.slug) && Boolean(seen.add(result.benchmark.slug))).slice(0, limit);
}
