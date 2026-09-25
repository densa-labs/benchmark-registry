import json
import sqlite3
from pathlib import Path

import pytest

from benchmark_registry_ingestor import __version__
from benchmark_registry_ingestor.cli import main


def test_cli_without_arguments_prints_help(capsys: pytest.CaptureFixture[str]) -> None:
    assert main([]) == 0

    output = capsys.readouterr().out
    assert "usage: registry-ingest" in output


def test_cli_reports_package_version(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc_info:
        main(["--version"])

    assert exc_info.value.code == 0
    assert capsys.readouterr().out.strip() == f"registry-ingest {__version__}"


def test_cli_requires_explicit_mode() -> None:
    with pytest.raises(SystemExit) as exc_info:
        main(["company", "record.json"])

    assert exc_info.value.code == 2


def test_cli_dry_run_emits_json_and_does_not_write(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    root = Path(__file__).parents[2]
    database_path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(database_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        for migration in sorted((root / "migrations").glob("*.sql")):
            connection.executescript(migration.read_text())
    record_path = tmp_path / "company.json"
    record_path.write_text(
        json.dumps(
            {
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
        )
    )
    monkeypatch.setenv("REGISTRY_LOCAL_DB_PATH", str(database_path))

    assert main(["company", str(record_path), "--dry-run"]) == 0

    output = json.loads(capsys.readouterr().out)
    assert output["status"] == "VALID"
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM companies").fetchone() == (0,)


def test_cli_company_correction_commit_and_replay(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    root = Path(__file__).parents[2]
    database_path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(database_path) as connection:
        for migration in sorted((root / "migrations").glob("*.sql")):
            connection.executescript(migration.read_text())
    company_path = tmp_path / "company.json"
    company_path.write_text(json.dumps({
        "name": "OpenAI",
        "slug": "openai",
        "established_at": None,
        "established_precision": None,
        "established_source_url": None,
        "establishment_gap_documented": True,
        "source_url": "https://openai.com/about/",
        "source_checked_at": "2026-09-17T00:00:00Z",
        "namespace_authorizations": [{
            "namespace_prefix": "10",
            "source_url": "https://openai.com/models/",
            "source_checked_at": "2026-09-17T00:00:00Z",
        }],
    }))
    correction_path = tmp_path / "correction.json"
    correction_path.write_text(json.dumps({
        "slug": "openai",
        "expected": {
            "established_at": None,
            "established_precision": None,
            "established_source_url": None,
            "source_checked_at": "2026-09-17T00:00:00Z",
        },
        "corrected": {
            "established_at": "2015",
            "established_precision": "year",
            "established_source_url": "https://openai.com/about/",
            "source_checked_at": "2026-09-25T00:00:00Z",
        },
        "reason": "Official source verifies the founding year.",
    }))
    monkeypatch.setenv("REGISTRY_LOCAL_DB_PATH", str(database_path))

    assert main(["company", str(company_path), "--commit"]) == 0
    capsys.readouterr()
    assert main(["company_correction", str(correction_path), "--dry-run"]) == 0
    assert json.loads(capsys.readouterr().out)["status"] == "VALID"
    assert main(["company_correction", str(correction_path), "--commit"]) == 0
    assert json.loads(capsys.readouterr().out)["status"] == "VALID"
    assert main(["company_correction", str(correction_path), "--dry-run"]) == 0
    assert json.loads(capsys.readouterr().out)["status"] == "SKIPPED"
