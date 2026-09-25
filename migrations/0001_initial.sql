CREATE TABLE companies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    established_at TEXT,
    established_precision TEXT CHECK (
        established_precision IN ('year', 'date', 'timestamp')
    ),
    established_source_url TEXT,
    established_source_normalized_url TEXT,
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    CHECK (
        (
            established_at IS NULL
            AND established_precision IS NULL
            AND established_source_url IS NULL
            AND established_source_normalized_url IS NULL
        ) OR (
            established_at IS NOT NULL
            AND established_precision IS NOT NULL
            AND established_source_url IS NOT NULL
            AND established_source_normalized_url IS NOT NULL
        )
    )
);

CREATE TABLE namespaces (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL UNIQUE CHECK (
        length(prefix) > 0
        AND prefix NOT GLOB '*[^0-9]*'
    ),
    parent_namespace_id INTEGER REFERENCES namespaces(id),
    CHECK (parent_namespace_id IS NULL OR parent_namespace_id <> id)
);

CREATE TABLE namespace_companies (
    namespace_id INTEGER NOT NULL REFERENCES namespaces(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    PRIMARY KEY (namespace_id, company_id)
);

CREATE TABLE models (
    id INTEGER PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    namespace_id INTEGER NOT NULL REFERENCES namespaces(id),
    sequence INTEGER NOT NULL CHECK (
        typeof(sequence) = 'integer'
        AND sequence BETWEEN 1 AND 999
    ),
    registry_no TEXT NOT NULL UNIQUE,
    release_at TEXT NOT NULL,
    release_precision TEXT NOT NULL CHECK (
        release_precision IN ('date', 'timestamp')
    ),
    release_source_url TEXT NOT NULL,
    release_source_normalized_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    published_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('preview', 'active', 'deprecated', 'stealth')
    ),
    sequence_exception_reason TEXT CHECK (
        sequence_exception_reason IS NULL
        OR sequence_exception_reason = 'late_backfill'
    ),
    UNIQUE (namespace_id, sequence),
    FOREIGN KEY (namespace_id, company_id)
        REFERENCES namespace_companies(namespace_id, company_id)
);

CREATE TABLE model_aliases (
    id INTEGER PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);

CREATE TABLE benchmarks (
    id INTEGER PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);

CREATE TABLE benchmark_aliases (
    id INTEGER PRIMARY KEY,
    benchmark_id INTEGER NOT NULL REFERENCES benchmarks(id),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);

CREATE TABLE metrics (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    storage_kind TEXT NOT NULL CHECK (
        storage_kind IN ('decimal', 'integer', 'text')
    ),
    unit TEXT NOT NULL,
    display_precision INTEGER NOT NULL CHECK (
        typeof(display_precision) = 'integer'
        AND display_precision >= 0
        AND (storage_kind <> 'text' OR display_precision = 0)
    ),
    minimum_value TEXT,
    maximum_value TEXT,
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);

CREATE TABLE evaluator_organizations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    key TEXT NOT NULL UNIQUE,
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);

CREATE TABLE benchmark_versions (
    id INTEGER PRIMARY KEY,
    benchmark_id INTEGER NOT NULL REFERENCES benchmarks(id),
    version TEXT NOT NULL,
    version_slug TEXT NOT NULL CHECK (
        length(version_slug) > 0
        AND version_slug NOT GLOB '*[^a-z0-9._-]*'
    ),
    release_at TEXT NOT NULL,
    release_precision TEXT NOT NULL CHECK (
        release_precision IN ('date', 'timestamp')
    ),
    metric_id INTEGER NOT NULL REFERENCES metrics(id),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    UNIQUE (benchmark_id, version_slug),
    UNIQUE (benchmark_id, version),
    UNIQUE (id, metric_id)
);

CREATE TABLE benchmark_version_evaluators (
    benchmark_version_id INTEGER NOT NULL REFERENCES benchmark_versions(id),
    evaluator_organization_id INTEGER NOT NULL
        REFERENCES evaluator_organizations(id),
    PRIMARY KEY (benchmark_version_id, evaluator_organization_id)
);

CREATE TABLE results (
    id INTEGER PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id),
    reasoning_level TEXT NOT NULL CHECK (instr(reasoning_level, char(0)) = 0),
    benchmark_version_id INTEGER NOT NULL,
    metric_id INTEGER NOT NULL REFERENCES metrics(id),
    run_ref TEXT NOT NULL CHECK (
        length(run_ref) > 0
        AND instr(run_ref, char(0)) = 0
    ),
    result_key TEXT NOT NULL UNIQUE,
    score_value TEXT,
    score_raw TEXT NOT NULL,
    reported_at TEXT NOT NULL,
    reported_precision TEXT NOT NULL CHECK (
        reported_precision IN ('date', 'timestamp')
    ),
    evaluator_set_key TEXT NOT NULL,
    primary_source_url TEXT NOT NULL,
    primary_source_normalized_url TEXT NOT NULL,
    primary_source_checked_at TEXT NOT NULL,
    UNIQUE (
        model_id,
        reasoning_level,
        benchmark_version_id,
        metric_id,
        run_ref
    ),
    FOREIGN KEY (benchmark_version_id, metric_id)
        REFERENCES benchmark_versions(id, metric_id)
);

CREATE TABLE result_evaluators (
    result_id INTEGER NOT NULL REFERENCES results(id),
    evaluator_organization_id INTEGER NOT NULL
        REFERENCES evaluator_organizations(id),
    PRIMARY KEY (result_id, evaluator_organization_id)
);

CREATE TABLE result_sources (
    id INTEGER PRIMARY KEY,
    result_id INTEGER NOT NULL REFERENCES results(id),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    UNIQUE (result_id, source_url),
    UNIQUE (result_id, normalized_source_url)
);

CREATE TABLE registry_redirects (
    source_model_id INTEGER PRIMARY KEY REFERENCES models(id),
    target_model_id INTEGER NOT NULL REFERENCES models(id),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    CHECK (source_model_id <> target_model_id)
);

CREATE INDEX idx_models_release_at ON models(release_at);
CREATE INDEX idx_models_published_at ON models(published_at);
CREATE INDEX idx_models_normalized_name ON models(normalized_name);
CREATE INDEX idx_results_benchmark_version_id
    ON results(benchmark_version_id);
CREATE INDEX idx_results_reported_at ON results(reported_at);
CREATE INDEX idx_results_model_benchmark_version
    ON results(model_id, benchmark_version_id);

-- SQLite CHECK constraints cannot refer to other tables. These triggers enforce
-- the stable cross-table invariants from the frozen data and numbering contracts.

CREATE TRIGGER models_validate_insert
BEFORE INSERT ON models
BEGIN
    SELECT (CASE WHEN NOT EXISTS (
        SELECT 1
        FROM namespaces
        WHERE id = NEW.namespace_id
          AND prefix <> '100'
          AND NEW.registry_no = prefix || printf('%03d', NEW.sequence)
    ) THEN RAISE(ABORT, 'registry number does not match namespace and sequence') END);

    SELECT (CASE WHEN NOT EXISTS (
        SELECT 1
        FROM namespaces
        WHERE id = NEW.namespace_id
          AND (
              (prefix = '00' AND NEW.status = 'stealth')
              OR (prefix <> '00' AND NEW.status <> 'stealth')
          )
    ) THEN RAISE(ABORT, 'stealth status does not match namespace') END);

    SELECT (CASE WHEN EXISTS (
        SELECT 1
        FROM model_aliases
        WHERE normalized_name = NEW.normalized_name
          AND model_id <> NEW.id
    ) THEN RAISE(ABORT, 'model canonical name collides with an alias') END);
END;

CREATE TRIGGER models_validate_update
BEFORE UPDATE ON models
BEGIN
    SELECT (CASE WHEN NOT EXISTS (
        SELECT 1
        FROM namespaces
        WHERE id = NEW.namespace_id
          AND prefix <> '100'
          AND NEW.registry_no = prefix || printf('%03d', NEW.sequence)
    ) THEN RAISE(ABORT, 'registry number does not match namespace and sequence') END);

    SELECT (CASE WHEN NOT EXISTS (
        SELECT 1
        FROM namespaces
        WHERE id = NEW.namespace_id
          AND (
              (prefix = '00' AND NEW.status = 'stealth')
              OR (prefix <> '00' AND NEW.status <> 'stealth')
          )
    ) THEN RAISE(ABORT, 'stealth status does not match namespace') END);

    SELECT (CASE WHEN EXISTS (
        SELECT 1
        FROM model_aliases
        WHERE normalized_name = NEW.normalized_name
          AND model_id <> NEW.id
    ) THEN RAISE(ABORT, 'model canonical name collides with an alias') END);

    SELECT (CASE WHEN EXISTS (
        SELECT 1 FROM registry_redirects WHERE source_model_id = OLD.id
    ) AND NOT EXISTS (
        SELECT 1
        FROM namespaces
        WHERE id = NEW.namespace_id
          AND prefix = '00'
          AND NEW.status = 'stealth'
    ) THEN RAISE(ABORT, 'redirect source must remain a stealth model') END);

    SELECT (CASE WHEN EXISTS (
        SELECT 1 FROM registry_redirects WHERE target_model_id = OLD.id
    ) AND NOT EXISTS (
        SELECT 1
        FROM namespaces
        WHERE id = NEW.namespace_id
          AND prefix <> '00'
          AND NEW.status <> 'stealth'
    ) THEN RAISE(ABORT, 'redirect target must remain a confirmed model') END);
END;

CREATE TRIGGER namespaces_preserve_assigned_prefix
BEFORE UPDATE OF prefix ON namespaces
WHEN OLD.prefix <> NEW.prefix
 AND EXISTS (SELECT 1 FROM models WHERE namespace_id = OLD.id)
BEGIN
    SELECT RAISE(ABORT, 'cannot change a namespace prefix used by models');
END;

CREATE TRIGGER model_aliases_validate_insert
BEFORE INSERT ON model_aliases
WHEN EXISTS (
    SELECT 1
    FROM models
    WHERE normalized_name = NEW.normalized_name
      AND id <> NEW.model_id
)
BEGIN
    SELECT RAISE(ABORT, 'model alias collides with a canonical name');
END;

CREATE TRIGGER model_aliases_validate_update
BEFORE UPDATE ON model_aliases
WHEN EXISTS (
    SELECT 1
    FROM models
    WHERE normalized_name = NEW.normalized_name
      AND id <> NEW.model_id
)
BEGIN
    SELECT RAISE(ABORT, 'model alias collides with a canonical name');
END;

CREATE TRIGGER benchmarks_validate_insert
BEFORE INSERT ON benchmarks
WHEN EXISTS (
    SELECT 1
    FROM benchmark_aliases
    WHERE normalized_name = NEW.normalized_name
      AND benchmark_id <> NEW.id
)
BEGIN
    SELECT RAISE(ABORT, 'benchmark canonical name collides with an alias');
END;

CREATE TRIGGER benchmarks_validate_update
BEFORE UPDATE ON benchmarks
WHEN EXISTS (
    SELECT 1
    FROM benchmark_aliases
    WHERE normalized_name = NEW.normalized_name
      AND benchmark_id <> NEW.id
)
BEGIN
    SELECT RAISE(ABORT, 'benchmark canonical name collides with an alias');
END;

CREATE TRIGGER benchmark_aliases_validate_insert
BEFORE INSERT ON benchmark_aliases
WHEN EXISTS (
    SELECT 1
    FROM benchmarks
    WHERE normalized_name = NEW.normalized_name
      AND id <> NEW.benchmark_id
)
BEGIN
    SELECT RAISE(ABORT, 'benchmark alias collides with a canonical name');
END;

CREATE TRIGGER benchmark_aliases_validate_update
BEFORE UPDATE ON benchmark_aliases
WHEN EXISTS (
    SELECT 1
    FROM benchmarks
    WHERE normalized_name = NEW.normalized_name
      AND id <> NEW.benchmark_id
)
BEGIN
    SELECT RAISE(ABORT, 'benchmark alias collides with a canonical name');
END;

CREATE TRIGGER result_sources_validate_insert
BEFORE INSERT ON result_sources
WHEN EXISTS (
    SELECT 1
    FROM results
    WHERE id = NEW.result_id
      AND (
          primary_source_url = NEW.source_url
          OR primary_source_normalized_url = NEW.normalized_source_url
      )
)
BEGIN
    SELECT RAISE(ABORT, 'additional result source duplicates primary source');
END;

CREATE TRIGGER result_sources_validate_update
BEFORE UPDATE ON result_sources
WHEN EXISTS (
    SELECT 1
    FROM results
    WHERE id = NEW.result_id
      AND (
          primary_source_url = NEW.source_url
          OR primary_source_normalized_url = NEW.normalized_source_url
      )
)
BEGIN
    SELECT RAISE(ABORT, 'additional result source duplicates primary source');
END;

CREATE TRIGGER results_validate_primary_source_update
BEFORE UPDATE OF id, primary_source_url, primary_source_normalized_url ON results
WHEN EXISTS (
    SELECT 1
    FROM result_sources
    WHERE result_id = NEW.id
      AND (
          source_url = NEW.primary_source_url
          OR normalized_source_url = NEW.primary_source_normalized_url
      )
)
BEGIN
    SELECT RAISE(ABORT, 'primary result source duplicates an additional source');
END;

CREATE TRIGGER registry_redirects_validate_insert
BEFORE INSERT ON registry_redirects
BEGIN
    SELECT (CASE WHEN EXISTS (
        SELECT 1
        FROM registry_redirects
        WHERE source_model_id = NEW.target_model_id
           OR target_model_id = NEW.source_model_id
    ) THEN RAISE(ABORT, 'redirect chains and cycles are not allowed') END);

    SELECT (CASE WHEN NOT EXISTS (
        SELECT 1
        FROM models AS source_model
        JOIN namespaces AS source_namespace
          ON source_namespace.id = source_model.namespace_id
        JOIN models AS target_model
          ON target_model.id = NEW.target_model_id
        JOIN namespaces AS target_namespace
          ON target_namespace.id = target_model.namespace_id
        WHERE source_model.id = NEW.source_model_id
          AND source_namespace.prefix = '00'
          AND source_model.status = 'stealth'
          AND target_namespace.prefix <> '00'
          AND target_model.status <> 'stealth'
    ) THEN RAISE(ABORT, 'redirect endpoints have invalid roles') END);
END;

CREATE TRIGGER registry_redirects_validate_update
BEFORE UPDATE ON registry_redirects
BEGIN
    SELECT (CASE WHEN EXISTS (
        SELECT 1
        FROM registry_redirects
        WHERE source_model_id <> OLD.source_model_id
          AND (
              source_model_id = NEW.target_model_id
              OR target_model_id = NEW.source_model_id
          )
    ) THEN RAISE(ABORT, 'redirect chains and cycles are not allowed') END);

    SELECT (CASE WHEN NOT EXISTS (
        SELECT 1
        FROM models AS source_model
        JOIN namespaces AS source_namespace
          ON source_namespace.id = source_model.namespace_id
        JOIN models AS target_model
          ON target_model.id = NEW.target_model_id
        JOIN namespaces AS target_namespace
          ON target_namespace.id = target_model.namespace_id
        WHERE source_model.id = NEW.source_model_id
          AND source_namespace.prefix = '00'
          AND source_model.status = 'stealth'
          AND target_namespace.prefix <> '00'
          AND target_model.status <> 'stealth'
    ) THEN RAISE(ABORT, 'redirect endpoints have invalid roles') END);
END;
