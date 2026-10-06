-- Owner decisions of 2026-10-05 on the reasoning labels left pending in 0013.
-- Only the mapping changes; results.reasoning_level and every result_key stay as they are.
-- The rows must equal data/reasoning-labels.json.
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Reasoning switched on; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Reasoning switched on; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'thinking mode';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Numeric provider scale; no level on the fixed vocabulary. Owner decision, 2026-10-05.' WHERE label = 'effort=0.99';
UPDATE reasoning_labels SET effort = 'max', status = 'mapped', note = 'The provider''s highest setting (owner decision, 2026-10-05).' WHERE label = 'highest thinking settings';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'The model decides whether to reason; no level stated. Owner decision, 2026-10-05.' WHERE label = 'automatic think/nothink';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Adaptive thinking; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'adaptive thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Provider mode name; no level stated. Owner decision, 2026-10-05.' WHERE label = 'contemplating';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Reasoning switched on; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'extended thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Token budget; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'extended thinking (32K)';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Token budget; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'extended thinking (128K)';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Token budget; the source states no level. Owner decision, 2026-10-05.' WHERE label = 'extended thinking (200K)';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Token budget; the source states no level. Owner decision, 2026-10-05.' WHERE label = '64K extended thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Provider mode name; no level stated. Owner decision, 2026-10-05.' WHERE label = 'heavy';
UPDATE reasoning_labels SET effort = NULL, status = 'not_reported', note = 'Looks like the model name; no level stated. Owner decision, 2026-10-05.' WHERE label = 'sol';
UPDATE reasoning_labels SET effort = 'max', status = 'mapped', note = 'Effort set to max with thinking off (owner decision, 2026-10-05).' WHERE label = 'no thinking, max effort';
UPDATE reasoning_labels SET effort = 'xhigh', status = 'mapped', note = 'xhigh effort as labelled (owner decision, 2026-10-05).' WHERE label = 'pro xhigh';
