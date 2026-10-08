-- Which benchmark setting a score covers, as its source states it. MMMU-Pro
-- defines its overall score as the average of two settings, but many reports
-- give one number without saying which setting it is. The setting is result
-- metadata: it is not part of the version label, run_ref or result_key, so
-- existing keys, URLs and Registry Nos. stay as they are.

-- A benchmark's settings, defined by the benchmark's own source.
CREATE TABLE score_settings (
    key TEXT PRIMARY KEY CHECK (
        length(key) > 0 AND key NOT GLOB '*[^a-z0-9-]*'
    ),
    benchmark_id INTEGER NOT NULL REFERENCES benchmarks(id),
    label TEXT NOT NULL CHECK (length(trim(label)) > 0),
    definition TEXT NOT NULL CHECK (length(trim(definition)) > 0),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    UNIQUE (benchmark_id, label)
);

-- One setting per result, with the source that states it (or, for a "not
-- stated" setting, the source that was checked and does not state it).
CREATE TABLE result_score_settings (
    result_id INTEGER PRIMARY KEY REFERENCES results(id),
    score_setting_key TEXT NOT NULL REFERENCES score_settings(key),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);

CREATE TRIGGER result_score_settings_same_benchmark
BEFORE INSERT ON result_score_settings
WHEN NOT EXISTS (
    SELECT 1
    FROM results r
    JOIN benchmark_versions bv ON bv.id = r.benchmark_version_id
    JOIN score_settings s ON s.benchmark_id = bv.benchmark_id
    WHERE r.id = NEW.result_id AND s.key = NEW.score_setting_key
)
BEGIN
    SELECT RAISE(ABORT, 'score setting belongs to another benchmark');
END;

CREATE TRIGGER score_settings_immutable
BEFORE UPDATE ON score_settings
BEGIN
    SELECT RAISE(ABORT, 'score settings are immutable');
END;

CREATE TRIGGER result_score_settings_immutable
BEFORE UPDATE ON result_score_settings
BEGIN
    SELECT RAISE(ABORT, 'result score settings are immutable');
END;

CREATE TRIGGER revision_score_settings_insert
AFTER INSERT ON score_settings
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_score_settings_update
AFTER UPDATE ON score_settings
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_score_settings_delete
AFTER DELETE ON score_settings
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_result_score_settings_insert
AFTER INSERT ON result_score_settings
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_result_score_settings_update
AFTER UPDATE ON result_score_settings
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_result_score_settings_delete
AFTER DELETE ON result_score_settings
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
