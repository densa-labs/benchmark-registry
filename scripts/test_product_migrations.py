import sqlite3
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ProductMigrationTests(unittest.TestCase):
    def test_nullable_provenance_up_down_and_records_unchanged(self):
        with sqlite3.connect(":memory:") as db:
            for migration in sorted((ROOT / "migrations").glob("*.sql")):
                db.executescript(migration.read_text())
            db.executescript(
                (ROOT / "app/worker/fixtures/p4-read-producer.sql").read_text()
            )
            before = db.execute(
                "SELECT result_key,score_value FROM results ORDER BY id"
            ).fetchall()
            self.assertEqual(
                db.execute(
                    "SELECT count(*) FROM results WHERE source_type IS NOT NULL"
                ).fetchone()[0],
                0,
            )
            db.executescript(
                (ROOT / "migrations/rollback/0009_result_provenance.sql").read_text()
            )
            db.executescript(
                (ROOT / "migrations/0009_result_provenance.sql").read_text()
            )
            self.assertEqual(
                before,
                db.execute(
                    "SELECT result_key,score_value FROM results ORDER BY id"
                ).fetchall(),
            )

