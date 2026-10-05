-- Restore the pending_owner rows that 0018 resolved.
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'On/off switch with no stated level.' WHERE label = 'thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'On/off switch with no stated level.' WHERE label = 'thinking mode';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Numeric provider scale.' WHERE label = 'effort=0.99';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Provider wording; no level named.' WHERE label = 'highest thinking settings';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'The model decides whether to reason.' WHERE label = 'automatic think/nothink';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'No effort stated.' WHERE label = 'adaptive thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Provider mode name.' WHERE label = 'contemplating';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'On, with no stated level.' WHERE label = 'extended thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Token budget, not a level.' WHERE label = 'extended thinking (32K)';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Token budget, not a level.' WHERE label = 'extended thinking (128K)';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Token budget, not a level.' WHERE label = 'extended thinking (200K)';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Token budget, not a level.' WHERE label = '64K extended thinking';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Provider mode name.' WHERE label = 'heavy';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Looks like the model name.' WHERE label = 'sol';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'Contradictory wording.' WHERE label = 'no thinking, max effort';
UPDATE reasoning_labels SET effort = NULL, status = 'pending_owner', note = 'xhigh, but "pro" may name a different model.' WHERE label = 'pro xhigh';
