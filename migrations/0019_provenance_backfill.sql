-- A6 provenance backfill. Metric direction keeps its own evidence, because the
-- metric's source_url is the definition, not necessarily where the direction is
-- stated. Backfilled values only fill empty fields: once set, a direction or a
-- result provenance field cannot change or be cleared.
ALTER TABLE metrics ADD COLUMN direction_source_url TEXT;
ALTER TABLE metrics ADD COLUMN direction_normalized_source_url TEXT;
ALTER TABLE metrics ADD COLUMN direction_source_checked_at TEXT;

CREATE TRIGGER metrics_direction_sourced_insert
BEFORE INSERT ON metrics
WHEN (NEW.direction IS NULL) != (NEW.direction_source_url IS NULL)
    OR (NEW.direction_source_url IS NULL) != (NEW.direction_normalized_source_url IS NULL)
    OR (NEW.direction_source_url IS NULL) != (NEW.direction_source_checked_at IS NULL)
BEGIN
    SELECT RAISE(ABORT, 'a metric direction needs its own source');
END;

CREATE TRIGGER metrics_direction_sourced_update
BEFORE UPDATE ON metrics
WHEN (NEW.direction IS NULL) != (NEW.direction_source_url IS NULL)
    OR (NEW.direction_source_url IS NULL) != (NEW.direction_normalized_source_url IS NULL)
    OR (NEW.direction_source_url IS NULL) != (NEW.direction_source_checked_at IS NULL)
BEGIN
    SELECT RAISE(ABORT, 'a metric direction needs its own source');
END;

CREATE TRIGGER metrics_direction_fill_only
BEFORE UPDATE ON metrics
WHEN OLD.direction IS NOT NULL AND (
    NEW.direction IS NOT OLD.direction
    OR NEW.direction_source_url IS NOT OLD.direction_source_url
    OR NEW.direction_normalized_source_url IS NOT OLD.direction_normalized_source_url
    OR NEW.direction_source_checked_at IS NOT OLD.direction_source_checked_at
)
BEGIN
    SELECT RAISE(ABORT, 'a recorded metric direction cannot change');
END;

CREATE TRIGGER results_provenance_fill_only
BEFORE UPDATE ON results
WHEN (OLD.source_type IS NOT NULL AND NEW.source_type IS NOT OLD.source_type)
    OR (OLD.publisher IS NOT NULL AND NEW.publisher IS NOT OLD.publisher)
    OR (OLD.reporting_basis IS NOT NULL AND NEW.reporting_basis IS NOT OLD.reporting_basis)
    OR (OLD.source_archive_url IS NOT NULL AND NEW.source_archive_url IS NOT OLD.source_archive_url)
    OR (OLD.evaluated_at IS NOT NULL AND (NEW.evaluated_at IS NOT OLD.evaluated_at
        OR NEW.evaluated_precision IS NOT OLD.evaluated_precision))
BEGIN
    SELECT RAISE(ABORT, 'recorded result provenance cannot change');
END;
