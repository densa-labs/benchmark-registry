import type { BenchmarkRef } from "../worker/api";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";

export function BenchmarkLink({
  benchmark,
  version,
}: {
  benchmark: BenchmarkRef;
  version?: string;
}) {
  const name = version === undefined
    ? benchmarkDisplayName(benchmark)
    : benchmarkVersionLabel(benchmark, version);
  return (
    <a
      className="benchmark-link"
      href={`/benchmarks/${benchmark.slug}`}
      title={version === undefined ? benchmark.name : `${benchmark.name} ${version}`}
    >
      {name}
    </a>
  );
}
