CREATE TABLE companies (
    id INTEGER,
    name TEXT,
    normalized_name TEXT,
    slug TEXT,
    established_at TEXT,
    established_precision TEXT,
    established_source_url TEXT,
    established_source_normalized_url TEXT,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE namespaces (
    id INTEGER,
    name TEXT,
    prefix TEXT,
    parent_namespace_id INTEGER
);

CREATE TABLE namespace_companies (
    namespace_id INTEGER,
    company_id INTEGER,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE models (
    id INTEGER,
    canonical_name TEXT,
    normalized_name TEXT,
    company_id INTEGER,
    namespace_id INTEGER,
    sequence INTEGER,
    registry_no TEXT,
    release_at TEXT,
    release_precision TEXT,
    release_source_url TEXT,
    release_source_normalized_url TEXT,
    source_checked_at TEXT,
    published_at TEXT,
    status TEXT,
    sequence_exception_reason TEXT
);

CREATE TABLE model_aliases (
    id INTEGER,
    model_id INTEGER,
    name TEXT,
    normalized_name TEXT,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE benchmarks (
    id INTEGER,
    canonical_name TEXT,
    normalized_name TEXT,
    slug TEXT,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE benchmark_aliases (
    id INTEGER,
    benchmark_id INTEGER,
    name TEXT,
    normalized_name TEXT,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE metrics (
    id INTEGER,
    name TEXT,
    key TEXT,
    storage_kind TEXT,
    unit TEXT,
    display_precision INTEGER,
    minimum_value TEXT,
    maximum_value TEXT,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE evaluator_organizations (
    id INTEGER,
    name TEXT,
    normalized_name TEXT,
    key TEXT,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE benchmark_versions (
    id INTEGER,
    benchmark_id INTEGER,
    version TEXT,
    version_slug TEXT,
    release_at TEXT,
    release_precision TEXT,
    metric_id INTEGER,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE benchmark_version_evaluators (
    benchmark_version_id INTEGER,
    evaluator_organization_id INTEGER
);

CREATE TABLE results (
    id INTEGER,
    model_id INTEGER,
    reasoning_level TEXT,
    benchmark_version_id INTEGER,
    metric_id INTEGER,
    run_ref TEXT,
    result_key TEXT,
    score_value TEXT,
    score_raw TEXT,
    reported_at TEXT,
    reported_precision TEXT,
    evaluator_set_key TEXT,
    primary_source_url TEXT,
    primary_source_normalized_url TEXT,
    primary_source_checked_at TEXT
);

CREATE TABLE result_evaluators (
    result_id INTEGER,
    evaluator_organization_id INTEGER
);

CREATE TABLE result_sources (
    id INTEGER,
    result_id INTEGER,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);

CREATE TABLE registry_redirects (
    source_model_id INTEGER,
    target_model_id INTEGER,
    source_url TEXT,
    normalized_source_url TEXT,
    source_checked_at TEXT
);
