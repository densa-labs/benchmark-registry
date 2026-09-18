import sqlite3
from pathlib import Path

ROOT = Path(__file__).parents[2]
INITIAL_MIGRATION = ROOT / "migrations" / "0001_initial.sql"
NAMESPACE_MIGRATION = ROOT / "migrations" / "0002_seed_namespaces.sql"
SEARCH_MIGRATION = ROOT / "migrations" / "0003_search_indexes.sql"


def apply_previous_schema(db: sqlite3.Connection) -> None:
    db.executescript(INITIAL_MIGRATION.read_text())
    db.executescript(NAMESPACE_MIGRATION.read_text())


def query_plan(db: sqlite3.Connection, sql: str, value: str) -> str:
    return "\n".join(
        row[3] for row in db.execute(f"EXPLAIN QUERY PLAN {sql}", (value,))
    )


def test_search_index_migration_applies_to_previous_schema() -> None:
    with sqlite3.connect(":memory:") as db:
        apply_previous_schema(db)
        db.executescript(SEARCH_MIGRATION.read_text())

        indexes = {
            row[0]
            for row in db.execute(
                "SELECT name FROM sqlite_schema WHERE type = 'index'"
            )
        }

    assert "idx_benchmarks_normalized_name" in indexes
    assert "idx_companies_normalized_name" in indexes


def test_clean_schema_uses_search_indexes_for_exact_name_lookups() -> None:
    with sqlite3.connect(":memory:") as db:
        apply_previous_schema(db)
        db.executescript(SEARCH_MIGRATION.read_text())

        benchmark_plan = query_plan(
            db,
            "SELECT id FROM benchmarks WHERE normalized_name = ?",
            "hle",
        )
        company_plan = query_plan(
            db,
            "SELECT id FROM companies WHERE normalized_name = ?",
            "openai",
        )

    assert "USING COVERING INDEX idx_benchmarks_normalized_name" in benchmark_plan
    assert "USING COVERING INDEX idx_companies_normalized_name" in company_plan
