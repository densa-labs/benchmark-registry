-- Curator decision for a result whose derived run_ref (source URL and report
-- date) shares a series with an existing result (audit A9): either a distinct
-- run, or a revision that supersedes the named result. Existing rows are NULL.
ALTER TABLE results ADD COLUMN run_relation TEXT CHECK (run_relation IN ('distinct_run', 'supersedes'));
ALTER TABLE results ADD COLUMN supersedes_result_key TEXT REFERENCES results(result_key);
CREATE TRIGGER results_run_relation_consistent_insert
BEFORE INSERT ON results
WHEN (NEW.run_relation = 'supersedes') != (NEW.supersedes_result_key IS NOT NULL)
BEGIN
    SELECT RAISE(ABORT, 'supersedes needs exactly one superseded result_key');
END;
