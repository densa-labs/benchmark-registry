#!/usr/bin/env python3
"""Build the FrontierSWE (Proximal) batch from board.json.

board.json holds the V2 leaderboard entries embedded in https://www.frontierswe.com/
(fetched 2026-10-07; the Wayback snapshot in archive.txt shows the same scores):
the "mean@5" view, which is the board's default score and the value the
Registry already uses (Gemini 4 Argon 55.0 = 54.96 rounded). Proximal runs every
model in its own harness ("proximus"), 5 trials per task.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:20:00Z"
REPORTED = "2026-10-07"
VERSION = "2 — October 2026 evaluation"
MODELS = {
    "GPT-6 Astra": "10005", "Claude Opus 5.5": "20015", "Claude Sonnet 5.5": "20016",
    "Claude Fable 5.1": "20004", "Gemini 4 Argon": "30011", "Claude Opus 5": "20014",
    "Claude Fable 5": "20012", "GPT-5.6 Sol": "10010", "GLM-5.3": "150005", "Grok 4.7": "40003",
    "Kimi K3": "120003", "Grok 4.6": "40002", "Gemini 3.7 Flash": "30010", "Gemini 3.8 Flash": "30004",
    "GLM-5.3 Flash": "150006", "Qwen3.8-Max": "130008", "Muse Spark 1.2": "80003", "Inkling": "160001",
}


def coarse_equal(a, b):
    places = min(-Decimal(a).as_tuple().exponent, -Decimal(b).as_tuple().exponent)
    step = Decimal(1).scaleb(-places)
    return Decimal(a).quantize(step) == Decimal(b).quantize(step)


def main(database):
    db = sqlite3.connect(database)
    family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = 'frontierswe'").fetchone()))
    held = db.execute(
        """SELECT m.registry_no, r.score_value FROM results r JOIN models m ON m.id = r.model_id
           JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
           WHERE b.slug = 'frontierswe' AND r.retracted_at IS NULL""").fetchall()
    board = json.loads((HERE / "board.json").read_text())
    results, mapping = [], []
    for entry in board["mean"]:
        registry_no = MODELS.get(entry["model"])
        score = str(entry["overall"])
        row = {"model": entry["model"], "harness": entry["harness"], "mean_at_5": score, "registry_no": registry_no}
        mapping.append(row)
        if not registry_no:
            row["status"] = "held: model not in Registry or dated/experimental build"
            continue
        if any(no == registry_no and coarse_equal(value, score) for no, value in held):
            row["status"] = "skipped: the Registry already holds this run from a developer report"
            continue
        row["status"] = "included"
        results.append({"operation": "result", "record": {
            "model_registry_no": registry_no, "reasoning_level": "", "benchmark_slug": "frontierswe",
            "benchmark_version": VERSION, "metric_key": "frontierswe-score", "source_has_single_run": True,
            "score_value": score, "score_raw": score, "reported_at": REPORTED, "reported_precision": "date",
            "evaluator_keys": ["proximal"], "source_type": "Benchmark leaderboard", "publisher": "Proximal",
            "reporting_basis": "independent", "source_archive_url": (HERE / "archive.txt").read_text().strip(),
            "sources": [{"url": board["url"], "checked_at": CHECKED, "primary": True}],
        }})
    records = [
        {"operation": "benchmark", "record": {
            "slug": "frontierswe", **family, "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{"version": VERSION, "version_slug": "2-october-2026", "release_at": REPORTED,
                          "release_precision": "date", "metric_key": "frontierswe-score",
                          "source_url": board["url"], "source_checked_at": CHECKED, "evaluator_keys": ["proximal"]}],
        }},
        {"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "frontierswe", "version": VERSION, "version_slug": "2-october-2026",
            "dataset_label": "2", "configuration": {"key": "proximus-harness", "label": "Proximus harness, 5 trials, 20-hour budget", "kind": "harness"},
            "source_url": board["url"], "source_checked_at": CHECKED,
        }},
        *results,
    ]
    out = ROOT / "data" / "batches" / "evaluator-frontierswe-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
