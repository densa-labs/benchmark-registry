import json
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

    def test_metric_direction_up_down_without_backfill(self):
        with sqlite3.connect(":memory:") as db:
            for migration in sorted((ROOT / "migrations").glob("*.sql")):
                db.executescript(migration.read_text())
            db.executescript(
                (ROOT / "app/worker/fixtures/p4-read-producer.sql").read_text()
            )
            self.assertEqual(
                db.execute(
                    "SELECT count(*) FROM metrics WHERE direction IS NOT NULL"
                ).fetchone()[0],
                0,
            )
            db.executescript(
                (ROOT / "migrations/rollback/0011_metric_direction.sql").read_text()
            )
            db.executescript(
                (ROOT / "migrations/0011_metric_direction.sql").read_text()
            )

    def test_registry_numbers_are_immutable_up_down_up(self):
        with sqlite3.connect(":memory:") as db:
            for migration in sorted((ROOT / "migrations").glob("*.sql")):
                db.executescript(migration.read_text())
            db.executescript(
                (ROOT / "app/worker/fixtures/p4-read-producer.sql").read_text()
            )
            model = db.execute(
                "SELECT id, registry_no, sequence FROM models ORDER BY id LIMIT 1"
            ).fetchone()
            renumber = (
                "UPDATE models SET sequence = sequence + 900, "
                "registry_no = substr(registry_no, 1, length(registry_no) - 3) "
                "|| printf('%03d', sequence + 900) WHERE id = ?"
            )
            for statement in (renumber, "DELETE FROM models WHERE id = ?"):
                with self.assertRaises(sqlite3.IntegrityError):
                    db.execute(statement, (model[0],))
            # Unrelated model facts and provider corrections still update.
            db.execute(
                "UPDATE models SET company_id = company_id, status = status WHERE id = ?",
                (model[0],),
            )
            db.executescript(
                (
                    ROOT / "migrations/rollback/0012_registry_number_immutability.sql"
                ).read_text()
            )
            db.execute("SAVEPOINT renumber")
            db.execute(renumber, (model[0],))
            db.execute("ROLLBACK TO renumber")
            db.executescript(
                (ROOT / "migrations/0012_registry_number_immutability.sql").read_text()
            )
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute(renumber, (model[0],))
            self.assertEqual(
                db.execute(
                    "SELECT id, registry_no, sequence FROM models WHERE id = ?",
                    (model[0],),
                ).fetchone(),
                model,
            )

    def test_effort_vocabulary_matches_mapping_and_rolls_back(self):
        mapping = json.loads((ROOT / "data/reasoning-labels.json").read_text())
        with sqlite3.connect(":memory:") as db:
            for migration in sorted((ROOT / "migrations").glob("*.sql")):
                db.executescript(migration.read_text())
            self.assertEqual(
                [row[0] for row in db.execute("SELECT key FROM effort_levels ORDER BY rank")],
                mapping["vocabulary"],
            )
            self.assertEqual(
                db.execute(
                    "SELECT label, effort, status, note FROM reasoning_labels ORDER BY label"
                ).fetchall(),
                sorted(
                    (row["label"], row["effort"], row["status"], row["note"])
                    for row in mapping["labels"]
                ),
            )
            for row in mapping["labels"]:
                self.assertIn(row["effort"], [None, *mapping["vocabulary"]])
            db.executescript(
                (ROOT / "app/worker/fixtures/p4-read-producer.sql").read_text()
            )
            before = db.execute("SELECT result_key, reasoning_level FROM results ORDER BY id").fetchall()
            db.executescript((ROOT / "migrations/rollback/0013_effort_vocabulary.sql").read_text())
            db.executescript((ROOT / "migrations/0013_effort_vocabulary.sql").read_text())
            self.assertEqual(
                before,
                db.execute("SELECT result_key, reasoning_level FROM results ORDER BY id").fetchall(),
            )
