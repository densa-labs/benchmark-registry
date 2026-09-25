from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest


MIGRATIONS = Path(__file__).parents[2] / "migrations"


def test_provider_attestation_migration_upgrades_existing_companies() -> None:
    with sqlite3.connect(":memory:") as db:
        db.execute("PRAGMA foreign_keys = ON")
        for migration in sorted(MIGRATIONS.glob("*.sql")):
            if migration.name == "0004_provider_attestations.sql":
                break
            db.executescript(migration.read_text())
        db.execute(
            "INSERT INTO companies (id, name, normalized_name, slug, source_url, "
            "normalized_source_url, source_checked_at) VALUES "
            "(1, 'Parent', 'parent', 'parent', 'https://example.com/', "
            "'https://example.com/', '2026-09-25T00:00:00Z')"
        )
        db.executescript((MIGRATIONS / "0004_provider_attestations.sql").read_text())
        assert db.execute(
            "SELECT entity_kind, parent_company_id, established_basis, "
            "established_attestation_ref FROM companies WHERE id = 1"
        ).fetchone() == ("company", None, "source", None)
        assert db.execute("PRAGMA foreign_key_check").fetchall() == []

        with pytest.raises(sqlite3.IntegrityError):
            db.execute("UPDATE companies SET entity_kind = 'ai_unit' WHERE id = 1")
        with pytest.raises(sqlite3.IntegrityError):
            db.execute("UPDATE companies SET established_basis = 'user_attested' WHERE id = 1")
        db.executescript((MIGRATIONS / "0005_standalone_ai_units.sql").read_text())
        assert db.execute("SELECT provider_kind FROM companies WHERE id = 1").fetchone() == ("company",)
        columns = {row[1] for row in db.execute("PRAGMA table_info(companies)")}
        assert "parent_company_id" in columns
        with pytest.raises(sqlite3.IntegrityError):
            db.execute("UPDATE companies SET provider_kind = 'unknown' WHERE id = 1")


def test_provider_attestation_migration_applies_to_clean_database() -> None:
    with sqlite3.connect(":memory:") as db:
        db.execute("PRAGMA foreign_keys = ON")
        for migration in sorted(MIGRATIONS.glob("*.sql")):
            db.executescript(migration.read_text())
        assert db.execute("PRAGMA foreign_key_check").fetchall() == []
