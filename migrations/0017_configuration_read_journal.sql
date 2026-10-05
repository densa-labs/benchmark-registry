-- Journal configuration changes for the incremental KV materializer (kept only
-- as the previous Worker's rollback store). A version configuration changes the
-- family's latest version, its version and result projections, and the model
-- and company pages that list those results.

CREATE TRIGGER read_changes_benchmark_version_configurations_insert
AFTER INSERT ON benchmark_version_configurations
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=NEW.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.benchmark_id=(SELECT benchmark_id FROM benchmark_versions WHERE id=NEW.benchmark_version_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id=NEW.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id=NEW.benchmark_version_id;
END;

CREATE TRIGGER read_changes_benchmark_version_configurations_update
AFTER UPDATE ON benchmark_version_configurations
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.benchmark_id=(SELECT benchmark_id FROM benchmark_versions WHERE id=OLD.benchmark_version_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=NEW.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.benchmark_id=(SELECT benchmark_id FROM benchmark_versions WHERE id=NEW.benchmark_version_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id=NEW.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id=NEW.benchmark_version_id;
END;

CREATE TRIGGER read_changes_benchmark_version_configurations_delete
AFTER DELETE ON benchmark_version_configurations
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.benchmark_id=(SELECT benchmark_id FROM benchmark_versions WHERE id=OLD.benchmark_version_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id=OLD.benchmark_version_id;
END;
