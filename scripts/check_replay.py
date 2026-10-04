#!/usr/bin/env python3
"""Replay the batch manifest twice into an empty SQLite database and compare
the result with production evidence.

Pass 1 must reproduce data/batches/expected-counts.json and the production
result_keys; pass 2 must report SKIPPED for every record and exit 0.
Local only: no network calls.
"""

from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "batches" / "manifest.json"
EXPECTED = ROOT / "data" / "batches" / "expected-counts.json"
COUNTS = {
    "models": "SELECT count(*) FROM models",
    "benchmarks": "SELECT count(*) FROM benchmarks",
    "versions": "SELECT count(*) FROM benchmark_versions",
    "results": "SELECT count(*) FROM results",
}


def evidence_result_keys(paths: list[str]) -> set[str]:
    """Result keys in the production snapshot plus the Argon additions."""
    keys: set[str] = set()
    for path in paths:
        snapshot = json.loads((ROOT / path).read_text())
        for table in ("results", "model_results"):
            keys.update(row["result_key"] for row in snapshot.get(table, []))
    return keys


def compare(actual: dict, expected: dict, keys: set[str], production: set[str]) -> list[str]:
    problems = [
        f"{name}: replay {actual[name]}, expected {value}"
        for name, value in expected.items()
        if actual.get(name) != value
    ]
    for label, difference in (
        ("only in replay", sorted(keys - production)),
        ("only in production", sorted(production - keys)),
    ):
        if difference:
            problems.append(f"result_keys {label}: {len(difference)} e.g. {difference[:3]}")
    return problems


def replay(database: Path) -> list[dict]:
    environment = {
        **os.environ,
        "REGISTRY_LOCAL_DB_PATH": str(database),
        "PYTHONPATH": str(ROOT / "ingestor" / "src"),
    }
    process = subprocess.run(
        [sys.executable, "-m", "benchmark_registry_ingestor", "replay", str(MANIFEST), "--commit"],
        capture_output=True, text=True, env=environment, check=False,
    )
    if process.returncode:
        raise SystemExit(f"replay exited {process.returncode}: {process.stderr.strip()}")
    return [json.loads(line) for line in process.stdout.splitlines()]


def main() -> int:
    expected = json.loads(EXPECTED.read_text())
    source = json.loads((ROOT / expected["source"]).read_text())["counts"]
    mismatch = {k: v for k, v in expected["counts"].items() if source.get(k) != v}
    if mismatch:
        print(f"expected-counts.json disagrees with {expected['source']}: {mismatch}")
        return 1
    with tempfile.TemporaryDirectory() as directory:
        database = Path(directory) / "registry.sqlite3"
        with sqlite3.connect(database) as connection:
            for migration in sorted((ROOT / "migrations").glob("*.sql")):
                connection.executescript(migration.read_text())
        first = replay(database)
        with sqlite3.connect(database) as connection:
            actual = {name: connection.execute(sql).fetchone()[0] for name, sql in COUNTS.items()}
            keys = {row[0] for row in connection.execute("SELECT result_key FROM results")}
        second = replay(database)
    problems = compare(actual, expected["counts"], keys, evidence_result_keys(expected["result_keys"]))
    statuses = Counter(row["status"] for row in second)
    if not second or set(statuses) != {"SKIPPED"}:
        problems.append(f"second pass was not all SKIPPED: {dict(statuses)}")
    print(json.dumps({
        "first_pass": dict(Counter(row["status"] for row in first)),
        "counts": actual,
        "second_pass": dict(statuses),
        "superseded": sum(row["message"].startswith("superseded") for row in second),
    }, sort_keys=True))
    for problem in problems:
        print(f"FAIL {problem}")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
