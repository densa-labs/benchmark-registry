"""Revision triggers preserve the ingestor's existing transactional boundary."""
import json
import sqlite3
from pathlib import Path

import pytest

from benchmark_registry_ingestor.database import (
    DatabaseFailure,
    LocalDatabase,
    Statement,
)
from benchmark_registry_ingestor.engine import Ingestor

ROOT = Path(__file__).parents[2]


@pytest.fixture
def database(tmp_path):
    path = tmp_path / "registry.sqlite"
    with sqlite3.connect(path) as db:
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            db.executescript(migration.read_text())
    return LocalDatabase(path)


def token(database):
    return database.query("SELECT token FROM registry_revision WHERE id=1")[0]["token"]


def test_revision_changes_atomically_and_skips_noop_batches(database):
    before = token(database)
    database.execute_batch([])
    assert token(database) == before
    database.execute_batch([Statement("UPDATE namespaces SET name=name WHERE prefix='10'")])
    assert token(database) == before
    database.execute_batch([Statement("UPDATE namespaces SET name=name || ' corrected' WHERE prefix='10'")])
    assert token(database) != before


def test_revision_rolls_back_with_invalid_batch(database):
    before = token(database)
    with pytest.raises(DatabaseFailure):
        database.execute_batch([
            Statement("UPDATE namespaces SET name=name WHERE prefix='10'"),
            Statement("INSERT INTO registry_revision VALUES (2, 'invalid')"),
        ])
    assert token(database) == before


def test_all_dependency_tables_have_revision_triggers(database):
    rows = database.query("SELECT name, tbl_name FROM sqlite_schema WHERE type='trigger' AND name LIKE 'revision_%'")
    tables = {"companies", "namespaces", "namespace_companies", "models", "model_aliases", "benchmarks", "benchmark_aliases", "benchmark_versions", "metrics", "evaluator_organizations", "benchmark_version_evaluators", "results", "result_evaluators", "result_sources", "registry_redirects", "configurations", "benchmark_version_configurations"}
    assert {row["tbl_name"] for row in rows} == tables
    assert len(rows) == len(tables) * 3
    assert "USING INTEGER PRIMARY KEY" in database.query("EXPLAIN QUERY PLAN SELECT token FROM registry_revision WHERE id=1")[0]["detail"]


def test_measured_scan_indexes_are_used(database):
    shapes = [
        ("SELECT name FROM model_aliases WHERE model_id=1 ORDER BY normalized_name", "idx_model_aliases_owner_name"),
        ("SELECT name FROM benchmark_aliases WHERE benchmark_id=1 ORDER BY normalized_name", "idx_benchmark_aliases_owner_name"),
        ("SELECT id FROM results WHERE model_id=1 AND reasoning_level='' AND benchmark_version_id=1 AND metric_id=1 AND evaluator_set_key='x'", "idx_results_series"),
        ("SELECT id FROM models WHERE release_precision='date' AND substr(release_at,1,10)='2026-01-01'", "idx_models_date_peers"),
    ]
    for sql, index in shapes:
        plan = " ".join(row["detail"] for row in database.query(f"EXPLAIN QUERY PLAN {sql}"))
        assert index in plan


def test_controlled_ingestion_revision_dry_run_commit_and_duplicates(database):
    payload = json.loads((ROOT / "data/batches/p4-seed.json").read_text())
    ingestor = Ingestor(database)
    before = token(database)
    dry_run = ingestor.run("batch", payload, commit=False)
    assert all(outcome.status == "VALID" for outcome in dry_run)
    assert token(database) == before
    ingestor.run("batch", payload, commit=True)
    committed = token(database)
    assert committed != before
    duplicate = ingestor.run("batch", payload, commit=True)
    assert all(outcome.status == "SKIPPED" for outcome in duplicate)
    assert token(database) == committed


def test_materialization_runs_only_after_actual_commit_and_failure_remains_pending(database):
    from benchmark_registry_ingestor.engine import PublicationPending

    payload = json.loads((ROOT / "data/batches/p4-seed.json").read_text())
    calls = []
    ingestor = Ingestor(database, lambda: calls.append(token(database)))
    ingestor.run("batch", payload, commit=False)
    assert calls == []
    ingestor.run("batch", payload, commit=True)
    assert len(calls) == 1
    ingestor.run("batch", payload, commit=True)
    assert len(calls) == 1
    before = token(database)
    # Provider correction uses the existing controlled compare-and-set operation.
    company = database.query("SELECT name FROM companies WHERE slug='openai'")[0]
    correction = {"slug": "openai", "expected_name": company["name"],
                  "corrected_name": "OpenAI test correction", "reason": "fixture"}

    def failure():
        raise RuntimeError("materialized store unavailable")

    with pytest.raises(PublicationPending):
        Ingestor(database, failure).run("provider_name_correction", correction, commit=True)
    assert token(database) != before
    assert database.query("SELECT name FROM companies WHERE slug='openai'")[0]["name"] == correction["corrected_name"]
    assert database.query("SELECT count(*) AS n FROM registry_read_changes")[0]["n"] > 0
