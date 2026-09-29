-- P11.9: omit unrelated stats and unchanged URL/search scopes on metadata updates.

DROP TRIGGER read_changes_models_update;
CREATE TRIGGER read_changes_models_update AFTER UPDATE ON models
WHEN OLD."id" IS NOT NEW."id" OR OLD."canonical_name" IS NOT NEW."canonical_name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."company_id" IS NOT NEW."company_id" OR OLD."namespace_id" IS NOT NEW."namespace_id" OR OLD."sequence" IS NOT NEW."sequence" OR OLD."registry_no" IS NOT NEW."registry_no" OR OLD."release_at" IS NOT NEW."release_at" OR OLD."release_precision" IS NOT NEW."release_precision" OR OLD."release_source_url" IS NOT NEW."release_source_url" OR OLD."release_source_normalized_url" IS NOT NEW."release_source_normalized_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at" OR OLD."published_at" IS NOT NEW."published_at" OR OLD."status" IS NOT NEW."status" OR OLD."sequence_exception_reason" IS NOT NEW."sequence_exception_reason"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory' WHERE OLD.registry_no IS NOT NEW.registry_no;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||OLD.registry_no;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM companies c WHERE c.id=OLD.company_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||NEW.registry_no;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM companies c WHERE c.id=NEW.company_id;
END;

DROP TRIGGER read_changes_benchmarks_update;
CREATE TRIGGER read_changes_benchmarks_update AFTER UPDATE ON benchmarks
WHEN OLD."id" IS NOT NEW."id" OR OLD."canonical_name" IS NOT NEW."canonical_name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."slug" IS NOT NEW."slug" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||OLD.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory' WHERE OLD.slug IS NOT NEW.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||NEW.slug;
END;

DROP TRIGGER read_changes_benchmark_versions_update;
CREATE TRIGGER read_changes_benchmark_versions_update AFTER UPDATE ON benchmark_versions
WHEN OLD."id" IS NOT NEW."id" OR OLD."benchmark_id" IS NOT NEW."benchmark_id" OR OLD."version" IS NOT NEW."version" OR OLD."version_slug" IS NOT NEW."version_slug" OR OLD."release_at" IS NOT NEW."release_at" OR OLD."release_precision" IS NOT NEW."release_precision" OR OLD."metric_id" IS NOT NEW."metric_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||OLD.version_slug FROM benchmarks b WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory' WHERE OLD.benchmark_id IS NOT NEW.benchmark_id OR OLD.version_slug IS NOT NEW.version_slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=NEW.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
END;

DROP TRIGGER read_changes_results_update;
CREATE TRIGGER read_changes_results_update AFTER UPDATE ON results
WHEN OLD."id" IS NOT NEW."id" OR OLD."model_id" IS NOT NEW."model_id" OR OLD."reasoning_level" IS NOT NEW."reasoning_level" OR OLD."benchmark_version_id" IS NOT NEW."benchmark_version_id" OR OLD."metric_id" IS NOT NEW."metric_id" OR OLD."run_ref" IS NOT NEW."run_ref" OR OLD."result_key" IS NOT NEW."result_key" OR OLD."score_value" IS NOT NEW."score_value" OR OLD."score_raw" IS NOT NEW."score_raw" OR OLD."reported_at" IS NOT NEW."reported_at" OR OLD."reported_precision" IS NOT NEW."reported_precision" OR OLD."evaluator_set_key" IS NOT NEW."evaluator_set_key" OR OLD."primary_source_url" IS NOT NEW."primary_source_url" OR OLD."primary_source_normalized_url" IS NOT NEW."primary_source_normalized_url" OR OLD."primary_source_checked_at" IS NOT NEW."primary_source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory' WHERE OLD.model_id IS NOT NEW.model_id OR OLD.benchmark_version_id IS NOT NEW.benchmark_version_id OR OLD.result_key IS NOT NEW.result_key;
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships' WHERE OLD.model_id IS NOT NEW.model_id OR OLD.benchmark_version_id IS NOT NEW.benchmark_version_id OR OLD.result_key IS NOT NEW.result_key OR OLD.reasoning_level IS NOT NEW.reasoning_level;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE substr(r.reported_at,1,10)=substr(OLD.reported_at,1,10) AND OLD.reported_precision='date' AND (OLD.reported_at!=NEW.reported_at OR OLD.reported_precision!=NEW.reported_precision);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE substr(r.reported_at,1,10)=substr(OLD.reported_at,1,10) AND OLD.reported_precision='date' AND (OLD.reported_at!=NEW.reported_at OR OLD.reported_precision!=NEW.reported_precision);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE substr(r.reported_at,1,10)=substr(OLD.reported_at,1,10) AND OLD.reported_precision='date' AND (OLD.reported_at!=NEW.reported_at OR OLD.reported_precision!=NEW.reported_precision);
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=NEW.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE substr(r.reported_at,1,10)=substr(NEW.reported_at,1,10) AND NEW.reported_precision='date' AND (OLD.reported_at!=NEW.reported_at OR OLD.reported_precision!=NEW.reported_precision);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE substr(r.reported_at,1,10)=substr(NEW.reported_at,1,10) AND NEW.reported_precision='date' AND (OLD.reported_at!=NEW.reported_at OR OLD.reported_precision!=NEW.reported_precision);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE substr(r.reported_at,1,10)=substr(NEW.reported_at,1,10) AND NEW.reported_precision='date' AND (OLD.reported_at!=NEW.reported_at OR OLD.reported_precision!=NEW.reported_precision);
END;
