#!/usr/bin/env python3
"""Refresh CursorBench 4.0 from Cursor's board (owner decision D6).

page.html is https://cursor.com/cursorbench fetched 2026-10-07; the Wayback
snapshot in archive.txt shows the same 63 rows and scores. Cursor runs every
model in its own harness; rows for other developers' models are independent,
and Cursor's own Composer is self-reported. The board has no per-row date, so
new rows use the archive date (owner decision D4).

Usage: build_batch.py <local replay database>
"""
import html
import json
import re
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:01:00Z"
PAGE = "https://cursor.com/cursorbench"
REPORTED = "2026-10-07"
MODELS = {
    "Opus 5.5": "20015", "Sonnet 5.5": "20016", "Fable 5.1": "20004", "Opus 5": "20014", "Sonnet 5": "20013",
    "Grok 4.7": "40003", "Grok 4.6": "40002", "GLM 5.3": "150005", "GLM 5.3 Flash": "150006",
    "GPT-5.6 Sol": "10010", "GPT-5.6 Terra": "10011", "GPT-5.6 Luna": "10009",
    "Muse Spark 1.3": "80005", "Gemini 3.8 Flash": "30004", "Composer 2.5": "50004",
}
# Board effort words -> the labels the Registry already uses for this board.
EFFORTS = {"Max": "max", "Extra High": "xhigh", "High": "high", "Medium": "medium", "Low": "low"}


def board():
    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", (HERE / "page.html").read_text(), flags=re.S)
    joined = " | ".join(line.strip() for line in html.unescape(re.sub(r"<[^>]+>", "\n", text)).split("\n")
                        if line.strip())
    rows = {}
    for _, name, score in re.findall(r"\| (\d+) \| ([A-Za-z0-9 .\-]+?) \| ([\d.]+) \| % \| \$ \|", joined):
        rows.setdefault(name, score)
    return rows


def split(name):
    for word in sorted(EFFORTS, key=len, reverse=True):
        if name.endswith(" " + word):
            return name[: -len(word) - 1], EFFORTS[word]
    return name, "" if name in MODELS else None


def main(database):
    db = sqlite3.connect(database)
    held = {(no, level): (score, key) for no, level, score, key in db.execute(
        """SELECT m.registry_no, r.reasoning_level, r.score_value, r.result_key FROM results r
           JOIN models m ON m.id = r.model_id JOIN benchmark_versions v ON v.id = r.benchmark_version_id
           JOIN benchmarks b ON b.id = v.benchmark_id
           WHERE b.slug = 'cursorbench' AND v.version = '4.0' AND r.retracted_at IS NULL""")}
    results, mapping = [], []
    for name, score in board().items():
        model, level = split(name)
        registry_no = MODELS.get(model)
        row = {"board_name": name, "score": score, "registry_no": registry_no, "reasoning_level": level}
        mapping.append(row)
        if level is None:
            row["status"] = "held: setting not on the fixed effort vocabulary"
            continue
        if not registry_no:
            row["status"] = "held: model not in Registry"
            continue
        known = held.get((registry_no, level))
        if known and Decimal(known[0]) == Decimal(score):
            row["status"] = f"skipped: unchanged from {known[1]}"
            continue
        record = {
            "model_registry_no": registry_no, "reasoning_level": level, "benchmark_slug": "cursorbench",
            "benchmark_version": "4.0", "metric_key": "cursorbench-accuracy", "source_has_single_run": True,
            "score_value": score, "score_raw": f"{score}%", "reported_at": REPORTED, "reported_precision": "date",
            "evaluator_keys": ["cursor"], "source_type": "Benchmark leaderboard", "publisher": "Cursor",
            "reporting_basis": "self-reported" if model == "Composer 2.5" else "independent",
            "source_archive_url": (HERE / "archive.txt").read_text().strip(),
            "sources": [{"url": PAGE, "checked_at": CHECKED, "primary": True}],
        }
        if known:
            record["supersedes"] = known[1]
            row["status"] = f"included: supersedes {known[1]} ({known[0]})"
        else:
            row["status"] = "included"
        results.append({"operation": "result", "record": record})
    out = ROOT / "data" / "batches" / "evaluator-cursorbench-refresh-2026-10-07.json"
    out.write_text(json.dumps({"records": results}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
