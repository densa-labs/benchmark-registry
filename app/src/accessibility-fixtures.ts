import type { LoadedRegistryRoute } from "./registry";

const page = { number: 1, limit: 50 as const, total_items: 1, total_pages: 1 };
const company = { name: "OpenAI", slug: "openai", established_at: "2015-12-11", established_precision: "date" as const, entity_kind: "company" as const, established_basis: "source" as const };
const model = { name: "Test model", registry_no: "10001", company, released_at: "2026-01-01", release_precision: "date" as const, published_at: "2026-01-02T00:00:00Z", status: "active" as const };
const benchmark = { name: "GPQA", slug: "gpqa", aliases: [] };
const metric = { name: "Accuracy", key: "accuracy", unit: "percent", storage_kind: "decimal" as const, display_precision: 1 };
const version = { benchmark, version: "Diamond", version_slug: "diamond", released_at: "2023-11-20", release_precision: "date" as const, metric };
const result = { result_key: "a".repeat(64), model, benchmark, benchmark_version: "Diamond", benchmark_version_slug: "diamond", exact_result_href: "/benchmarks/gpqa/diamond?view=history&result=" + "a".repeat(64), reasoning_level: "high", metric, score: { raw: "80%", value: "80", display: "80.0%" }, evaluator_names: ["OpenAI"], primary_source_url: "https://example.com/result", reported_at: "2026-01-01", reported_precision: "date" as const };
const models = { data: [model], page };

// Small typed presentation fixtures; canonical/data equivalence stays in Worker tests.
export const accessibilityRoutes: { path: string; loaded: LoadedRegistryRoute }[] = [
  { path: "/", loaded: { kind: "home", payload: { recent_models: models, recently_added: models, all_models: [model], stats: { data: { models: 1, benchmarks: 1, versions: 1, benchmark_results: 1 } } } } },
  { path: "/models", loaded: { kind: "models", payload: models } },
  { path: "/models/10001", loaded: { kind: "model", payload: { data: { model: { ...model, source_url: "https://example.com/model", aliases: [] }, redirected_from: null, results: [result], result_page: page } } } },
  { path: "/benchmarks", loaded: { kind: "benchmarks", payload: { data: [{ benchmark, latest_version: version.version, latest_released_at: version.released_at, latest_release_precision: version.release_precision }], page } } },
  { path: "/benchmarks/gpqa", loaded: { kind: "benchmark", payload: { data: { benchmark, versions: [version] } } } },
  { path: "/benchmarks/gpqa/diamond", loaded: { kind: "benchmark-version", payload: { data: { version, evaluator_names: ["OpenAI"], source_url: "https://example.com/gpqa", view: "latest", company: null, results: [result], result_page: page }, available_companies: [company] } } },
  { path: "/companies", loaded: { kind: "companies", payload: { data: [{ ...company, latest_model: model }], page } } },
  { path: "/companies/openai", loaded: { kind: "company", payload: { data: { company, latest_model: model, results: [result], result_page: page } } } },
  { path: "/models/99999", loaded: { kind: "not-found" } },
];
