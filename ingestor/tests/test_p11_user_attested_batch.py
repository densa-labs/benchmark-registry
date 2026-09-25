import json
import sqlite3
from pathlib import Path

from benchmark_registry_ingestor.database import LocalDatabase
from benchmark_registry_ingestor.engine import Ingestor


ROOT = Path(__file__).parents[2]
BATCHES = ROOT / "data" / "batches"


def test_p11_batch_replays_from_canonical_history(tmp_path: Path) -> None:
    path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(path) as db:
        db.execute("PRAGMA foreign_keys = ON")
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            db.executescript(migration.read_text())
    database = LocalDatabase(path)
    ingestor = Ingestor(database)
    for name in ("p4-seed.json", "launch-dataset.json", "p11-company-corrections.json"):
        outcomes = ingestor.run("batch", json.loads((BATCHES / name).read_text()), commit=True)
        assert all(outcome.status in {"VALID", "SKIPPED"} for outcome in outcomes)

    before_numbers = database.query("SELECT registry_no FROM models ORDER BY registry_no")
    before_results = database.query("SELECT * FROM results ORDER BY id")
    batch = json.loads((BATCHES / "p11-user-attested-dates.json").read_text())
    dry_run = ingestor.run("batch", batch, commit=False)
    assert len(dry_run) == 23
    assert all(outcome.status == "VALID" for outcome in dry_run)
    assert ingestor.run("batch", batch, commit=True) == dry_run
    assert all(outcome.status == "SKIPPED" for outcome in ingestor.run("batch", batch, commit=False))

    dates = {row["slug"]: row["established_at"] for row in database.query(
        "SELECT slug, established_at FROM companies"
    )}
    assert dates == {
        "tongyi": "2022-09-02", "anthropic": "2021-01-26", "cursor": "2022-08-15",
        "deepseek": "2023-07-17", "google-deepmind": "2010-09-23",
        "meta-ai": "2013-12-09", "microsoft-ai": "2024-03-19",
        "minimax": "2021-06-30", "mistral": "2023-04-28",
        "moonshot-ai": "2023-03-01", "nvidia": "1993-04-05",
        "openai": "2015-12-11", "spacexai": "2023-03-09",
        "thinking-machines": "2025-02-19", "z-ai": "2019-06-11",
    }
    assert database.query("SELECT registry_no FROM models ORDER BY registry_no") == before_numbers
    assert database.query("SELECT * FROM results ORDER BY id") == before_results
    assert database.query("PRAGMA foreign_key_check") == []
