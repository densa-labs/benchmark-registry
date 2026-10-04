import sqlite3
import tempfile
import unittest
from pathlib import Path
from backup_db import backup


class BackupTests(unittest.TestCase):
    def test_dump_restores_exact_values_without_mutating_original(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "registry.sqlite3"
            with sqlite3.connect(source) as database:
                database.execute("CREATE TABLE results (id INTEGER,score TEXT)")
                database.execute("INSERT INTO results VALUES (1,'52.500')")
            dump = backup(source, Path(temporary) / "backups")
            self.assertRegex(dump.name, r"^registry-[0-9]{8}T[0-9]{12}Z\.sql$")
            with sqlite3.connect(":memory:") as restored:
                restored.executescript(dump.read_text())
                self.assertEqual(
                    restored.execute("SELECT * FROM results").fetchall(),
                    [(1, "52.500")],
                )
            with sqlite3.connect(source) as original:
                self.assertEqual(
                    original.execute("SELECT * FROM results").fetchall(),
                    [(1, "52.500")],
                )

    def test_requires_explicit_existing_database(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaises(ValueError):
                backup(Path(temporary) / "missing", temporary)
