import json
import sqlite3
import subprocess
from pathlib import Path

from benchmark_registry_ingestor import cli
from benchmark_registry_ingestor.database import LocalDatabase

ROOT = Path(__file__).parents[2]
COMPANY = {
    "name": "OpenAI",
    "slug": "openai",
    "established_at": None,
    "established_precision": None,
    "established_source_url": None,
    "establishment_gap_documented": True,
    "source_url": "https://openai.com/about/",
    "source_checked_at": "2026-09-17T00:00:00Z",
    "namespace_authorizations": [
        {
            "namespace_prefix": "10",
            "source_url": "https://openai.com/models/",
            "source_checked_at": "2026-09-17T00:00:00Z",
        }
    ],
}


class DuplicateCompanies:
    """A database whose companies table breaks slug uniqueness."""

    def query(self, sql, params=()):
        if sql == "SELECT * FROM companies":
            return [{"id": 1, "slug": "openai"}, {"id": 2, "slug": "openai"}]
        return []

    def execute_batch(self, statements):
        raise AssertionError("nothing may be written")


def write_batch(tmp_path: Path) -> Path:
    path = tmp_path / "batch.json"
    path.write_text(json.dumps({"records": [{"operation": "company", "record": COMPANY}]}))
    return path


def test_database_invariant_is_a_clear_error_naming_batch_and_record(
    tmp_path, monkeypatch, capsys
):
    monkeypatch.setattr(
        cli, "database_from_environment", lambda target, commit: DuplicateCompanies()
    )
    path = write_batch(tmp_path)
    assert cli.main(["batch", str(path), "--dry-run"]) == 2
    error = json.loads(capsys.readouterr().err)
    assert error == {
        "status": "ERROR",
        "operation": "batch",
        "input": str(path),
        "identifier": "openai",
        "message": "database invariant violated for companies: {'slug': 'openai'}",
    }


def test_materializer_failure_reports_its_stderr(tmp_path, monkeypatch, capsys):
    database = tmp_path / "registry.sqlite3"
    with sqlite3.connect(database) as connection:
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            connection.executescript(migration.read_text())
    monkeypatch.setattr(
        cli, "database_from_environment", lambda target, commit: LocalDatabase(database)
    )
    monkeypatch.setenv("CLOUDFLARE_D1_DATABASE_ID", "59a384d9-5fba-45e4-97be-3bd1e047def1")
    monkeypatch.setattr(
        cli.subprocess,
        "run",
        lambda *args, **kwargs: subprocess.CompletedProcess(
            args, 1, stdout="", stderr="Error: READ_STORE lease is held by another run\n"
        ),
    )
    assert cli.main(["batch", str(write_batch(tmp_path)), "--commit",
                     "--target", "remote"]) == 4
    error = json.loads(capsys.readouterr().err)
    assert error["canonical_committed"] is True
    assert error["message"].endswith(
        "Cause: materializer exited 1: Error: READ_STORE lease is held by another run"
    )
