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

export function highestRecordedResult(results: ResultRow[]): FeaturedResult | null {
  let highest: ResultRow | undefined;
  for (const result of results) {
    if (result.score.value === null) continue;
    const comparison = highest ? compareDecimal(result.score.value, highest.score.value!) : 1;
    if (comparison > 0 || (comparison === 0 && result.result_key < highest!.result_key)) highest = result;
  }
  if (!highest) return null;
  const { result_key, exact_result_href, benchmark, benchmark_version,
    benchmark_version_slug, reasoning_level, score } = highest;
  return { result_key, exact_result_href, benchmark, benchmark_version,
    benchmark_version_slug, reasoning_level, score };
}
