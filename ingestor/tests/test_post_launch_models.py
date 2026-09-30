import json
import sqlite3
from pathlib import Path

from benchmark_registry_ingestor.database import LocalDatabase
from benchmark_registry_ingestor.engine import Ingestor

ROOT = Path(__file__).parents[2]


def test_post_launch_models_append_without_changing_published_records(tmp_path):
    path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            connection.executescript(migration.read_text())
    database = LocalDatabase(path)
    ingestor = Ingestor(database)
    for name in ["p4-seed.json", "launch-dataset.json"]:
        ingestor.run(
            "batch", json.loads((ROOT / "data/batches" / name).read_text()),
            commit=True,
        )
    before = database.query("SELECT * FROM models ORDER BY registry_no")
    results_before = database.query("SELECT * FROM results ORDER BY id")
    batch = json.loads(
        (ROOT / "data/batches/post-launch-models-2026-09-30.json").read_text()
    )
    batch["records"].extend(json.loads(
        (ROOT / "data/batches/post-launch-benchmarks-2026-09-30.json").read_text()
    )["records"])
    assert all(x.status == "VALID" for x in ingestor.run("batch", batch, commit=False))
    assert database.query("SELECT * FROM models ORDER BY registry_no") == before
    assert database.query("SELECT * FROM results ORDER BY id") == results_before
    assert all(
        x.status == "VALID" for x in ingestor.run("batch", batch, commit=True)
    )
    assert all(
        x.status == "SKIPPED" for x in ingestor.run("batch", batch, commit=True)
    )
    assert database.query(
        "SELECT registry_no, canonical_name, release_at FROM models "
        "WHERE registry_no IN ('10015', '20016') ORDER BY registry_no"
    ) == [
        {"registry_no": "10015", "canonical_name": "GPT-6.1 Sol",
         "release_at": "2026-09-29"},
        {"registry_no": "20016", "canonical_name": "Claude Sonnet 5.5",
         "release_at": "2026-09-28"},
    ]
    assert database.query(
        "SELECT * FROM models WHERE registry_no NOT IN ('10015', '20016') "
        "ORDER BY registry_no"
    ) == before
    assert database.query(
        "SELECT * FROM results WHERE id IN (" +
        ",".join("?" for _ in results_before) + ") ORDER BY id",
        [row["id"] for row in results_before],
    ) == results_before
    assert database.query(
        "SELECT m.registry_no FROM models m LEFT JOIN results r ON r.model_id=m.id "
        "WHERE r.id IS NULL"
    ) == []
    assert database.query(
        "SELECT m.registry_no, COUNT(*) AS count FROM models m "
        "JOIN results r ON r.model_id=m.id "
        "WHERE m.registry_no IN ('10015','20016','20001') "
        "GROUP BY m.registry_no ORDER BY m.registry_no"
    ) == [
        {"registry_no": "10015", "count": 25},
        {"registry_no": "20001", "count": 3},
        {"registry_no": "20016", "count": 14},
    ]
