-- Nullable readiness only; no existing evidence or scores change.
ALTER TABLE results ADD COLUMN source_type TEXT;
ALTER TABLE results ADD COLUMN source_archive_url TEXT;
ALTER TABLE results ADD COLUMN publisher TEXT;
ALTER TABLE results ADD COLUMN reporting_basis TEXT CHECK (reporting_basis IN ('self-reported', 'independent'));
ALTER TABLE results ADD COLUMN evaluated_at TEXT;
ALTER TABLE results ADD COLUMN evaluated_precision TEXT CHECK (evaluated_precision IN ('date', 'timestamp'));
