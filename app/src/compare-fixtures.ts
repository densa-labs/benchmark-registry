import type { ModelDetailResponse } from "./registry";
import type { ResultRow } from "../worker/api";

export const modelA = { name: "Model Alpha", registry_no: "10001", company: { name: "OpenAI", slug: "openai" }, released_at: "2026-09-01", release_precision: "date" as const, published_at: "2026-09-02T00:00:00Z", status: "active" as const };
export const modelB = { ...modelA, name: "Model Beta", registry_no: "20001", company: { name: "Anthropic", slug: "anthropic" } };
export function result(overrides: Partial<ResultRow> = {}): ResultRow {
  return { result_key: "a".repeat(64), exact_result_href: null, model: modelA, benchmark: { name: "GPQA", slug: "gpqa", aliases: [] }, benchmark_version: "Diamond", benchmark_version_slug: "diamond", reasoning_level: "high", metric: { key: "accuracy", name: "Accuracy", unit: "percent", storage_kind: "decimal", display_precision: 1 }, score: { value: "91.2", raw: "91.2%", display: "91.2%" }, evaluator_names: ["Evaluator"], primary_source_url: "https://example.com/result", reported_at: "2026-09-01", reported_precision: "date", ...overrides };
}
export function detail(model = modelA, results = [result()]): ModelDetailResponse {
  return { data: { model: { ...model, source_url: "https://example.com/model", aliases: [] }, redirected_from: null, results, result_page: { number: 1, limit: 500, total_items: results.length, total_pages: results.length ? 1 : 0 } } };
}
