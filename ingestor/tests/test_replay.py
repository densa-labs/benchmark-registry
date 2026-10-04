import copy
import hashlib
import json
import sqlite3
from collections import Counter
from pathlib import Path

import pytest

from benchmark_registry_ingestor.cli import main
from benchmark_registry_ingestor.database import LocalDatabase
from benchmark_registry_ingestor.engine import IngestionFailure, Ingestor, LaterRecord

ROOT = Path(__file__).parents[2]
BATCHES = ROOT / "data" / "batches"
P11 = (
    "p11-company-corrections.json",
    "p11-user-attested-dates.json",
    "p11-staging-provider-consolidation.json",
)


def migrated(tmp_path: Path) -> Path:
    path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(path) as connection:
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            connection.executescript(migration.read_text())
    return path


def batch(name: str) -> dict:
    return json.loads((BATCHES / name).read_text())


def later(*names: str) -> list[LaterRecord]:
    return [
        LaterRecord(name, item["operation"], item["record"])
        for name in names
        for item in batch(name)["records"]
    ]


@pytest.fixture(scope="module")
def corrected(tmp_path_factory: pytest.TempPathFactory) -> LocalDatabase:
    """p4 and launch, then every p11 correction, retirement and rename."""
    database = LocalDatabase(migrated(tmp_path_factory.mktemp("replay")))
    for name in ("p4-seed.json", "launch-dataset.json", *P11):
        Ingestor(database).run("batch", batch(name), commit=True)
    return database


def test_superseded_records_skip_with_their_source(corrected: LocalDatabase) -> None:
    outcomes = Ingestor(corrected).run(
        "batch", batch("launch-dataset.json"), commit=False, later=later(*P11)
    )
    assert {outcome.status for outcome in outcomes} == {"SKIPPED"}
    reasons = {o.identifier: o.message for o in outcomes if "superseded" in o.message}
    # Attested establishment, retired provider and a provider-corrected model.
    assert reasons["minimax"] == (
        "superseded by p11-user-attested-dates.json company_attestation"
    )
    assert reasons["alibaba"] == (
        "superseded by p11-user-attested-dates.json provider_retirement"
    )
    assert reasons["130001"] == (
        "superseded by p11-user-attested-dates.json model_provider_correction"
    )


def test_superseded_corrections_and_retired_providers_skip(
    corrected: LocalDatabase,
) -> None:
    outcomes = Ingestor(corrected).run(
        "batch",
        batch("p11-company-corrections.json"),
        commit=False,
        later=later(*P11[1:]),
    )
    assert Counter(o.status for o in outcomes) == {"SKIPPED": 8}
    retired = {o.identifier: o.message for o in outcomes}
    assert retired["alibaba"].endswith("provider_retirement")
    assert retired["mistral"].endswith("company_attestation")


def test_without_later_context_the_old_record_still_conflicts(
    corrected: LocalDatabase,
) -> None:
    with pytest.raises(IngestionFailure) as failure:
        Ingestor(corrected).run("batch", batch("p4-seed.json"), commit=False)
    assert (failure.value.status, failure.value.identifier) == ("CONFLICT", "openai")


@pytest.mark.parametrize(
    ("operation", "identifier", "change"),
    [
        ("company", "openai", lambda r: r.update(source_url="https://openai.com/x")),
        ("company", "google", lambda r: r.update(name="Google Research")),
        ("model", "30001", lambda r: r.update(release_at="2025-01-01")),
    ],
)
def test_genuinely_changed_fact_still_conflicts(
    corrected: LocalDatabase, operation, identifier, change
) -> None:
    payload = copy.deepcopy(batch("p4-seed.json"))
    key = "slug" if operation == "company" else "registry_no"
    record = next(
        item["record"]
        for item in payload["records"]
        if item["operation"] == operation and item["record"][key] == identifier
    )
    change(record)
    payload["records"] = [{"operation": operation, "record": record}]
    with pytest.raises(IngestionFailure) as failure:
        Ingestor(corrected).run("batch", payload, commit=False, later=later(*P11))
    assert failure.value.identifier == identifier
    assert failure.value.status in {"CONFLICT", "ERROR"}


def test_unapplied_correction_does_not_hide_a_conflict(tmp_path: Path) -> None:
    database = LocalDatabase(migrated(tmp_path))
    Ingestor(database).run("batch", batch("p4-seed.json"), commit=True)
    Ingestor(database).run("batch", batch("launch-dataset.json"), commit=True)
    payload = copy.deepcopy(batch("launch-dataset.json"))
    payload["records"] = [
        item for item in payload["records"]
        if item["operation"] == "company" and item["record"]["slug"] == "minimax"
    ]
    payload["records"][0]["record"]["source_url"] = "https://example.org/minimax"
    # The attestation exists in the manifest but has not been applied here.
    with pytest.raises(IngestionFailure) as failure:
        Ingestor(database).run("batch", payload, commit=False, later=later(*P11))
    assert failure.value.status == "CONFLICT"


def test_first_pass_is_unchanged_by_later_context(tmp_path: Path) -> None:
    database = LocalDatabase(migrated(tmp_path))
    outcomes = Ingestor(database).run(
        "batch", batch("p4-seed.json"), commit=True, later=later(*P11)
    )
    assert {outcome.status for outcome in outcomes} == {"VALID"}
    slugs = {row["slug"] for row in database.query("SELECT slug FROM companies")}
    assert {"openai", "anthropic", "google"} <= slugs


def test_cli_manifest_replay_twice_skips_everything(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("REGISTRY_LOCAL_DB_PATH", str(migrated(tmp_path)))
    manifest = str(BATCHES / "manifest.json")
    assert main(["replay", manifest, "--commit"]) == 0
    capsys.readouterr()
    assert main(["replay", manifest, "--commit"]) == 0
    second = [json.loads(line) for line in capsys.readouterr().out.splitlines()]
    assert second and {row["status"] for row in second} == {"SKIPPED"}


def test_replay_refuses_remote_commit_and_changed_batches(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert main(["replay", str(BATCHES / "manifest.json"), "--commit",
                 "--target", "remote"]) == 2
    assert "only to a local database" in capsys.readouterr().err
    (tmp_path / "a.json").write_text('{"records": []}')
    (tmp_path / "manifest.json").write_text(json.dumps({"batches": [{
        "order": 1, "file": "a.json",
        "sha256": hashlib.sha256(b"different").hexdigest(),
    }]}))
    assert main(["replay", str(tmp_path / "manifest.json"), "--dry-run"]) == 2
    assert "does not match its manifest sha256" in capsys.readouterr().err
