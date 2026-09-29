-- Measured P11.9 scans: alias owner lookups and precision-aware date peers.
CREATE INDEX idx_model_aliases_owner_name ON model_aliases(model_id, normalized_name, name);
CREATE INDEX idx_benchmark_aliases_owner_name ON benchmark_aliases(benchmark_id, normalized_name, name);
CREATE INDEX idx_models_company ON models(company_id);
CREATE INDEX idx_models_date_peers ON models(substr(release_at, 1, 10), company_id) WHERE release_precision = 'date';
CREATE INDEX idx_versions_date_peers ON benchmark_versions(benchmark_id, substr(release_at, 1, 10)) WHERE release_precision = 'date';
CREATE INDEX idx_results_series ON results(model_id, reasoning_level, benchmark_version_id, metric_id, evaluator_set_key, reported_at, result_key, reported_precision);
CREATE INDEX idx_results_series_dates ON results(model_id, reasoning_level, benchmark_version_id, metric_id, evaluator_set_key, substr(reported_at, 1, 10)) WHERE reported_precision = 'date';
CREATE INDEX idx_results_date_peers ON results(substr(reported_at, 1, 10)) WHERE reported_precision = 'date';

-- An operational token, not a new public entity. Changes roll back with ingestion.
CREATE TABLE registry_revision (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    token TEXT NOT NULL
);
INSERT INTO registry_revision VALUES (1, lower(hex(randomblob(16))));

CREATE TRIGGER revision_companies_insert AFTER INSERT ON companies
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_companies_update AFTER UPDATE ON companies
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_companies_delete AFTER DELETE ON companies
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_namespaces_insert AFTER INSERT ON namespaces
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_namespaces_update AFTER UPDATE ON namespaces
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_namespaces_delete AFTER DELETE ON namespaces
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_namespace_companies_insert AFTER INSERT ON namespace_companies
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_namespace_companies_update AFTER UPDATE ON namespace_companies
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_namespace_companies_delete AFTER DELETE ON namespace_companies
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_models_insert AFTER INSERT ON models
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_models_update AFTER UPDATE ON models
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_models_delete AFTER DELETE ON models
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_model_aliases_insert AFTER INSERT ON model_aliases
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_model_aliases_update AFTER UPDATE ON model_aliases
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_model_aliases_delete AFTER DELETE ON model_aliases
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmarks_insert AFTER INSERT ON benchmarks
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmarks_update AFTER UPDATE ON benchmarks
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmarks_delete AFTER DELETE ON benchmarks
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_aliases_insert AFTER INSERT ON benchmark_aliases
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_aliases_update AFTER UPDATE ON benchmark_aliases
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_aliases_delete AFTER DELETE ON benchmark_aliases
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_versions_insert AFTER INSERT ON benchmark_versions
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_versions_update AFTER UPDATE ON benchmark_versions
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_versions_delete AFTER DELETE ON benchmark_versions
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_metrics_insert AFTER INSERT ON metrics
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_metrics_update AFTER UPDATE ON metrics
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_metrics_delete AFTER DELETE ON metrics
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_evaluator_organizations_insert AFTER INSERT ON evaluator_organizations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_evaluator_organizations_update AFTER UPDATE ON evaluator_organizations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_evaluator_organizations_delete AFTER DELETE ON evaluator_organizations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_version_evaluators_insert AFTER INSERT ON benchmark_version_evaluators
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_version_evaluators_update AFTER UPDATE ON benchmark_version_evaluators
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_benchmark_version_evaluators_delete AFTER DELETE ON benchmark_version_evaluators
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_results_insert AFTER INSERT ON results
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_results_update AFTER UPDATE ON results
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_results_delete AFTER DELETE ON results
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_result_evaluators_insert AFTER INSERT ON result_evaluators
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_result_evaluators_update AFTER UPDATE ON result_evaluators
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_result_evaluators_delete AFTER DELETE ON result_evaluators
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_result_sources_insert AFTER INSERT ON result_sources
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_result_sources_update AFTER UPDATE ON result_sources
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_result_sources_delete AFTER DELETE ON result_sources
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_registry_redirects_insert AFTER INSERT ON registry_redirects
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_registry_redirects_update AFTER UPDATE ON registry_redirects
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;

CREATE TRIGGER revision_registry_redirects_delete AFTER DELETE ON registry_redirects
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
