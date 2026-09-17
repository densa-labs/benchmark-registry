import sqlite3
from collections.abc import Iterator
from pathlib import Path

import pytest

MIGRATION = Path(__file__).parents[2] / "migrations" / "0001_initial.sql"
SOURCE_CHECKED_AT = "2026-09-17T00:00:00Z"


@pytest.fixture
def db() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(":memory:")
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(MIGRATION.read_text())
    try:
        yield connection
    finally:
        connection.close()


def add_company(db: sqlite3.Connection, company_id: int, slug: str) -> None:
    db.execute(
        """
        INSERT INTO companies (
            id, name, normalized_name, slug, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            company_id,
            slug.title(),
            slug,
            slug,
            f"https://example.com/{slug}",
            f"https://example.com/{slug}",
            SOURCE_CHECKED_AT,
        ),
    )


def add_namespace(db: sqlite3.Connection, namespace_id: int, prefix: str) -> None:
    db.execute(
        "INSERT INTO namespaces (id, name, prefix) VALUES (?, ?, ?)",
        (namespace_id, f"Namespace {prefix}", prefix),
    )


def authorize(db: sqlite3.Connection, namespace_id: int, company_id: int) -> None:
    db.execute(
        """
        INSERT INTO namespace_companies (
            namespace_id, company_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (?, ?, ?, ?, ?)
        """,
        (
            namespace_id,
            company_id,
            "https://example.com/authorization",
            "https://example.com/authorization",
            SOURCE_CHECKED_AT,
        ),
    )


def add_model(
    db: sqlite3.Connection,
    model_id: int,
    *,
    company_id: int = 1,
    namespace_id: int = 1,
    sequence: int = 1,
    registry_no: str = "10001",
    name: str | None = None,
    status: str = "active",
) -> None:
    canonical_name = name or f"Model {model_id}"
    db.execute(
        """
        INSERT INTO models (
            id, canonical_name, normalized_name, company_id, namespace_id,
            sequence, registry_no, release_at, release_precision,
            release_source_url, release_source_normalized_url,
            source_checked_at, published_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            model_id,
            canonical_name,
            canonical_name.casefold(),
            company_id,
            namespace_id,
            sequence,
            registry_no,
            "2026-09-17",
            "date",
            "https://example.com/model",
            "https://example.com/model",
            SOURCE_CHECKED_AT,
            SOURCE_CHECKED_AT,
            status,
        ),
    )


def add_benchmark_data(db: sqlite3.Connection) -> None:
    db.execute(
        """
        INSERT INTO benchmarks (
            id, canonical_name, normalized_name, slug, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (1, 'Example Bench', 'example bench', 'example-bench',
                  'https://example.com/bench', 'https://example.com/bench', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    db.execute(
        """
        INSERT INTO metrics (
            id, name, key, storage_kind, unit, display_precision,
            source_url, normalized_source_url, source_checked_at
        ) VALUES (1, 'Accuracy', 'accuracy', 'decimal', 'percent', 2,
                  'https://example.com/metric', 'https://example.com/metric', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    db.execute(
        """
        INSERT INTO benchmark_versions (
            id, benchmark_id, version, version_slug, release_at,
            release_precision, metric_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (1, 1, '1.0', '1.0', '2026-09-17', 'date', 1,
                  'https://example.com/version', 'https://example.com/version', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )


def add_result(
    db: sqlite3.Connection,
    result_id: int,
    *,
    metric_id: int = 1,
    run_ref: str = "run-1",
    result_key: str = "result-key-1",
    primary_source_url: str | None = "https://example.com/result",
) -> None:
    db.execute(
        """
        INSERT INTO results (
            id, model_id, reasoning_level, benchmark_version_id, metric_id,
            run_ref, result_key, score_value, score_raw, reported_at,
            reported_precision, evaluator_set_key, primary_source_url,
            primary_source_normalized_url, primary_source_checked_at
        ) VALUES (?, 1, '', 1, ?, ?, ?, '91.2', '91.20%', '2026-09-17',
                  'date', 'evaluator-set-key', ?, ?, ?)
        """,
        (
            result_id,
            metric_id,
            run_ref,
            result_key,
            primary_source_url,
            primary_source_url,
            SOURCE_CHECKED_AT,
        ),
    )


def add_base_registry(db: sqlite3.Connection) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")
    authorize(db, 1, 1)
    add_model(db, 1)
    add_benchmark_data(db)


def assert_rejected(db: sqlite3.Connection, sql: str, params: tuple = ()) -> None:
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(sql, params)


def test_migration_recreates_the_database_from_zero() -> None:
    schemas = []
    for _ in range(2):
        connection = sqlite3.connect(":memory:")
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(MIGRATION.read_text())
        schemas.append(
            connection.execute(
                """
                SELECT type, name, sql
                FROM sqlite_schema
                WHERE name NOT LIKE 'sqlite_%'
                ORDER BY type, name
                """
            ).fetchall()
        )
        connection.close()

    assert schemas[0] == schemas[1]
    assert len([row for row in schemas[0] if row[0] == "table"]) == 15


def test_valid_rows_and_join_foreign_keys_succeed(db: sqlite3.Connection) -> None:
    add_base_registry(db)
    db.execute(
        """
        INSERT INTO evaluator_organizations (
            id, name, normalized_name, key, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (1, 'Evaluator', 'evaluator', 'evaluator',
                  'https://example.com/evaluator',
                  'https://example.com/evaluator', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    db.execute("INSERT INTO benchmark_version_evaluators VALUES (1, 1)")
    add_result(db, 1)
    db.execute("INSERT INTO result_evaluators VALUES (1, 1)")
    db.execute(
        """
        INSERT INTO result_sources (
            id, result_id, source_url, normalized_source_url, source_checked_at
        ) VALUES (1, 1, 'https://example.com/citation',
                  'https://example.com/citation', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    add_namespace(db, 2, "00")
    authorize(db, 2, 1)
    add_model(
        db,
        2,
        namespace_id=2,
        registry_no="00001",
        status="stealth",
    )
    db.execute(
        """
        INSERT INTO registry_redirects (
            source_model_id, target_model_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (2, 1, 'https://example.com/redirect',
                  'https://example.com/redirect', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    assert db.execute("SELECT COUNT(*) FROM results").fetchone() == (1,)


def test_registry_number_constraints(db: sqlite3.Connection) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")
    authorize(db, 1, 1)
    add_model(db, 1)

    with pytest.raises(sqlite3.IntegrityError):
        add_model(db, 2, sequence=2, registry_no="10001")
    with pytest.raises(sqlite3.IntegrityError, match="does not match"):
        add_model(db, 3, sequence=3, registry_no="10004")
    with pytest.raises(sqlite3.IntegrityError, match="CHECK"):
        add_model(db, 4, sequence=0, registry_no="10000")


def test_unique_company_slug_and_benchmark_versions(db: sqlite3.Connection) -> None:
    add_company(db, 1, "example")
    with pytest.raises(sqlite3.IntegrityError, match="UNIQUE"):
        add_company(db, 2, "example")

    add_benchmark_data(db)
    duplicate_version = """
        INSERT INTO benchmark_versions (
            id, benchmark_id, version, version_slug, release_at,
            release_precision, metric_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (?, 1, ?, ?, '2026-09-17', 'date', 1,
                  'https://example.com/version-2',
                  'https://example.com/version-2', ?)
    """
    assert_rejected(db, duplicate_version, (2, "2.0", "1.0", SOURCE_CHECKED_AT))
    assert_rejected(db, duplicate_version, (3, "1.0", "2.0", SOURCE_CHECKED_AT))


def test_model_alias_uniqueness_and_canonical_collisions(
    db: sqlite3.Connection,
) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")
    authorize(db, 1, 1)
    add_model(db, 1, name="First")
    add_model(db, 2, sequence=2, registry_no="10002", name="Second")
    db.execute(
        """
        INSERT INTO model_aliases (
            id, model_id, name, normalized_name, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (1, 1, 'Shared Alias', 'shared alias',
                  'https://example.com/alias', 'https://example.com/alias', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    assert_rejected(
        db,
        """
        INSERT INTO model_aliases (
            id, model_id, name, normalized_name, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (2, 2, 'SHARED ALIAS', 'shared alias',
                  'https://example.com/alias-2',
                  'https://example.com/alias-2', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    with pytest.raises(sqlite3.IntegrityError, match="collides"):
        add_model(
            db,
            3,
            sequence=3,
            registry_no="10003",
            name="shared alias",
        )


def test_benchmark_alias_uniqueness_and_canonical_collisions(
    db: sqlite3.Connection,
) -> None:
    add_benchmark_data(db)
    db.execute(
        """
        INSERT INTO benchmarks (
            id, canonical_name, normalized_name, slug, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (2, 'Second Bench', 'second bench', 'second-bench',
                  'https://example.com/second', 'https://example.com/second', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    db.execute(
        """
        INSERT INTO benchmark_aliases (
            id, benchmark_id, name, normalized_name, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (1, 1, 'Shared Bench', 'shared bench',
                  'https://example.com/alias', 'https://example.com/alias', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    assert_rejected(
        db,
        """
        INSERT INTO benchmark_aliases (
            id, benchmark_id, name, normalized_name, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (2, 2, 'SHARED BENCH', 'shared bench',
                  'https://example.com/alias-2',
                  'https://example.com/alias-2', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    assert_rejected(
        db,
        "UPDATE benchmarks SET normalized_name = 'shared bench' WHERE id = 2",
    )


def test_invalid_foreign_keys_and_unauthorized_models_fail(
    db: sqlite3.Connection,
) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")

    assert_rejected(
        db,
        """
        INSERT INTO namespace_companies (
            namespace_id, company_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (99, 1, 'https://example.com/auth',
                  'https://example.com/auth', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    with pytest.raises(sqlite3.IntegrityError, match="FOREIGN KEY"):
        add_model(db, 1)


def test_result_metric_must_match_benchmark_version(
    db: sqlite3.Connection,
) -> None:
    add_base_registry(db)
    db.execute(
        """
        INSERT INTO metrics (
            id, name, key, storage_kind, unit, display_precision,
            source_url, normalized_source_url, source_checked_at
        ) VALUES (2, 'Points', 'points', 'integer', 'points', 0,
                  'https://example.com/points', 'https://example.com/points', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    with pytest.raises(sqlite3.IntegrityError, match="FOREIGN KEY"):
        add_result(db, 1, metric_id=2)


def test_results_require_primary_source_and_unique_logical_identity(
    db: sqlite3.Connection,
) -> None:
    add_base_registry(db)
    with pytest.raises(sqlite3.IntegrityError, match="NOT NULL"):
        add_result(db, 1, primary_source_url=None)

    add_result(db, 1)
    with pytest.raises(sqlite3.IntegrityError, match="UNIQUE"):
        add_result(db, 2, result_key="different-key")
    with pytest.raises(sqlite3.IntegrityError, match="UNIQUE"):
        add_result(db, 3, run_ref="run-2", result_key="result-key-1")


def test_additional_source_must_differ_from_primary(
    db: sqlite3.Connection,
) -> None:
    add_base_registry(db)
    add_result(db, 1)

    assert_rejected(
        db,
        """
        INSERT INTO result_sources (
            id, result_id, source_url, normalized_source_url, source_checked_at
        ) VALUES (1, 1, 'https://EXAMPLE.com:443/result#fragment',
                  'https://example.com/result', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    db.execute(
        """
        INSERT INTO result_sources (
            id, result_id, source_url, normalized_source_url, source_checked_at
        ) VALUES (2, 1, 'https://example.com/citation',
                  'https://example.com/citation', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )
    assert_rejected(
        db,
        """
        UPDATE results
        SET primary_source_url = 'https://example.com/citation'
        WHERE id = 1
        """,
    )


def test_evaluator_joins_require_valid_parents(db: sqlite3.Connection) -> None:
    add_base_registry(db)
    add_result(db, 1)

    assert_rejected(db, "INSERT INTO benchmark_version_evaluators VALUES (1, 99)")
    assert_rejected(db, "INSERT INTO result_evaluators VALUES (99, 99)")


def test_stealth_namespace_and_status_must_agree(db: sqlite3.Connection) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")
    add_namespace(db, 2, "00")
    authorize(db, 1, 1)
    authorize(db, 2, 1)

    with pytest.raises(sqlite3.IntegrityError, match="stealth status"):
        add_model(db, 1, status="stealth")
    with pytest.raises(sqlite3.IntegrityError, match="stealth status"):
        add_model(db, 2, namespace_id=2, registry_no="00001")


def test_redirect_roles_chains_and_cycles_fail(db: sqlite3.Connection) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")
    add_namespace(db, 2, "00")
    authorize(db, 1, 1)
    authorize(db, 2, 1)
    add_model(db, 1)
    add_model(db, 2, sequence=2, registry_no="10002")
    add_model(
        db,
        3,
        namespace_id=2,
        sequence=1,
        registry_no="00001",
        status="stealth",
    )
    add_model(
        db,
        4,
        namespace_id=2,
        sequence=2,
        registry_no="00002",
        status="stealth",
    )

    redirect_sql = """
        INSERT INTO registry_redirects (
            source_model_id, target_model_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (?, ?, 'https://example.com/redirect',
                  'https://example.com/redirect', ?)
    """
    assert_rejected(db, redirect_sql, (1, 2, SOURCE_CHECKED_AT))
    db.execute(redirect_sql, (3, 1, SOURCE_CHECKED_AT))
    assert_rejected(db, redirect_sql, (1, 2, SOURCE_CHECKED_AT))
    assert_rejected(db, redirect_sql, (4, 3, SOURCE_CHECKED_AT))


def test_redirect_endpoint_roles_cannot_be_changed(
    db: sqlite3.Connection,
) -> None:
    add_company(db, 1, "example")
    add_namespace(db, 1, "10")
    add_namespace(db, 2, "00")
    authorize(db, 1, 1)
    authorize(db, 2, 1)
    add_model(db, 1)
    add_model(
        db,
        2,
        namespace_id=2,
        registry_no="00001",
        status="stealth",
    )
    db.execute(
        """
        INSERT INTO registry_redirects (
            source_model_id, target_model_id, source_url,
            normalized_source_url, source_checked_at
        ) VALUES (2, 1, 'https://example.com/redirect',
                  'https://example.com/redirect', ?)
        """,
        (SOURCE_CHECKED_AT,),
    )

    assert_rejected(db, "UPDATE namespaces SET prefix = '11' WHERE id = 1")
    assert_rejected(db, "UPDATE namespaces SET prefix = '01' WHERE id = 2")
