import type { BenchmarkRef } from "../worker/api";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";

export function BenchmarkLink({
  benchmark,
  version,
  versionSlug,
}: {
  benchmark: BenchmarkRef;
  version?: string;
  versionSlug?: string;
}) {
  const name = version === undefined
    ? benchmarkDisplayName(benchmark)
    : benchmarkVersionLabel(benchmark, version);
  return (
    <a
      className="benchmark-link"
      href={versionSlug === undefined ? `/benchmarks/${benchmark.slug}` : `/benchmarks/${benchmark.slug}/${versionSlug}`}
      title={version === undefined ? benchmark.name : `${benchmark.name} ${version}`}
    >
      {name}
    </a>
  );
}
