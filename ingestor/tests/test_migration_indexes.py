import sqlite3
from collections.abc import Iterator
from pathlib import Path

import pytest

MIGRATION = Path(__file__).parents[2] / "migrations" / "0001_initial.sql"

EXPECTED_EXPLICIT_INDEXES = {
    "idx_models_normalized_name": ("models", ("normalized_name",)),
    "idx_models_published_at": ("models", ("published_at",)),
    "idx_models_release_at": ("models", ("release_at",)),
    "idx_results_benchmark_version_id": (
        "results",
        ("benchmark_version_id",),
    ),
    "idx_results_model_benchmark_version": (
        "results",
        ("model_id", "benchmark_version_id"),
    ),
    "idx_results_reported_at": ("results", ("reported_at",)),
}


@pytest.fixture
def db() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(":memory:")
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(MIGRATION.read_text())
    try:
        yield connection
    finally:
        connection.close()


def explicit_indexes(
    db: sqlite3.Connection,
) -> dict[str, tuple[str, tuple[str, ...]]]:
    rows = db.execute(
        """
        SELECT name, tbl_name
        FROM sqlite_schema
        WHERE type = 'index'
          AND name NOT LIKE 'sqlite_autoindex_%'
        ORDER BY name
        """
    ).fetchall()

    return {
        name: (
            table,
            tuple(
                row[2] for row in db.execute(f'PRAGMA index_info("{name}")').fetchall()
            ),
        )
        for name, table in rows
    }


def query_plan(db: sqlite3.Connection, sql: str, params: tuple = ()) -> str:
    return "\n".join(
        row[3] for row in db.execute(f"EXPLAIN QUERY PLAN {sql}", params).fetchall()
    )


def test_migration_creates_only_the_non_redundant_explicit_indexes(
    db: sqlite3.Connection,
) -> None:
    assert explicit_indexes(db) == EXPECTED_EXPLICIT_INDEXES


@pytest.mark.parametrize(
    ("index_name", "query", "params"),
    [
        (
            "idx_models_normalized_name",
            "SELECT id FROM models WHERE normalized_name = ?",
            ("example model",),
        ),
        (
            "idx_models_release_at",
            "SELECT id FROM models ORDER BY release_at DESC LIMIT 10",
            (),
        ),
        (
            "idx_models_published_at",
            "SELECT id FROM models ORDER BY published_at DESC LIMIT 10",
            (),
        ),
        (
            "idx_results_benchmark_version_id",
            "SELECT id FROM results WHERE benchmark_version_id = ?",
            (1,),
        ),
        (
            "idx_results_reported_at",
            "SELECT id FROM results ORDER BY reported_at DESC LIMIT 50",
            (),
        ),
        (
            "idx_results_model_benchmark_version",
            """
            SELECT id
            FROM results
            WHERE model_id = ? AND benchmark_version_id = ?
            """,
            (1, 1),
        ),
    ],
)
def test_query_patterns_use_their_supporting_indexes(
    db: sqlite3.Connection,
    index_name: str,
    query: str,
    params: tuple,
) -> None:
    assert f"USING COVERING INDEX {index_name}" in query_plan(db, query, params)


@pytest.mark.parametrize(
    ("query", "params", "index_name"),
    [
        (
            "SELECT id FROM models WHERE namespace_id = ?",
            (1,),
            "sqlite_autoindex_models_2",
        ),
        (
            "SELECT id FROM model_aliases WHERE normalized_name = ?",
            ("alias",),
            "sqlite_autoindex_model_aliases_1",
        ),
        (
            "SELECT id FROM benchmark_aliases WHERE normalized_name = ?",
            ("alias",),
            "sqlite_autoindex_benchmark_aliases_1",
        ),
        (
            "SELECT id FROM results WHERE model_id = ?",
            (1,),
            "idx_results_model_benchmark_version",
        ),
    ],
)
def test_existing_indexes_cover_redundant_single_column_indexes(
    db: sqlite3.Connection,
    query: str,
    params: tuple,
    index_name: str,
) -> None:
    plan = query_plan(db, query, params)

    assert f"USING COVERING INDEX {index_name}" in plan
