-- A controlled correction and retraction path for published results (audit A4).
-- The ingestor writes both through compare-and-set operations; nothing is
-- deleted. Retracted results stay stored and drop out of public pages.
ALTER TABLE results ADD COLUMN retracted_at TEXT;
ALTER TABLE results ADD COLUMN retraction_reason TEXT;
CREATE TRIGGER results_retraction_complete
BEFORE UPDATE OF retracted_at, retraction_reason ON results
WHEN (NEW.retracted_at IS NULL) != (NEW.retraction_reason IS NULL)
    OR (NEW.retraction_reason IS NOT NULL AND length(trim(NEW.retraction_reason)) = 0)
BEGIN
    SELECT RAISE(ABORT, 'a retraction needs both a timestamp and a reason');
END;
CREATE TRIGGER results_retraction_is_final
BEFORE UPDATE OF retracted_at, retraction_reason ON results
WHEN OLD.retracted_at IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'a retraction cannot be changed or undone');
END;

-- Append-only log behind /corrections. expected and corrected are JSON objects
-- of the fields the operation compared and changed.
CREATE TABLE result_corrections (
    id INTEGER PRIMARY KEY,
    result_key TEXT NOT NULL REFERENCES results(result_key),
    kind TEXT NOT NULL CHECK (kind IN ('correction', 'retraction')),
    expected TEXT NOT NULL CHECK (json_valid(expected)),
    corrected TEXT NOT NULL CHECK (json_valid(corrected)),
    reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
    source_url TEXT NOT NULL,
    normalized_source_url TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    recorded_at TEXT NOT NULL
);
CREATE INDEX idx_result_corrections_result_key ON result_corrections(result_key);
CREATE TRIGGER result_corrections_append_only_update
BEFORE UPDATE ON result_corrections
BEGIN
    SELECT RAISE(ABORT, 'result corrections are append-only');
END;
CREATE TRIGGER result_corrections_append_only_delete
BEFORE DELETE ON result_corrections
BEGIN
    SELECT RAISE(ABORT, 'result corrections are append-only');
END;
CREATE TRIGGER revision_result_corrections_insert
AFTER INSERT ON result_corrections
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_result_corrections_update
AFTER UPDATE ON result_corrections
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
CREATE TRIGGER revision_result_corrections_delete
AFTER DELETE ON result_corrections
BEGIN
    UPDATE registry_revision SET token = lower(hex(randomblob(16))) WHERE id = 1;
END;
