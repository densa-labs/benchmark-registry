-- Tool, harness and context settings are their own dimension (owner decision,
-- 2026-10-04), not benchmark versions and not effort values. Version labels and
-- result_key are immutable, so configuration is attached to the existing rows:
-- a version row may carry a configuration (and the dataset part of its label),
-- and a raw reasoning label may carry one. Nothing is moved or renamed.
CREATE TABLE configurations (
    key TEXT PRIMARY KEY CHECK (
        length(key) > 0 AND key NOT GLOB '*[^a-z0-9-]*'
    ),
    label TEXT NOT NULL UNIQUE CHECK (length(label) > 0),
    kind TEXT NOT NULL CHECK (kind IN ('tools', 'harness', 'context'))
);
-- Configurations named by raw reasoning labels; the ingestor adds the rest.
INSERT INTO configurations (key, label, kind) VALUES
    ('no-tools', 'No tools', 'tools'),
    ('with-tools', 'With tools', 'tools'),
    ('openhands-harness', 'OpenHands harness', 'harness');

-- Must equal the configuration fields in data/reasoning-labels.json.
ALTER TABLE reasoning_labels ADD COLUMN configuration_key TEXT REFERENCES configurations(key);
UPDATE reasoning_labels SET configuration_key = 'no-tools'
WHERE label IN ('no-tools', 'no tools', 'low (no tools)', 'medium (no tools)', 'high (no tools)');
UPDATE reasoning_labels SET configuration_key = 'with-tools'
WHERE label IN ('with tools', 'tools enabled', 'low (with tools)', 'medium (with tools)',
    'high (with tools)', 'adaptive thinking, max; with tools');
UPDATE reasoning_labels SET configuration_key = 'openhands-harness' WHERE label = 'OpenHands';

-- One configuration per version row. dataset_label is the dataset part of the
-- version label ("Verified" in "Verified — Droid harness"), or NULL when the
-- label names none. The source is the evidence the label came from.
CREATE TABLE benchmark_version_configurations (
    benchmark_version_id INTEGER PRIMARY KEY REFERENCES benchmark_versions(id),
    configuration_key TEXT NOT NULL REFERENCES configurations(key),
    dataset_label TEXT CHECK (dataset_label IS NULL OR length(dataset_label) > 0),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL
);
CREATE TRIGGER revision_configurations_insert
AFTER INSERT ON configurations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_configurations_update
AFTER UPDATE ON configurations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_configurations_delete
AFTER DELETE ON configurations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_benchmark_version_configurations_insert
AFTER INSERT ON benchmark_version_configurations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_benchmark_version_configurations_update
AFTER UPDATE ON benchmark_version_configurations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_benchmark_version_configurations_delete
AFTER DELETE ON benchmark_version_configurations
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
