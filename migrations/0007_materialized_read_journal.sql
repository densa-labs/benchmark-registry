-- P11.9 producer-only transaction journal. Public Workers never bind D1.
CREATE TABLE registry_read_changes (id INTEGER PRIMARY KEY AUTOINCREMENT, logical_key TEXT NOT NULL);
CREATE TABLE registry_materialization_lease (id INTEGER PRIMARY KEY CHECK(id=1), owner TEXT, expires_at INTEGER NOT NULL DEFAULT 0);
INSERT INTO registry_materialization_lease(id) VALUES(1);

CREATE TRIGGER read_changes_models_insert AFTER INSERT ON models
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||NEW.registry_no;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM companies c WHERE c.id=NEW.company_id;
END;

CREATE TRIGGER read_changes_models_update AFTER UPDATE ON models
WHEN OLD."id" IS NOT NEW."id" OR OLD."canonical_name" IS NOT NEW."canonical_name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."company_id" IS NOT NEW."company_id" OR OLD."namespace_id" IS NOT NEW."namespace_id" OR OLD."sequence" IS NOT NEW."sequence" OR OLD."registry_no" IS NOT NEW."registry_no" OR OLD."release_at" IS NOT NEW."release_at" OR OLD."release_precision" IS NOT NEW."release_precision" OR OLD."release_source_url" IS NOT NEW."release_source_url" OR OLD."release_source_normalized_url" IS NOT NEW."release_source_normalized_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at" OR OLD."published_at" IS NOT NEW."published_at" OR OLD."status" IS NOT NEW."status" OR OLD."sequence_exception_reason" IS NOT NEW."sequence_exception_reason"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
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

CREATE TRIGGER read_changes_models_delete AFTER DELETE ON models
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||OLD.registry_no;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM companies c WHERE c.id=OLD.company_id;
END;

CREATE TRIGGER read_changes_companies_insert AFTER INSERT ON companies
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||NEW.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.company_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.company_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.company_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
END;

CREATE TRIGGER read_changes_companies_update AFTER UPDATE ON companies
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."slug" IS NOT NEW."slug" OR OLD."established_at" IS NOT NEW."established_at" OR OLD."established_precision" IS NOT NEW."established_precision" OR OLD."established_source_url" IS NOT NEW."established_source_url" OR OLD."established_source_normalized_url" IS NOT NEW."established_source_normalized_url" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at" OR OLD."entity_kind" IS NOT NEW."entity_kind" OR OLD."parent_company_id" IS NOT NEW."parent_company_id" OR OLD."established_basis" IS NOT NEW."established_basis" OR OLD."established_attestation_ref" IS NOT NEW."established_attestation_ref" OR OLD."established_attested_at" IS NOT NEW."established_attested_at" OR OLD."provider_kind" IS NOT NEW."provider_kind"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||OLD.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.company_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.company_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.company_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||NEW.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.company_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.company_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.company_id=NEW.id;
END;

CREATE TRIGGER read_changes_companies_delete AFTER DELETE ON companies
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||OLD.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.company_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.company_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.company_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
END;

CREATE TRIGGER read_changes_model_aliases_insert AFTER INSERT ON model_aliases
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=NEW.model_id;
END;

CREATE TRIGGER read_changes_model_aliases_update AFTER UPDATE ON model_aliases
WHEN OLD."id" IS NOT NEW."id" OR OLD."model_id" IS NOT NEW."model_id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=NEW.model_id;
END;

CREATE TRIGGER read_changes_model_aliases_delete AFTER DELETE ON model_aliases
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id=OLD.model_id;
END;

CREATE TRIGGER read_changes_benchmarks_insert AFTER INSERT ON benchmarks
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||NEW.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
END;

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
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||NEW.slug;
END;

CREATE TRIGGER read_changes_benchmarks_delete AFTER DELETE ON benchmarks
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||OLD.slug;
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
END;

CREATE TRIGGER read_changes_benchmark_aliases_insert AFTER INSERT ON benchmark_aliases
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=NEW.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
END;

CREATE TRIGGER read_changes_benchmark_aliases_update AFTER UPDATE ON benchmark_aliases
WHEN OLD."id" IS NOT NEW."id" OR OLD."benchmark_id" IS NOT NEW."benchmark_id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
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

CREATE TRIGGER read_changes_benchmark_aliases_delete AFTER DELETE ON benchmark_aliases
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
END;

CREATE TRIGGER read_changes_benchmark_versions_insert AFTER INSERT ON benchmark_versions
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=NEW.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=NEW.benchmark_id);
END;

CREATE TRIGGER read_changes_benchmark_versions_update AFTER UPDATE ON benchmark_versions
WHEN OLD."id" IS NOT NEW."id" OR OLD."benchmark_id" IS NOT NEW."benchmark_id" OR OLD."version" IS NOT NEW."version" OR OLD."version_slug" IS NOT NEW."version_slug" OR OLD."release_at" IS NOT NEW."release_at" OR OLD."release_precision" IS NOT NEW."release_precision" OR OLD."metric_id" IS NOT NEW."metric_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||OLD.version_slug FROM benchmarks b WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
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

CREATE TRIGGER read_changes_benchmark_versions_delete AFTER DELETE ON benchmark_versions
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||OLD.version_slug FROM benchmarks b WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'benchmarks';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-entities';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmarks b WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.benchmark_version_id IN(SELECT bv.id FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE b.id=OLD.benchmark_id);
END;

CREATE TRIGGER read_changes_metrics_insert AFTER INSERT ON metrics
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.metric_id=NEW.id;
END;

CREATE TRIGGER read_changes_metrics_update AFTER UPDATE ON metrics
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."key" IS NOT NEW."key" OR OLD."storage_kind" IS NOT NEW."storage_kind" OR OLD."unit" IS NOT NEW."unit" OR OLD."display_precision" IS NOT NEW."display_precision" OR OLD."minimum_value" IS NOT NEW."minimum_value" OR OLD."maximum_value" IS NOT NEW."maximum_value" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.metric_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.metric_id=NEW.id;
END;

CREATE TRIGGER read_changes_metrics_delete AFTER DELETE ON metrics
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'family:'||b.slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.metric_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.metric_id=OLD.id;
END;

CREATE TRIGGER read_changes_evaluator_organizations_insert AFTER INSERT ON evaluator_organizations
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_version_evaluators e JOIN benchmark_versions bv ON bv.id=e.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE e.evaluator_organization_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=NEW.id);
END;

CREATE TRIGGER read_changes_evaluator_organizations_update AFTER UPDATE ON evaluator_organizations
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."key" IS NOT NEW."key" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_version_evaluators e JOIN benchmark_versions bv ON bv.id=e.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE e.evaluator_organization_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_version_evaluators e JOIN benchmark_versions bv ON bv.id=e.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE e.evaluator_organization_id=NEW.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=NEW.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=NEW.id);
END;

CREATE TRIGGER read_changes_evaluator_organizations_delete AFTER DELETE ON evaluator_organizations
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_version_evaluators e JOIN benchmark_versions bv ON bv.id=e.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE e.evaluator_organization_id=OLD.id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=OLD.id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id IN(SELECT result_id FROM result_evaluators WHERE evaluator_organization_id=OLD.id);
END;

CREATE TRIGGER read_changes_benchmark_version_evaluators_insert AFTER INSERT ON benchmark_version_evaluators
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=NEW.benchmark_version_id;
END;

CREATE TRIGGER read_changes_benchmark_version_evaluators_update AFTER UPDATE ON benchmark_version_evaluators
WHEN OLD."benchmark_version_id" IS NOT NEW."benchmark_version_id" OR OLD."evaluator_organization_id" IS NOT NEW."evaluator_organization_id"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=NEW.benchmark_version_id;
END;

CREATE TRIGGER read_changes_benchmark_version_evaluators_delete AFTER DELETE ON benchmark_version_evaluators
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=OLD.benchmark_version_id;
END;

CREATE TRIGGER read_changes_results_insert AFTER INSERT ON results
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=NEW.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=NEW.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE substr(r.reported_at,1,10)=substr(NEW.reported_at,1,10) AND NEW.reported_precision='date';
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE substr(r.reported_at,1,10)=substr(NEW.reported_at,1,10) AND NEW.reported_precision='date';
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE substr(r.reported_at,1,10)=substr(NEW.reported_at,1,10) AND NEW.reported_precision='date';
END;

CREATE TRIGGER read_changes_results_update AFTER UPDATE ON results
WHEN OLD."id" IS NOT NEW."id" OR OLD."model_id" IS NOT NEW."model_id" OR OLD."reasoning_level" IS NOT NEW."reasoning_level" OR OLD."benchmark_version_id" IS NOT NEW."benchmark_version_id" OR OLD."metric_id" IS NOT NEW."metric_id" OR OLD."run_ref" IS NOT NEW."run_ref" OR OLD."result_key" IS NOT NEW."result_key" OR OLD."score_value" IS NOT NEW."score_value" OR OLD."score_raw" IS NOT NEW."score_raw" OR OLD."reported_at" IS NOT NEW."reported_at" OR OLD."reported_precision" IS NOT NEW."reported_precision" OR OLD."evaluator_set_key" IS NOT NEW."evaluator_set_key" OR OLD."primary_source_url" IS NOT NEW."primary_source_url" OR OLD."primary_source_normalized_url" IS NOT NEW."primary_source_normalized_url" OR OLD."primary_source_checked_at" IS NOT NEW."primary_source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
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

CREATE TRIGGER read_changes_results_delete AFTER DELETE ON results
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'stats';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'search-relationships';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id=OLD.model_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id WHERE bv.id=OLD.benchmark_version_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE substr(r.reported_at,1,10)=substr(OLD.reported_at,1,10) AND OLD.reported_precision='date';
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE substr(r.reported_at,1,10)=substr(OLD.reported_at,1,10) AND OLD.reported_precision='date';
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE substr(r.reported_at,1,10)=substr(OLD.reported_at,1,10) AND OLD.reported_precision='date';
END;

CREATE TRIGGER read_changes_result_evaluators_insert AFTER INSERT ON result_evaluators
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id=NEW.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id=NEW.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id=NEW.result_id;
END;

CREATE TRIGGER read_changes_result_evaluators_update AFTER UPDATE ON result_evaluators
WHEN OLD."result_id" IS NOT NEW."result_id" OR OLD."evaluator_organization_id" IS NOT NEW."evaluator_organization_id"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id=OLD.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id=OLD.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id=OLD.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id=NEW.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id=NEW.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id=NEW.result_id;
END;

CREATE TRIGGER read_changes_result_evaluators_delete AFTER DELETE ON result_evaluators
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM results r JOIN models m ON m.id=r.model_id WHERE r.id=OLD.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM results r JOIN models m ON m.id=r.model_id JOIN companies c ON c.id=m.company_id WHERE r.id=OLD.result_id;
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE r.id=OLD.result_id;
END;

CREATE TRIGGER read_changes_registry_redirects_insert AFTER INSERT ON registry_redirects
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'redirects';
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id IN(NEW.source_model_id,NEW.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id IN(NEW.source_model_id,NEW.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id IN(NEW.source_model_id,NEW.target_model_id);
END;

CREATE TRIGGER read_changes_registry_redirects_update AFTER UPDATE ON registry_redirects
WHEN OLD."source_model_id" IS NOT NEW."source_model_id" OR OLD."target_model_id" IS NOT NEW."target_model_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'redirects';
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id IN(OLD.source_model_id,OLD.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id IN(OLD.source_model_id,OLD.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id IN(OLD.source_model_id,OLD.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id IN(NEW.source_model_id,NEW.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id IN(NEW.source_model_id,NEW.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id IN(NEW.source_model_id,NEW.target_model_id);
END;

CREATE TRIGGER read_changes_registry_redirects_delete AFTER DELETE ON registry_redirects
BEGIN
    INSERT INTO registry_read_changes(logical_key) SELECT 'redirects';
    INSERT INTO registry_read_changes(logical_key) SELECT 'models';
    INSERT INTO registry_read_changes(logical_key) SELECT 'companies';
    INSERT INTO registry_read_changes(logical_key) SELECT 'inventory';
    INSERT INTO registry_read_changes(logical_key) SELECT 'model:'||m.registry_no FROM models m WHERE m.id IN(OLD.source_model_id,OLD.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'company:'||c.slug FROM models m JOIN companies c ON c.id=m.company_id WHERE m.id IN(OLD.source_model_id,OLD.target_model_id);
    INSERT INTO registry_read_changes(logical_key) SELECT 'version:'||b.slug||':'||bv.version_slug FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id WHERE m.id IN(OLD.source_model_id,OLD.target_model_id);
END;

-- Identical SQL updates must also remain true canonical no-ops.
DROP TRIGGER revision_companies_update;
CREATE TRIGGER revision_companies_update AFTER UPDATE ON companies
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."slug" IS NOT NEW."slug" OR OLD."established_at" IS NOT NEW."established_at" OR OLD."established_precision" IS NOT NEW."established_precision" OR OLD."established_source_url" IS NOT NEW."established_source_url" OR OLD."established_source_normalized_url" IS NOT NEW."established_source_normalized_url" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at" OR OLD."entity_kind" IS NOT NEW."entity_kind" OR OLD."parent_company_id" IS NOT NEW."parent_company_id" OR OLD."established_basis" IS NOT NEW."established_basis" OR OLD."established_attestation_ref" IS NOT NEW."established_attestation_ref" OR OLD."established_attested_at" IS NOT NEW."established_attested_at" OR OLD."provider_kind" IS NOT NEW."provider_kind"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_namespaces_update;
CREATE TRIGGER revision_namespaces_update AFTER UPDATE ON namespaces
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."prefix" IS NOT NEW."prefix" OR OLD."parent_namespace_id" IS NOT NEW."parent_namespace_id"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_namespace_companies_update;
CREATE TRIGGER revision_namespace_companies_update AFTER UPDATE ON namespace_companies
WHEN OLD."namespace_id" IS NOT NEW."namespace_id" OR OLD."company_id" IS NOT NEW."company_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_models_update;
CREATE TRIGGER revision_models_update AFTER UPDATE ON models
WHEN OLD."id" IS NOT NEW."id" OR OLD."canonical_name" IS NOT NEW."canonical_name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."company_id" IS NOT NEW."company_id" OR OLD."namespace_id" IS NOT NEW."namespace_id" OR OLD."sequence" IS NOT NEW."sequence" OR OLD."registry_no" IS NOT NEW."registry_no" OR OLD."release_at" IS NOT NEW."release_at" OR OLD."release_precision" IS NOT NEW."release_precision" OR OLD."release_source_url" IS NOT NEW."release_source_url" OR OLD."release_source_normalized_url" IS NOT NEW."release_source_normalized_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at" OR OLD."published_at" IS NOT NEW."published_at" OR OLD."status" IS NOT NEW."status" OR OLD."sequence_exception_reason" IS NOT NEW."sequence_exception_reason"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_model_aliases_update;
CREATE TRIGGER revision_model_aliases_update AFTER UPDATE ON model_aliases
WHEN OLD."id" IS NOT NEW."id" OR OLD."model_id" IS NOT NEW."model_id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_benchmarks_update;
CREATE TRIGGER revision_benchmarks_update AFTER UPDATE ON benchmarks
WHEN OLD."id" IS NOT NEW."id" OR OLD."canonical_name" IS NOT NEW."canonical_name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."slug" IS NOT NEW."slug" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_benchmark_aliases_update;
CREATE TRIGGER revision_benchmark_aliases_update AFTER UPDATE ON benchmark_aliases
WHEN OLD."id" IS NOT NEW."id" OR OLD."benchmark_id" IS NOT NEW."benchmark_id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_benchmark_versions_update;
CREATE TRIGGER revision_benchmark_versions_update AFTER UPDATE ON benchmark_versions
WHEN OLD."id" IS NOT NEW."id" OR OLD."benchmark_id" IS NOT NEW."benchmark_id" OR OLD."version" IS NOT NEW."version" OR OLD."version_slug" IS NOT NEW."version_slug" OR OLD."release_at" IS NOT NEW."release_at" OR OLD."release_precision" IS NOT NEW."release_precision" OR OLD."metric_id" IS NOT NEW."metric_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_metrics_update;
CREATE TRIGGER revision_metrics_update AFTER UPDATE ON metrics
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."key" IS NOT NEW."key" OR OLD."storage_kind" IS NOT NEW."storage_kind" OR OLD."unit" IS NOT NEW."unit" OR OLD."display_precision" IS NOT NEW."display_precision" OR OLD."minimum_value" IS NOT NEW."minimum_value" OR OLD."maximum_value" IS NOT NEW."maximum_value" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_evaluator_organizations_update;
CREATE TRIGGER revision_evaluator_organizations_update AFTER UPDATE ON evaluator_organizations
WHEN OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."normalized_name" IS NOT NEW."normalized_name" OR OLD."key" IS NOT NEW."key" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_benchmark_version_evaluators_update;
CREATE TRIGGER revision_benchmark_version_evaluators_update AFTER UPDATE ON benchmark_version_evaluators
WHEN OLD."benchmark_version_id" IS NOT NEW."benchmark_version_id" OR OLD."evaluator_organization_id" IS NOT NEW."evaluator_organization_id"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_results_update;
CREATE TRIGGER revision_results_update AFTER UPDATE ON results
WHEN OLD."id" IS NOT NEW."id" OR OLD."model_id" IS NOT NEW."model_id" OR OLD."reasoning_level" IS NOT NEW."reasoning_level" OR OLD."benchmark_version_id" IS NOT NEW."benchmark_version_id" OR OLD."metric_id" IS NOT NEW."metric_id" OR OLD."run_ref" IS NOT NEW."run_ref" OR OLD."result_key" IS NOT NEW."result_key" OR OLD."score_value" IS NOT NEW."score_value" OR OLD."score_raw" IS NOT NEW."score_raw" OR OLD."reported_at" IS NOT NEW."reported_at" OR OLD."reported_precision" IS NOT NEW."reported_precision" OR OLD."evaluator_set_key" IS NOT NEW."evaluator_set_key" OR OLD."primary_source_url" IS NOT NEW."primary_source_url" OR OLD."primary_source_normalized_url" IS NOT NEW."primary_source_normalized_url" OR OLD."primary_source_checked_at" IS NOT NEW."primary_source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_result_evaluators_update;
CREATE TRIGGER revision_result_evaluators_update AFTER UPDATE ON result_evaluators
WHEN OLD."result_id" IS NOT NEW."result_id" OR OLD."evaluator_organization_id" IS NOT NEW."evaluator_organization_id"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_result_sources_update;
CREATE TRIGGER revision_result_sources_update AFTER UPDATE ON result_sources
WHEN OLD."id" IS NOT NEW."id" OR OLD."result_id" IS NOT NEW."result_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
DROP TRIGGER revision_registry_redirects_update;
CREATE TRIGGER revision_registry_redirects_update AFTER UPDATE ON registry_redirects
WHEN OLD."source_model_id" IS NOT NEW."source_model_id" OR OLD."target_model_id" IS NOT NEW."target_model_id" OR OLD."source_url" IS NOT NEW."source_url" OR OLD."normalized_source_url" IS NOT NEW."normalized_source_url" OR OLD."source_checked_at" IS NOT NEW."source_checked_at"
BEGIN
 UPDATE registry_revision SET token=lower(hex(randomblob(16))) WHERE id=1;
END;
