-- Only source-backed future values; never infer direction from metric names.
ALTER TABLE metrics ADD COLUMN direction TEXT CHECK (direction IN ('higher', 'lower'));
