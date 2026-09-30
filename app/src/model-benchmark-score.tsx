import type { FeaturedResult } from "../worker/featured-result";
import { benchmarkVersionLabel } from "./benchmark-names";

export function ModelBenchmarkScore({ result }: { result?: FeaturedResult | null }) {
  if (!result) return <span className="model-benchmark-score model-benchmark-score--empty">No benchmark results</span>;
  const label = `${benchmarkVersionLabel(result.benchmark, result.benchmark_version)}${result.reasoning_level ? ` (${result.reasoning_level})` : ""}`;
  const href = result.exact_result_href ?? `/benchmarks/${result.benchmark.slug}/${result.benchmark_version_slug}`;
  return (
    <a className="model-benchmark-score" href={href} aria-label={`${label}: ${result.score.display}`}>
      <span className="model-benchmark-score__label">{label}</span>
      <span className="model-benchmark-score__value">{result.score.display}</span>
    </a>
  );
}
