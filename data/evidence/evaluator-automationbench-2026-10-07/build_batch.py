#!/usr/bin/env python3
"""Build the AutomationBench official-leaderboard batch (Zapier).

leaderboard-module.mjs is the page module behind https://zapier.com/benchmarks
that holds the 1.0.6 leaderboard rows, fetched 2026-10-07 (content-hashed URL);
the Wayback copy in archive.txt is byte-identical, and page-archive.txt is the
page itself. The page says leaderboard scores "run against a held-out private
evaluation set"; Zapier, the benchmark's maintainer, runs every model.

Usage: build_batch.py <local replay database>
"""
import json
import re
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:10:00Z"
PAGE = "https://zapier.com/benchmarks"
EVALUATOR = "automationbench-authors"
MODULE = ("https://framerusercontent.com/sites/4WTSl4BNjd1q9QFEFibC6h/"
          "EoTxbXN5IqknxERosd2sBrwM9eKEsz_G9J9FFC1HRNA.CSDhPu6z.mjs")
EFFORTS = {"Max": "max", "XHigh": "xhigh", "High": "high", "Medium": "medium", "Low": "low", "None": "none"}
MODELS = {
    "Gemini 4 Argon": "30011", "GPT 6 Astra": "10005", "GPT 6 Sol": "10014", "GPT 6 Luna": "10013",
    "Gemini 3.7 Flash": "30010", "Gemini 3.8 Flash": "30004", "GPT-5.6 Sol": "10010",
    "GPT-5.6 Terra": "10011", "GPT-5.6 Luna": "10009", "Claude Opus 5": "20014", "Kimi K3": "120003",
    "Claude Fable 5.1": "20004", "Muse Spark 1.3": "80005", "DeepSeek V4 Flash": "110001",
    "Gemini 3.6 Flash": "30007", "Claude Fable 5.0": "20012", "Claude Opus 4.8": "20011",
    "GPT-5.5": "10008", "Gemini 3.5 Flash": "30006", "Claude Opus 4.7": "20010", "GPT-5.4": "10007",
    "Claude Sonnet 5": "20013", "Gemini 3.1 Pro (preview)": "30005", "GLM 5.1": "150003",
    "Claude Sonnet 4.6": "20009", "Minimax M3": "140003", "Qwen 3.6+": "130004", "Qwen 3.7+": "130007",
    "Kimi K2.6": "120002", "Gemma 4 31B": "35002", "Claude Haiku 4.5": "20006", "Minimax M2.7": "140002",
    "GPT-OSS 120B": "15001",
}


def rows():
    text = (HERE / "leaderboard-module.mjs").read_text()
    return [(int(rank), name, score) for rank, name, score in
            re.findall(r"\[(\d+),`([^`]+)`,`([\d.]+)%`,`[^`]*`\]", text)]


def split(name):
    match = re.fullmatch(r"(.+?) \(([^()]+)\)", name)
    if match and match.group(2) in EFFORTS:
        return match.group(1), EFFORTS[match.group(2)]
    if match and ("fallback" in match.group(2).lower() or match.group(2) in ("Minimal",)):
        return match.group(1), None
    return name, ""


def coarse_equal(a, b):
    places = min(-Decimal(a).as_tuple().exponent, -Decimal(b).as_tuple().exponent)
    step = Decimal(1).scaleb(-places)
    return Decimal(a).quantize(step) == Decimal(b).quantize(step)


def main(database):
    db = sqlite3.connect(database)
    held = db.execute(
        """SELECT m.registry_no, r.reasoning_level, r.score_value FROM results r JOIN models m ON m.id = r.model_id
           JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
           WHERE b.slug = 'automationbench' AND v.version = '1.0.6' AND r.retracted_at IS NULL""").fetchall()
    results, mapping = [], []
    for rank, name, score in rows():
        model, level = split(name)
        if "fallback" in name.lower():
            level = None
        registry_no = MODELS.get(model)
        entry = {"rank": rank, "board_name": name, "score": score, "registry_no": registry_no,
                 "reasoning_level": level}
        mapping.append(entry)
        if level is None:
            entry["status"] = "held: score includes a fallback model, or a setting off the fixed vocabulary"
            continue
        if not registry_no:
            entry["status"] = "held: model not in Registry"
            continue
        same = [h for h in held if h[0] == registry_no and h[1] == level]
        if any(coarse_equal(h[2], score) for h in same):
            entry["status"] = "skipped: the Registry already holds this run from a developer report"
            continue
        entry["status"] = "included"
        results.append({"operation": "result", "record": {
            "model_registry_no": registry_no, "reasoning_level": level, "benchmark_slug": "automationbench",
            "benchmark_version": "1.0.6", "metric_key": "automationbench-pass-rate",
            "source_has_single_run": True, "score_value": score, "score_raw": f"{score}%",
            "reported_at": "2026-10-07", "reported_precision": "date", "evaluator_keys": [EVALUATOR],
            "source_type": "Benchmark leaderboard", "publisher": "Zapier", "reporting_basis": "independent",
            "source_archive_url": (HERE / "page-archive.txt").read_text().strip(),
            "sources": [
                {"url": PAGE, "checked_at": CHECKED, "primary": True},
                {"url": MODULE, "checked_at": CHECKED, "primary": False, "same_run": True},
            ],
        }})
    out = ROOT / "data" / "batches" / "evaluator-automationbench-2026-10-07.json"
    out.write_text(json.dumps({"records": results}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    counts = {}
    for entry in mapping:
        counts[entry["status"].split(":")[0]] = counts.get(entry["status"].split(":")[0], 0) + 1
    print(len(results), "results;", counts, file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
