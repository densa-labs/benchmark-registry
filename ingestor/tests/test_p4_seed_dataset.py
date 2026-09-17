import json
import sqlite3
from pathlib import Path

from benchmark_registry_ingestor.database import LocalDatabase
from benchmark_registry_ingestor.engine import Ingestor

ROOT = Path(__file__).parents[2]
SEED_BATCH = ROOT / "data" / "batches" / "p4-seed.json"


def migrated_database(tmp_path: Path) -> LocalDatabase:
    database_path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(database_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            connection.executescript(migration.read_text())
    return LocalDatabase(database_path)


def test_p4_seed_populates_clean_database_and_covers_required_edges(
    tmp_path: Path,
) -> None:
    database = migrated_database(tmp_path)
    payload = json.loads(SEED_BATCH.read_text())
    ingestor = Ingestor(database)

    first = ingestor.run("batch", payload, commit=True)
    second = ingestor.run("batch", payload, commit=True)

    assert all(outcome.status == "VALID" for outcome in first)
    assert all(outcome.status == "SKIPPED" for outcome in second)
    assert database.query("SELECT COUNT(*) AS count FROM companies") == [{"count": 3}]
    assert database.query("SELECT COUNT(*) AS count FROM models") == [{"count": 11}]
    assert database.query("SELECT COUNT(*) AS count FROM benchmarks") == [{"count": 6}]
    assert database.query("SELECT COUNT(*) AS count FROM results") == [{"count": 56}]

    assert database.query(
        """SELECT COUNT(DISTINCT reasoning_level) AS count
           FROM results
           JOIN models ON models.id = results.model_id
           WHERE models.registry_no = '15001'"""
    ) == [{"count": 9}]
    assert database.query(
        """SELECT COUNT(*) AS count
           FROM benchmark_versions
           JOIN benchmarks ON benchmarks.id = benchmark_versions.benchmark_id
           WHERE benchmarks.slug = 'healthbench'"""
    ) == [{"count": 3}]
    assert database.query("SELECT COUNT(*) AS count FROM model_aliases") == [
        {"count": 12}
    ]
    assert database.query(
        """SELECT COUNT(*) AS count
           FROM benchmark_version_evaluators
           JOIN benchmark_versions
             ON benchmark_versions.id = benchmark_version_id
           JOIN benchmarks ON benchmarks.id = benchmark_versions.benchmark_id
           WHERE benchmarks.slug = 'swe-bench'
             AND benchmark_versions.version = 'Verified'"""
    ) == [{"count": 2}]
    assert database.query("SELECT storage_kind, unit FROM metrics ORDER BY key") == [
        {"storage_kind": "integer", "unit": "elo"},
        {"storage_kind": "decimal", "unit": "percent"},
        {"storage_kind": "decimal", "unit": "percent"},
        {"storage_kind": "decimal", "unit": "percent"},
        {"storage_kind": "decimal", "unit": "percent"},
        {"storage_kind": "decimal", "unit": "percent"},
    ]
    assert database.query(
        """SELECT COUNT(*) AS count
           FROM namespace_companies
           JOIN companies ON companies.id = company_id
           WHERE companies.slug = 'openai'"""
    ) == [{"count": 2}]
    assert database.query(
        "SELECT COUNT(*) AS count FROM models WHERE status = 'deprecated'"
    ) == [{"count": 5}]
