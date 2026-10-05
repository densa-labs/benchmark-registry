-- Fixed effort vocabulary (owner decision, 2026-10-04) and the reviewed mapping
-- from each provider reasoning label to it. results.reasoning_level stays the
-- provider's raw label: it is part of result_key and is never rewritten.
-- Results join to reasoning_labels by label, so no result row changes.
-- The seed must equal data/reasoning-labels.json.
CREATE TABLE effort_levels (
    key TEXT PRIMARY KEY,
    display TEXT NOT NULL,
    rank INTEGER NOT NULL UNIQUE
);
INSERT INTO effort_levels (key, display, rank) VALUES
    ('none', 'None', 0),
    ('low', 'Low', 1),
    ('medium', 'Medium', 2),
    ('high', 'High', 3),
    ('xhigh', 'xHigh', 4),
    ('max', 'Max', 5);

CREATE TABLE reasoning_labels (
    label TEXT PRIMARY KEY CHECK (instr(label, char(0)) = 0),
    effort TEXT REFERENCES effort_levels(key),
    status TEXT NOT NULL CHECK (
        status IN ('mapped', 'not_reported', 'configuration_only', 'pending_owner')
    ),
    note TEXT,
    CHECK ((status = 'mapped') = (effort IS NOT NULL))
);
INSERT INTO reasoning_labels (label, effort, status, note) VALUES
    ('', NULL, 'not_reported', 'The source does not state a reasoning setting.'),
    ('max', 'max', 'mapped', NULL),
    ('high', 'high', 'mapped', NULL),
    ('xhigh', 'xhigh', 'mapped', NULL),
    ('medium', 'medium', 'mapped', NULL),
    ('low', 'low', 'mapped', NULL),
    ('none', 'none', 'mapped', NULL),
    ('High', 'high', 'mapped', 'Case variant of high.'),
    ('xHigh', 'xhigh', 'mapped', 'Case variant of xhigh.'),
    ('non-thinking', 'none', 'mapped', 'Reasoning switched off.'),
    ('no thinking', 'none', 'mapped', 'Reasoning switched off.'),
    ('No extended thinking', 'none', 'mapped', 'Reasoning switched off.'),
    ('standard (no extended thinking)', 'none', 'mapped', 'Reasoning switched off.'),
    ('enable_thinking=False', 'none', 'mapped', 'Reasoning switched off.'),
    ('adaptive thinking, max', 'max', 'mapped', 'Adaptive thinking at the stated effort.'),
    ('adaptive thinking, high', 'high', 'mapped', 'Adaptive thinking at the stated effort.'),
    ('adaptive thinking, medium', 'medium', 'mapped', 'Adaptive thinking at the stated effort.'),
    ('adaptive thinking, low', 'low', 'mapped', 'Adaptive thinking at the stated effort.'),
    ('adaptive thinking, xhigh', 'xhigh', 'mapped', 'Adaptive thinking at the stated effort.'),
    ('adaptive thinking, max; with tools', 'max', 'mapped', 'Adaptive thinking at max effort, with tools.'),
    ('low (no tools)', 'low', 'mapped', NULL),
    ('medium (no tools)', 'medium', 'mapped', NULL),
    ('high (no tools)', 'high', 'mapped', NULL),
    ('low (with tools)', 'low', 'mapped', NULL),
    ('medium (with tools)', 'medium', 'mapped', NULL),
    ('high (with tools)', 'high', 'mapped', NULL),
    ('no-tools', NULL, 'configuration_only', 'Tool setting, not a reasoning setting.'),
    ('no tools', NULL, 'configuration_only', 'Tool setting, not a reasoning setting.'),
    ('with tools', NULL, 'configuration_only', 'Tool setting, not a reasoning setting.'),
    ('tools enabled', NULL, 'configuration_only', 'Tool setting, not a reasoning setting.'),
    ('OpenHands', NULL, 'configuration_only', 'Harness, not a reasoning setting.'),
    ('thinking', NULL, 'pending_owner', 'On/off switch with no stated level.'),
    ('thinking mode', NULL, 'pending_owner', 'On/off switch with no stated level.'),
    ('effort=0.99', NULL, 'pending_owner', 'Numeric provider scale.'),
    ('highest thinking settings', NULL, 'pending_owner', 'Provider wording; no level named.'),
    ('automatic think/nothink', NULL, 'pending_owner', 'The model decides whether to reason.'),
    ('adaptive thinking', NULL, 'pending_owner', 'No effort stated.'),
    ('pro xhigh', NULL, 'pending_owner', 'xhigh, but "pro" may name a different model.'),
    ('contemplating', NULL, 'pending_owner', 'Provider mode name.'),
    ('extended thinking', NULL, 'pending_owner', 'On, with no stated level.'),
    ('extended thinking (32K)', NULL, 'pending_owner', 'Token budget, not a level.'),
    ('extended thinking (128K)', NULL, 'pending_owner', 'Token budget, not a level.'),
    ('extended thinking (200K)', NULL, 'pending_owner', 'Token budget, not a level.'),
    ('64K extended thinking', NULL, 'pending_owner', 'Token budget, not a level.'),
    ('heavy', NULL, 'pending_owner', 'Provider mode name.'),
    ('sol', NULL, 'pending_owner', 'Looks like the model name.'),
    ('no thinking, max effort', NULL, 'pending_owner', 'Contradictory wording.');

-- Every new result label needs a reviewed mapping row first.
CREATE TRIGGER results_require_reasoning_label_insert
BEFORE INSERT ON results
WHEN NOT EXISTS (SELECT 1 FROM reasoning_labels WHERE label = NEW.reasoning_level)
BEGIN
    SELECT RAISE(ABORT, 'reasoning level has no reviewed effort mapping');
END;
CREATE TRIGGER results_require_reasoning_label_update
BEFORE UPDATE OF reasoning_level ON results
WHEN NOT EXISTS (SELECT 1 FROM reasoning_labels WHERE label = NEW.reasoning_level)
BEGIN
    SELECT RAISE(ABORT, 'reasoning level has no reviewed effort mapping');
END;
