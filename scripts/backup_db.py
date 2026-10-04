#!/usr/bin/env python3
"""Manually dump an explicit local SQLite database; never discovers a DB path."""

import argparse
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def backup(database, output):
    database = Path(database).resolve()
    if not database.is_file():
        raise ValueError("Pass an existing database file.")
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    target = (
        output
        / f"registry-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')}.sql"
    )
    try:
        with sqlite3.connect(database.as_uri() + "?mode=ro", uri=True) as db:
            db.execute("BEGIN")  # All dump reads see one consistent snapshot.
            with target.open("x", encoding="utf-8") as file:
                for line in db.iterdump():
                    file.write(line + "\n")
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return target


def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        epilog="Manual run: python3 scripts/backup_db.py --db /absolute/registry.sqlite3 --output /absolute/backups",
    )
    parser.add_argument("--db", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        print(backup(args.db, args.output))
    except (ValueError, sqlite3.Error, OSError) as error:
        parser.exit(1, f"Backup failed: {error}\n")


if __name__ == "__main__":
    main()
