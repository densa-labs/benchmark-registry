-- Coverage recent-model partition/order and provider model lookup.
CREATE INDEX idx_models_provider_recent ON models(company_id, substr(release_at, 1, 10) DESC, normalized_name, registry_no);
-- Benchmark detail/coverage newest observations; covering model + stable tie-break.
CREATE INDEX idx_results_version_recent ON results(benchmark_version_id, reported_at DESC, result_key, model_id);
-- Feed update selection uses the real recorded source-check timestamp.
CREATE INDEX idx_results_checked_recent ON results(primary_source_checked_at DESC, id DESC);
