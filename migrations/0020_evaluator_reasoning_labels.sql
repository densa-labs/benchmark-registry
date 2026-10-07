-- Provider reasoning labels shown on evaluator leaderboards (evaluator-source
-- intake, 2026-10-07). Each label is kept as displayed; the effort follows the
-- reviewed mapping in data/reasoning-labels.json.
INSERT INTO reasoning_labels (label, effort, status, note) VALUES
    ('thinking high', 'high', 'mapped', 'Thinking at high effort, as labelled.'),
    ('xhigh thinking', 'xhigh', 'mapped', 'Thinking at xhigh effort, as labelled.'),
    ('thinking-max', 'max', 'mapped', 'Thinking at max effort, as labelled in the model string.'),
    ('Non-Thinking', 'none', 'mapped', 'Case variant of non-thinking.'),
    ('Thinking', NULL, 'not_reported', 'Case variant of thinking; the source states no level.');
