import { ReportIssue } from "./report-issue";
import { resultPage } from "./issue-report";
import type { ResultRow } from "../worker/api";
import { formatRegistryDate } from "./registry";
import { SourceLink } from "./ui/components";

export function ResultDetails({ result, showEvaluator = false, compact = false }: { result: ResultRow; showEvaluator?: boolean; compact?: boolean }) {
  const metric = result.metric.name?.trim();
  const hasDate = Boolean(result.reported_at) && Number.isFinite(Date.parse(result.reported_at));
  return <span className="result-details">
    {!compact && metric && metric.toLowerCase() !== "unknown" ? <span>{metric}</span> : null}
    {hasDate ? <span>Reported <time dateTime={result.reported_at}>{compact ? result.reported_at.slice(0, 10) : formatRegistryDate(result.reported_at, result.reported_precision)}</time></span> : null}
    {result.evaluated_at && result.evaluated_precision ? <span>Evaluated <time dateTime={result.evaluated_at}>{formatRegistryDate(result.evaluated_at, result.evaluated_precision)}</time></span> : null}
    {result.source_type && result.source_type.toLowerCase() !== "unknown" ? <span>{result.source_type}</span> : null}
    {result.publisher && result.publisher.toLowerCase() !== "unknown" ? <span>{result.publisher}</span> : null}
    {result.reporting_basis === "self-reported" || result.reporting_basis === "independent" ? <span>{result.reporting_basis === "self-reported" ? "Self-reported" : "Independent"}</span> : null}
    {(showEvaluator || !result.publisher) && result.evaluator_names.length ? <span>{result.evaluator_names.join(", ")}</span> : null}
  </span>;
}

export function ResultSource({ result }: { result: ResultRow }) {
  return <span className="table-cell-stack">
    <SourceLink href={result.primary_source_url} context={`${result.model.name}${result.reasoning_level ? ` (${result.reasoning_level})` : ""} on ${result.benchmark.name} ${result.benchmark_version}`} />
    {result.source_archive_url ? <SourceLink href={result.source_archive_url}>Archived copy</SourceLink> : null}
    <ResultDetails result={result} showEvaluator />
    <ReportIssue result={result} page={resultPage(result)} />
  </span>;
}
