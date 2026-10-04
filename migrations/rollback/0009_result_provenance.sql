-- Apply only when reverting the corresponding application/ingestor version.
ALTER TABLE results DROP COLUMN evaluated_precision;
ALTER TABLE results DROP COLUMN evaluated_at;
ALTER TABLE results DROP COLUMN reporting_basis;
ALTER TABLE results DROP COLUMN publisher;
ALTER TABLE results DROP COLUMN source_archive_url;
ALTER TABLE results DROP COLUMN source_type;
