import type { BenchmarkRef } from "../worker/api";

export function benchmarkDisplayName(benchmark: Pick<BenchmarkRef, "name" | "aliases">): string {
  // A short, sourced acronym is useful when the canonical name is an expansion.
  // Keep other aliases (including prior names and version-like labels) out of titles.
  if (benchmark.name.length <= 25) return benchmark.name;
  return benchmark.aliases.find((alias) => /^[A-Z]{2,8}$/u.test(alias)) ?? benchmark.name;
}

export function benchmarkVersionLabel(benchmark: BenchmarkRef, version: string): string {
  const name = benchmarkDisplayName(benchmark);
  return version === name || version === benchmark.name ? name : `${name} ${version}`;
}
