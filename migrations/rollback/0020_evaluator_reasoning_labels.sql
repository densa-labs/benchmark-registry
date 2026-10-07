-- Remove the evaluator labels added by 0020. Run only when no result uses them.
DELETE FROM reasoning_labels WHERE label IN
    ('thinking high', 'xhigh thinking', 'thinking-max', 'Non-Thinking', 'Thinking', '0.99', 'Max', 'enabled');
