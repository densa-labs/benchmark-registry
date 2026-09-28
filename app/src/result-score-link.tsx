import type { ResultRow } from "../worker/api";
import { benchmarkVersionLabel } from "./benchmark-names";

export function ResultScoreLink({ result }: { result: ResultRow }) {
  return result.exact_result_href ? (
    <a href={result.exact_result_href} title={`${result.model.name} | ${benchmarkVersionLabel(result.benchmark, result.benchmark_version)}`}>
      {result.score.display}
    </a>
  ) : result.score.display;
}
