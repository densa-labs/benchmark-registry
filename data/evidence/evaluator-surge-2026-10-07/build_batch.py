#!/usr/bin/env python3
"""Build the Surge AI batch (Riemann-bench, Chartography) from the saved pages.

riemann-bench.html and chartography.html are surgehq.ai/benchmarks/<name>
fetched 2026-10-07; the Wayback snapshots in archives.json show the same rows.
Surge says "We evaluate AI models" on these pages; rows are independent,
evaluator surge-ai. The boards have no per-row date: reported_at is the archive
date (owner decision D4), and each board is a dated snapshot version, as the
existing September versions are.

Usage: build_batch.py <local replay database>
"""
import json
import re
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path

from common import surge_rows

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:15:00Z"
REPORTED = "2026-10-07"
BOARDS = {
    "riemann-bench": ("riemann-bench", "riemann-bench-pass-at-1", "October 2026 leaderboard", "october-2026"),
    "chartography": ("chartography", "chartography-pass-at-1", "October 2026 leaderboard", "october-2026"),
}
MODELS = {
    "GPT 5.6 Sol": "10010", "GPT 6 Astra": "10005", "Claude Opus 5.5": "20015", "Claude Opus 5": "20014",
    "GPT 5.6 Terra": "10011", "GPT 5.6 Luna": "10009", "Claude Fable 5.1": "20004", "GPT 6 Sol": "10014",
    "Claude Fable 5": "20012", "GPT 6 Luna": "10013", "GPT 5.5": "10008", "Gemini 3.8 Flash": "30004",
    "Claude Opus 4.8": "20011", "GPT 5.4": "10007", "Gemini 3.7 Flash": "30010",
    "DeepSeek V4 Pro": "110002", "Grok 4.5": "40001", "Grok 4.6": "40002", "Grok 4.7": "40003",
    "GPT 5.2": "10012", "Kimi K3": "120003", "Gemini 3.5 Flash": "30006", "Gemini 3.1 Pro": "30005",
    "Claude Opus 4.7": "20010", "Gemini 3.6 Flash": "30007", "Muse Spark 1.3": "80005",
    "Claude Opus 4.6": "20008", "Muse Spark 1.2": "80003", "Muse Spark 1.1": "80002",
    "Qwen 3.7 Max": "130006", "Qwen 3.8 Max": "130008", "Qwen 3.7 Plus": "130007",
    "Inkling Inkling": "160001", "Inkling Small": "160002", "Muse Glimmer 30B": "80004",
    "GLM 5.3": "150005", "GLM 5.2": "150004", "GLM 5.3 Flash": "150006", "Kimi K2.5": "120001",
    "Kimi K2.6": "120002", "Claude Opus 4.5": "20007", "DeepSeek V4 Flash": "110001",
    "MAI Thinking 1": "70003", "Gemini 4 Argon": "30011", "Claude Sonnet 5": "20013",
    "Mistral Large 3": "90001",
}
LABELS = {"Max": "Max", "xHigh": "xHigh", "High": "High", "Medium": "Medium",
          "Adaptive/Max": "Adaptive/Max", "Thinking on": "Thinking on"}


def split(brand, rest):
    match = re.fullmatch(r"(.+?) \((?:(.+?) reasoning|(Adaptive/Max)|(Thinking on))\)", rest)
    if not match:
        return f"{brand} {rest}", ""
    setting = match.group(2) or match.group(3) or match.group(4)
    return f"{brand} {match.group(1)}", LABELS.get(setting)


def coarse_equal(a, b):
    places = min(-Decimal(a).as_tuple().exponent, -Decimal(b).as_tuple().exponent)
    step = Decimal(1).scaleb(-places)
    return Decimal(a).quantize(step) == Decimal(b).quantize(step)


def main(database):
    db = sqlite3.connect(database)
    archives = json.loads((HERE / "archives.json").read_text())
    results, mapping, records = [], [], []
    for page, (slug, metric, version, version_slug) in BOARDS.items():
        family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
            "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = ?", (slug,)).fetchone()))
        held = db.execute(
            """SELECT m.registry_no, r.score_value FROM results r JOIN models m ON m.id = r.model_id
               JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
               WHERE b.slug = ? AND r.retracted_at IS NULL""", (slug,)).fetchall()
        url = f"https://surgehq.ai/benchmarks/{page}"
        records.append({"operation": "benchmark", "record": {
            "slug": slug, **family, "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{"version": version, "version_slug": version_slug, "release_at": REPORTED,
                          "release_precision": "date", "metric_key": metric, "source_url": url,
                          "source_checked_at": CHECKED, "evaluator_keys": ["surge-ai"]}],
        }})
        for brand, rest, score in surge_rows(HERE / f"{page}.html"):
            model, label = split(brand.strip(), rest.strip())
            registry_no = MODELS.get(model)
            entry = {"board": page, "board_name": f"{brand} {rest}", "score": score, "registry_no": registry_no,
                     "reasoning_level": label}
            mapping.append(entry)
            if label is None:
                entry["status"] = "held: setting off the fixed effort vocabulary"
                continue
            if not registry_no:
                entry["status"] = "held: model not in Registry or build not shown to be the Registry model"
                continue
            if any(no == registry_no and coarse_equal(value, score) for no, value in held):
                entry["status"] = "skipped: the Registry already holds this run from a developer report"
                continue
            entry["status"] = "included"
            results.append({"operation": "result", "record": {
                "model_registry_no": registry_no, "reasoning_level": label, "benchmark_slug": slug,
                "benchmark_version": version, "metric_key": metric, "source_has_single_run": True,
                "score_value": score, "score_raw": f"{score}%", "reported_at": REPORTED,
                "reported_precision": "date", "evaluator_keys": ["surge-ai"],
                "source_type": "Benchmark leaderboard", "publisher": "Surge AI", "reporting_basis": "independent",
                "source_archive_url": archives[page],
                "sources": [{"url": url, "checked_at": CHECKED, "primary": True}],
            }})
    out = ROOT / "data" / "batches" / "evaluator-surge-2026-10-07.json"
    out.write_text(json.dumps({"records": records + results}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
