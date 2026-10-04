-- Published Registry Nos. are permanent (registry-numbering.md): a model's
-- number, sequence and namespace never change and models are never deleted,
-- so the next sequence (max + 1) can never reuse a number.
CREATE TRIGGER models_preserve_registry_number
BEFORE UPDATE OF registry_no, sequence, namespace_id ON models
WHEN OLD.registry_no IS NOT NEW.registry_no
  OR OLD.sequence IS NOT NEW.sequence
  OR OLD.namespace_id IS NOT NEW.namespace_id
BEGIN
    SELECT RAISE(ABORT, 'registry numbers are immutable');
END;

CREATE TRIGGER models_prevent_delete
BEFORE DELETE ON models
BEGIN
    SELECT RAISE(ABORT, 'models are never deleted; registry numbers are permanent');
END;
