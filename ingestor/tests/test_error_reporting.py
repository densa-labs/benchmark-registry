import json
from pathlib import Path

from benchmark_registry_ingestor import cli

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
