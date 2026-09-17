import sqlite3
from pathlib import Path

MIGRATIONS = Path(__file__).parents[2] / "migrations"
INITIAL_MIGRATION = MIGRATIONS / "0001_initial.sql"
NAMESPACE_SEED_MIGRATION = MIGRATIONS / "0002_seed_namespaces.sql"

EXPECTED_NAMESPACES = [
    ("00", "Stealth models", None),
    ("10", "OpenAI", None),
    ("15", "OpenAI OSS", None),
    ("20", "Anthropic", None),
    ("30", "Google", None),
    ("35", "Google Gemma", None),
    ("40", "SpaceXAI", None),
    ("50", "Cursor", None),
    ("60", "NVIDIA", None),
    ("70", "Microsoft", None),
    ("80", "Meta", None),
    ("90", "Mistral", None),
    ("110", "DeepSeek", None),
    ("120", "Moonshot AI", None),
    ("130", "Alibaba", None),
    ("140", "MiniMax", None),
    ("150", "Z.ai", None),
    ("160", "Thinking Machines", None),
    ("170", "SSI", None),
]


def apply_migration(db: sqlite3.Connection, migration: Path) -> None:
    db.executescript(migration.read_text())


def namespace_rows(db: sqlite3.Connection) -> list[tuple[str, str, int | None]]:
    return db.execute(
        """
        SELECT prefix, name, parent_namespace_id
        FROM namespaces
        ORDER BY id
        """
    ).fetchall()


def test_seed_migration_applies_to_the_previous_schema() -> None:
    with sqlite3.connect(":memory:") as db:
        db.execute("PRAGMA foreign_keys = ON")
        apply_migration(db, INITIAL_MIGRATION)

        assert namespace_rows(db) == []

        apply_migration(db, NAMESPACE_SEED_MIGRATION)

        assert namespace_rows(db) == EXPECTED_NAMESPACES
        assert db.execute(
            "SELECT COUNT(*) FROM namespaces WHERE prefix = '100'"
        ).fetchone() == (0,)


def test_clean_database_can_be_recreated_with_the_namespace_seed() -> None:
    recreated_rows = []

    for _ in range(2):
        with sqlite3.connect(":memory:") as db:
            db.execute("PRAGMA foreign_keys = ON")
            for migration in sorted(MIGRATIONS.glob("*.sql")):
                apply_migration(db, migration)
            recreated_rows.append(namespace_rows(db))

    assert recreated_rows == [EXPECTED_NAMESPACES, EXPECTED_NAMESPACES]
