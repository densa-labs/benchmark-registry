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

    def test_indexes_up_down_and_query_plans(self):
        with sqlite3.connect(":memory:") as db:
            for migration in sorted((ROOT / "migrations").glob("*.sql")):
                db.executescript(migration.read_text())
            queries = [
                (
                    "SELECT registry_no FROM models WHERE company_id=1 ORDER BY substr(release_at,1,10) DESC, normalized_name,registry_no LIMIT 25",
                    "idx_models_provider_recent",
                ),
                (
                    "SELECT result_key,model_id FROM results WHERE benchmark_version_id=1 ORDER BY reported_at DESC,result_key LIMIT 50",
                    "idx_results_version_recent",
                ),
                (
                    "SELECT id FROM results ORDER BY primary_source_checked_at DESC,id DESC LIMIT 50",
                    "idx_results_checked_recent",
                ),
            ]
            for query, index in queries:
                plan = str(db.execute("EXPLAIN QUERY PLAN " + query).fetchall())
                self.assertIn(index, plan)
            db.executescript(
                (ROOT / "migrations/rollback/0010_product_read_indexes.sql").read_text()
            )
            db.executescript(
                (ROOT / "migrations/0010_product_read_indexes.sql").read_text()
            )

