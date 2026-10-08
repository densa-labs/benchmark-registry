#!/usr/bin/env python3
"""Build the OSWorld-Verified maintainer batch.

osworld_verified_results.xlsx is the data file behind the "OSWorld-Verified
Results" table on https://os-world.github.io/, which the page describes as
"official results evaluated by our team under unified settings". The Wayback
copy in archive.txt is byte-identical. Only single general models without the
a11y tree, extra coding actions or multiple rollouts are used.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from xlsx import read

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T13:43:00Z"
PAGE = "https://os-world.github.io/"
EVALUATOR = "xlang-lab"

MODELS = {
    "o3": "10003",
    "claude-3-7-sonnet-20250219": "20001",
    "claude-4-sonnet-20250514": "20003",
    "claude-sonnet-4-5-20250929": "20005",
    "Kimi K2.5": "120001",
    "claude-sonnet-4-6": "20009",
    "Kimi K2.6": "120002",
    "Qwen 3.7 Plus": "130007",
    "MiniMax M3": "140003",
    "Muse Spark 1.1": "80002",
}
STEPS = ("15", "50", "100")


def same_run(score, held):
    """True when a held developer score is this score at the developer's precision."""
    for other in held:
        places = -Decimal(other).as_tuple().exponent
        if Decimal(score).quantize(Decimal(1).scaleb(-places)) == Decimal(other):
            return True
    return False


def main(database):
    db = sqlite3.connect(database)
    family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = 'osworld'").fetchone()))
    held = {}
    for no, score in db.execute(
            """SELECT m.registry_no, r.score_value FROM results r JOIN models m ON m.id = r.model_id
            JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
            WHERE b.slug = 'osworld' AND v.version = 'Verified' AND r.retracted_at IS NULL"""):
        held.setdefault(no, []).append(score)
    archive = (HERE / "archive.txt").read_text().strip()
    sheet = read(HERE / "osworld_verified_results.xlsx")["Eval Results"]
    rows = [dict(zip(sheet[0], row)) for row in sheet[1:]]
    results, mapping, seen, versions = [], [], {}, set()
    for row in rows:
        if row["Approach type"] != "General model":
            continue
        entry = {"model": row["Model"], "max_steps": row["Max steps"], "success_rate": row["Success rate"],
                 "date_serial": row["Date"], "registry_no": MODELS.get(row["Model"])}
        mapping.append(entry)
        if (row["Additional a11y tree used"], row["Additional coding-based action"], row["Multiple rollout"]) != ("No", "No", "No"):
            entry["status"] = "skipped: not the screenshot-only single-rollout setting"
            continue
        if not entry["registry_no"]:
            entry["status"] = "held: model not in Registry or configuration not settled"
            continue
        if row["Max steps"] not in STEPS:
            entry["status"] = "held: max steps not stated"
            continue
        reported = (date(1899, 12, 30) + timedelta(days=int(row["Date"]))).isoformat()
        entry["date"] = reported
        score = row["Success rate"]
        if same_run(score, held.get(entry["registry_no"], [])):
            entry["status"] = "skipped: the Registry already holds this score via the developer's report of the same run"
            continue
        version = f"Verified — {row['Max steps']} steps"
        key = (entry["registry_no"], version)
        if key in seen:
            entry["status"] = "held: two rows for the same model and step limit"
            continue
        seen[key] = entry
        versions.add(row["Max steps"])
        entry["status"] = "included"
        results.append({"operation": "result", "record": {
            "model_registry_no": entry["registry_no"],
            "reasoning_level": "",
            "benchmark_slug": "osworld",
            "benchmark_version": version,
            "metric_key": "osworld-verified-resolved",
            "source_has_single_run": True,
            "score_value": score,
            "score_raw": score,
            "reported_at": reported,
            "reported_precision": "date",
            "evaluator_keys": [EVALUATOR],
            "source_type": "Benchmark leaderboard",
            "publisher": "OSWorld",
            "reporting_basis": "independent",
            "source_archive_url": archive,
            "sources": [{"url": PAGE, "checked_at": CHECKED, "primary": True}],
        }})
    ordered = sorted(versions, key=int)
    records = [
        {"operation": "benchmark", "record": {
            "slug": "osworld", **family, "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": f"Verified — {steps} steps", "version_slug": f"verified-{steps}-steps",
                "release_at": "2025-07-28", "release_precision": "date",
                "metric_key": "osworld-verified-resolved", "source_url": PAGE,
                "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            } for steps in ordered],
        }},
        *[{"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "osworld", "version": f"Verified — {steps} steps",
            "version_slug": f"verified-{steps}-steps", "dataset_label": "Verified",
            "configuration": {"key": f"max-steps-{steps}", "label": f"{steps}-step limit", "kind": "harness"},
            "source_url": PAGE, "source_checked_at": CHECKED,
        }} for steps in ordered],
        *results,
    ]
    out = ROOT / "data" / "batches" / "evaluator-osworld-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
