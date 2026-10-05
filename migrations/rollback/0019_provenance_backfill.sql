DROP TRIGGER results_provenance_fill_only;
DROP TRIGGER metrics_direction_fill_only;
DROP TRIGGER metrics_direction_sourced_update;
DROP TRIGGER metrics_direction_sourced_insert;
ALTER TABLE metrics DROP COLUMN direction_source_checked_at;
ALTER TABLE metrics DROP COLUMN direction_normalized_source_url;
ALTER TABLE metrics DROP COLUMN direction_source_url;
