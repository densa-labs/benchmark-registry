import type { ResultRow } from "../worker/api";
import { formatRegistryDate } from "./registry";
import { SourceLink } from "./ui/components";

export function ResultDetails({ result, showEvaluator = false }: { result: ResultRow; showEvaluator?: boolean }) {
  const metric = result.metric.name?.trim();
  const hasDate = Boolean(result.reported_at) && Number.isFinite(Date.parse(result.reported_at));
  return <span className="result-details">
    {metric && metric.toLowerCase() !== "unknown" ? <span>{metric}</span> : null}
    {hasDate ? <span>Reported <time dateTime={result.reported_at}>{formatRegistryDate(result.reported_at, result.reported_precision)}</time></span> : null}
    {showEvaluator && result.evaluator_names.length ? <span>{result.evaluator_names.join(", ")}</span> : null}
  </span>;
}

export function ResultSource({ result }: { result: ResultRow }) {
  return <span className="table-cell-stack">
    <SourceLink href={result.primary_source_url} context={`${result.model.name}${result.reasoning_level ? ` (${result.reasoning_level})` : ""} on ${result.benchmark.name} ${result.benchmark_version}`} />
    <ResultDetails result={result} />
  </span>;
}
