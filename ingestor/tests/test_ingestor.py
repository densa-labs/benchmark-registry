from __future__ import annotations

import os
import sqlite3
import uuid
from pathlib import Path

import pytest

from benchmark_registry_ingestor.database import (
    DatabaseFailure,
    LocalDatabase,
    RemoteD1Database,
    Statement,
    database_from_environment,
)
from benchmark_registry_ingestor.engine import IngestionFailure, Ingestor

MIGRATIONS = Path(__file__).parents[2] / "migrations"
CHECKED_AT = "2026-09-17T00:00:00Z"


@pytest.fixture
def database_path(tmp_path: Path) -> Path:
    path = tmp_path / "registry.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        for migration in sorted(MIGRATIONS.glob("*.sql")):
            connection.executescript(migration.read_text())
    return path


@pytest.fixture
def database(database_path: Path) -> LocalDatabase:
    return LocalDatabase(database_path)


@pytest.fixture
def ingestor(database: LocalDatabase) -> Ingestor:
    return Ingestor(database)


def company_record() -> dict:
    return {
        "name": "OpenAI",
        "slug": "openai",
        "established_at": "2015-12-11",
        "established_precision": "date",
        "established_source_url": "https://openai.com/about/",
        "source_url": "https://openai.com/about/",
        "source_checked_at": CHECKED_AT,
        "namespace_authorizations": [
            {
                "namespace_prefix": "10",
                "source_url": "https://openai.com/models/",
                "source_checked_at": CHECKED_AT,
            }
        ],
    }


def model_record(
    *,
    sequence: int = 1,
    registry_no: str = "10001",
    name: str = "Example Model",
    release_at: str = "2026-01-10",
    exception: str | None = None,
) -> dict:
    return {
        "canonical_name": name,
        "company_slug": "openai",
        "namespace_prefix": "10",
        "sequence": sequence,
        "registry_no": registry_no,
        "release_at": release_at,
        "release_precision": "date",
        "release_source_url": f"https://openai.com/{registry_no}",
        "source_checked_at": CHECKED_AT,
        "published_at": "2026-09-17T00:00:00Z",
        "status": "active",
        "sequence_exception_reason": exception,
        "aliases": [
            {
                "name": f"example-{registry_no}",
                "source_url": f"https://openai.com/{registry_no}",
                "source_checked_at": CHECKED_AT,
            }
        ],
    }


def evaluator_record(key: str = "example-evaluator") -> dict:
    return {
        "name": key.replace("-", " ").title(),
        "key": key,
        "source_url": f"https://example.com/{key}",
        "source_checked_at": CHECKED_AT,
    }


def metric_record(
    *,
    key: str = "accuracy",
    storage_kind: str = "decimal",
    minimum: str | None = "0",
    maximum: str | None = "100",
) -> dict:
    return {
        "name": key.title(),
        "key": key,
        "storage_kind": storage_kind,
        "unit": "label" if storage_kind == "text" else "percent",
        "display_precision": 0 if storage_kind == "text" else 2,
        "minimum_value": minimum,
        "maximum_value": maximum,
        "source_url": f"https://example.com/metrics/{key}",
        "source_checked_at": CHECKED_AT,
    }


def version_record(
    *,
    version: str = "1.0",
    version_slug: str = "1.0",
    metric_key: str = "accuracy",
    evaluators: list[str] | None = None,
) -> dict:
    return {
        "version": version,
        "version_slug": version_slug,
        "release_at": "2026-01-01",
        "release_precision": "date",
        "metric_key": metric_key,
        "source_url": f"https://example.com/benchmark/{version_slug}",
        "source_checked_at": CHECKED_AT,
        "evaluator_keys": evaluators or ["example-evaluator"],
    }


def benchmark_record() -> dict:
    return {
        "canonical_name": "Example Benchmark",
        "slug": "example-benchmark",
        "source_url": "https://example.com/benchmark",
        "source_checked_at": CHECKED_AT,
        "aliases": [
            {
                "name": "EB",
                "source_url": "https://example.com/benchmark",
                "source_checked_at": CHECKED_AT,
            }
        ],
        "evaluators": [evaluator_record()],
        "metrics": [metric_record()],
        "versions": [version_record()],
    }


def result_record(*, run_ref: str | None = "run-1", score: object = "091.200") -> dict:
    record = {
        "model_registry_no": "10001",
        "reasoning_level": "max",
        "benchmark_slug": "example-benchmark",
        "benchmark_version": "1.0",
        "metric_key": "accuracy",
        "score_value": score,
        "score_raw": "91.200%",
        "reported_at": "2026-09-17",
        "reported_precision": "date",
        "evaluator_keys": ["example-evaluator"],
        "sources": [
            {
                "url": "https://example.com/results/run-1#row",
                "checked_at": CHECKED_AT,
                "primary": True,
            }
        ],
    }
    if run_ref is not None:
        record["run_ref"] = run_ref
    return record


def seed_dependencies(ingestor: Ingestor) -> None:
    ingestor.run("company", company_record(), commit=True)
    ingestor.run("benchmark", benchmark_record(), commit=True)
    ingestor.run("model", model_record(), commit=True)


def assert_failure(
    ingestor: Ingestor,
    operation: str,
    record: dict,
    *,
    status: str = "ERROR",
    match: str | None = None,
) -> IngestionFailure:
    with pytest.raises(IngestionFailure) as exc_info:
        ingestor.run(operation, record, commit=True)
    assert exc_info.value.status == status
    if match:
        assert match in exc_info.value.message
    return exc_info.value


def test_valid_individual_company(ingestor: Ingestor, database: LocalDatabase) -> None:
    outcomes = ingestor.run("company", company_record(), commit=True)

    assert [outcome.status for outcome in outcomes] == ["VALID"]
    assert database.query("SELECT slug FROM companies") == [{"slug": "openai"}]
    assert len(database.query("SELECT * FROM namespace_companies")) == 1


def test_missing_company_establishment_requires_documented_gap(
    ingestor: Ingestor,
) -> None:
    record = company_record()
    record["established_at"] = None
    record["established_precision"] = None
    record["established_source_url"] = None

    assert_failure(ingestor, "company", record, match="gap_documented")

    record["establishment_gap_documented"] = True
    assert ingestor.run("company", record, commit=True)[0].status == "VALID"


def test_valid_individual_model(ingestor: Ingestor, database: LocalDatabase) -> None:
    ingestor.run("company", company_record(), commit=True)

    outcomes = ingestor.run("model", model_record(), commit=True)

    assert outcomes[0].status == "VALID"
    assert database.query("SELECT registry_no FROM models") == [
        {"registry_no": "10001"}
    ]
    assert len(database.query("SELECT * FROM model_aliases")) == 1


def test_valid_benchmark_and_version(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    outcomes = ingestor.run("benchmark", benchmark_record(), commit=True)

    assert outcomes[0].status == "VALID"
    assert database.query("SELECT version FROM benchmark_versions") == [
        {"version": "1.0"}
    ]
    assert len(database.query("SELECT * FROM benchmark_version_evaluators")) == 1


def test_valid_result_canonicalizes_numeric_score(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    seed_dependencies(ingestor)

    outcomes = ingestor.run("result", result_record(), commit=True)

    assert outcomes[0].status == "VALID"
    assert database.query("SELECT score_value, score_raw FROM results") == [
        {"score_value": "91.2", "score_raw": "91.200%"}
    ]


def test_valid_multi_record_batch_is_atomic_and_rerunnable(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    batch = {
        "records": [
            {"operation": "company", "record": company_record()},
            {"operation": "benchmark", "record": benchmark_record()},
            {"operation": "model", "record": model_record()},
            {"operation": "result", "record": result_record()},
        ]
    }

    first = ingestor.run("batch", batch, commit=True)
    second = ingestor.run("batch", batch, commit=True)

    assert [outcome.status for outcome in first] == ["VALID"] * 4
    assert [outcome.status for outcome in second] == ["SKIPPED"] * 4
    assert database.query("SELECT COUNT(*) AS count FROM results") == [{"count": 1}]


def test_dry_run_does_not_mutate(ingestor: Ingestor, database: LocalDatabase) -> None:
    outcomes = ingestor.run("company", company_record(), commit=False)

    assert outcomes[0].status == "VALID"
    assert database.query("SELECT * FROM companies") == []


def test_duplicate_and_conflicting_result(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    seed_dependencies(ingestor)
    ingestor.run("result", result_record(), commit=True)

    duplicate = ingestor.run("result", result_record(), commit=True)
    conflict = result_record(score="92")

    assert duplicate[0].status == "SKIPPED"
    assert_failure(ingestor, "result", conflict, status="CONFLICT")
    assert database.query("SELECT score_value FROM results") == [
        {"score_value": "91.2"}
    ]


def test_distinct_rerun_is_retained(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    seed_dependencies(ingestor)
    ingestor.run("result", result_record(), commit=True)
    rerun = result_record(run_ref="run-2", score="92")
    rerun["reported_at"] = "2026-09-18"

    ingestor.run("result", rerun, commit=True)

    assert database.query("SELECT run_ref FROM results ORDER BY run_ref") == [
        {"run_ref": "run-1"},
        {"run_ref": "run-2"},
    ]


def test_ambiguous_missing_run_reference_is_rejected(ingestor: Ingestor) -> None:
    seed_dependencies(ingestor)

    assert_failure(ingestor, "result", result_record(run_ref=None), match="ambiguous")


def test_unambiguous_derived_run_reference(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    seed_dependencies(ingestor)
    record = result_record(run_ref=None)
    record["source_has_single_run"] = True

    ingestor.run("result", record, commit=True)

    run_ref = database.query("SELECT run_ref FROM results")[0]["run_ref"]
    assert run_ref == "source:https://example.com/results/run-1#2026-09-17"


def test_additional_source_attachment(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    seed_dependencies(ingestor)
    ingestor.run("result", result_record(), commit=True)
    enriched = result_record()
    enriched["sources"].append(
        {
            "url": "https://openai.com/results/run-1",
            "checked_at": CHECKED_AT,
            "primary": False,
            "same_run": True,
        }
    )

    outcome = ingestor.run("result", enriched, commit=True)

    assert outcome[0].status == "VALID"
    assert len(database.query("SELECT * FROM result_sources")) == 1


def test_evaluator_set_conflict_and_missing_set(ingestor: Ingestor) -> None:
    seed_dependencies(ingestor)
    ingestor.run("result", result_record(), commit=True)
    expanded = benchmark_record()
    expanded["evaluators"].append(evaluator_record("second-evaluator"))
    ingestor.run("benchmark", expanded, commit=True)

    changed = result_record()
    changed["evaluator_keys"] = ["second-evaluator"]
    assert_failure(
        ingestor, "result", changed, status="CONFLICT", match="different facts"
    )

    missing = result_record(run_ref="run-2")
    missing["evaluator_keys"] = []
    assert_failure(ingestor, "result", missing, match="at least one")


def test_multiple_primary_sources_are_rejected(ingestor: Ingestor) -> None:
    seed_dependencies(ingestor)
    record = result_record()
    record["sources"].append(
        {
            "url": "https://openai.com/results/run-1",
            "checked_at": CHECKED_AT,
            "primary": True,
        }
    )

    assert_failure(ingestor, "result", record, match="exactly one primary")


def test_malformed_registry_number_and_unauthorized_pairing(ingestor: Ingestor) -> None:
    ingestor.run("company", company_record(), commit=True)
    malformed = model_record(registry_no="1001")
    assert_failure(ingestor, "model", malformed, match="does not match")

    unauthorized = model_record()
    unauthorized["namespace_prefix"] = "15"
    unauthorized["registry_no"] = "15001"
    assert_failure(ingestor, "model", unauthorized, match="not authorized")


def test_late_historical_model_assignment(ingestor: Ingestor) -> None:
    ingestor.run("company", company_record(), commit=True)
    ingestor.run("model", model_record(), commit=True)
    late = model_record(
        sequence=2,
        registry_no="10002",
        name="Historical Model",
        release_at="2025-01-01",
    )
    assert_failure(ingestor, "model", late, match="late_backfill")

    late["sequence_exception_reason"] = "late_backfill"
    assert ingestor.run("model", late, commit=True)[0].status == "VALID"

    between = model_record(
        sequence=3,
        registry_no="10003",
        name="Middle Model",
        release_at="2025-06-01",
    )
    assert_failure(ingestor, "model", between, match="late_backfill")


def test_stealth_status_pairing_is_validated_during_dry_run(ingestor: Ingestor) -> None:
    ingestor.run("company", company_record(), commit=True)
    record = model_record()
    record["status"] = "stealth"

    with pytest.raises(IngestionFailure, match="namespace 00"):
        ingestor.run("model", record, commit=False)


def test_exhausted_namespace(ingestor: Ingestor, database_path: Path) -> None:
    ingestor.run("company", company_record(), commit=True)
    with sqlite3.connect(database_path) as connection:
        company_id = connection.execute(
            "SELECT id FROM companies WHERE slug = 'openai'"
        ).fetchone()[0]
        namespace_id = connection.execute(
            "SELECT id FROM namespaces WHERE prefix = '10'"
        ).fetchone()[0]
        connection.execute(
            """INSERT INTO models (
                canonical_name, normalized_name, company_id, namespace_id,
                sequence, registry_no, release_at, release_precision,
                release_source_url, release_source_normalized_url,
                source_checked_at, published_at, status
            ) VALUES ('Last', 'last', ?, ?, 999, '10999', '2026-01-01', 'date',
                      'https://example.com/last', 'https://example.com/last', ?, ?, 'active')""",
            (company_id, namespace_id, CHECKED_AT, CHECKED_AT),
        )

    assert_failure(
        ingestor,
        "model",
        model_record(sequence=1, registry_no="10001"),
        match="exhausted",
    )


def test_unknown_metric_and_metric_version_mismatch(ingestor: Ingestor) -> None:
    seed_dependencies(ingestor)
    unknown = result_record()
    unknown["metric_key"] = "unknown"
    assert_failure(ingestor, "result", unknown, match="unknown metric")

    expanded = benchmark_record()
    expanded["metrics"].append(metric_record(key="other"))
    ingestor.run("benchmark", expanded, commit=True)
    mismatch = result_record()
    mismatch["metric_key"] = "other"
    assert_failure(ingestor, "result", mismatch, match="mismatch")


@pytest.mark.parametrize(
    ("kind", "score", "expected"),
    [
        ("integer", "1.5", "fractional"),
        ("decimal", "101", "maximum"),
    ],
)
def test_numeric_metric_rejections(
    ingestor: Ingestor, kind: str, score: str, expected: str
) -> None:
    ingestor.run("company", company_record(), commit=True)
    benchmark = benchmark_record()
    benchmark["metrics"] = [metric_record(storage_kind=kind)]
    ingestor.run("benchmark", benchmark, commit=True)
    ingestor.run("model", model_record(), commit=True)

    assert_failure(ingestor, "result", result_record(score=score), match=expected)


def test_text_metric_rejects_numeric_score_value(ingestor: Ingestor) -> None:
    ingestor.run("company", company_record(), commit=True)
    benchmark = benchmark_record()
    benchmark["metrics"] = [
        metric_record(storage_kind="text", minimum=None, maximum=None)
    ]
    ingestor.run("benchmark", benchmark, commit=True)
    ingestor.run("model", model_record(), commit=True)

    assert_failure(ingestor, "result", result_record(score="pass"), match="null")


def test_missing_source_bad_date_and_unknown_version(ingestor: Ingestor) -> None:
    seed_dependencies(ingestor)
    missing_source = result_record()
    missing_source["sources"] = []
    assert_failure(ingestor, "result", missing_source, match="at least one")

    bad_date = result_record()
    bad_date["reported_at"] = "September 17"
    assert_failure(ingestor, "result", bad_date, match="ISO 8601")

    unknown_version = result_record()
    unknown_version["benchmark_version"] = "2.0"
    assert_failure(
        ingestor, "result", unknown_version, match="unknown benchmark version"
    )


def test_failed_local_batch_rolls_back_every_statement(database: LocalDatabase) -> None:
    statements = [
        Statement(
            """INSERT INTO companies (
                id, name, normalized_name, slug, source_url,
                normalized_source_url, source_checked_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                1,
                "One",
                "one",
                "one",
                "https://one.test",
                "https://one.test",
                CHECKED_AT,
            ),
        ),
        Statement(
            """INSERT INTO companies (
                id, name, normalized_name, slug, source_url,
                normalized_source_url, source_checked_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                2,
                "Two",
                "two",
                "one",
                "https://two.test",
                "https://two.test",
                CHECKED_AT,
            ),
        ),
    ]

    with pytest.raises(DatabaseFailure):
        database.execute_batch(statements)

    assert database.query("SELECT * FROM companies") == []


def test_remote_commits_remain_disabled_until_atomicity_is_verified(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "account")
    monkeypatch.setenv("CLOUDFLARE_D1_DATABASE_ID", "database")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "token")
    monkeypatch.delenv("REGISTRY_REMOTE_ATOMICITY_VERIFIED", raising=False)

    with pytest.raises(DatabaseFailure, match="atomicity probe"):
        database_from_environment("remote", commit=True)

    assert isinstance(
        database_from_environment("remote", commit=False), RemoteD1Database
    )


def test_invalid_multi_record_batch_writes_nothing(
    ingestor: Ingestor, database: LocalDatabase
) -> None:
    batch = {
        "records": [
            {"operation": "company", "record": company_record()},
            {"operation": "model", "record": model_record(registry_no="bad")},
        ]
    }

    assert_failure(ingestor, "batch", batch, match="does not match")
    assert database.query("SELECT * FROM companies") == []


def test_malformed_batch_shape_returns_an_error(ingestor: Ingestor) -> None:
    assert_failure(ingestor, "batch", {"records": "not-an-array"}, match="array")


@pytest.mark.remote
def test_disposable_remote_d1_batch_rolls_back_atomically() -> None:
    required = {
        "account": os.environ.get("CLOUDFLARE_ACCOUNT_ID"),
        "database": os.environ.get("REGISTRY_DISPOSABLE_D1_DATABASE_ID"),
        "token": os.environ.get("CLOUDFLARE_API_TOKEN"),
    }
    if not all(required.values()):
        pytest.skip("disposable remote D1 credentials are not configured")
    database = RemoteD1Database(
        required["account"] or "",
        required["database"] or "",
        required["token"] or "",
    )
    marker = f"atomicity-{uuid.uuid4().hex}"
    max_id = database.query("SELECT COALESCE(MAX(id), 0) AS value FROM companies")[0][
        "value"
    ]
    first_id = int(max_id) + 1
    statements = [
        Statement(
            """INSERT INTO companies (
                id, name, normalized_name, slug, source_url,
                normalized_source_url, source_checked_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                first_id,
                marker,
                marker,
                marker,
                f"https://example.com/{marker}",
                f"https://example.com/{marker}",
                CHECKED_AT,
            ),
        ),
        Statement(
            """INSERT INTO companies (
                id, name, normalized_name, slug, source_url,
                normalized_source_url, source_checked_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                first_id + 1,
                marker,
                marker,
                marker,
                f"https://example.com/{marker}",
                f"https://example.com/{marker}",
                CHECKED_AT,
            ),
        ),
    ]

    with pytest.raises(DatabaseFailure):
        database.execute_batch(statements)

    assert database.query("SELECT id FROM companies WHERE slug = ?", (marker,)) == []
