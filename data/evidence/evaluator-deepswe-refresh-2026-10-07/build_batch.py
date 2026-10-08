#!/usr/bin/env python3
"""Refresh DeepSWE 1.1 from Datacurve's leaderboard (owner decision D6).

page.html is https://deepswe.datacurve.ai/ fetched 2026-10-07 (board "updated
September 22, 2026"); the Wayback copy in archive.txt is byte-identical. The
"Best" table lists each model's best effort setting.

For each Registry model on the board:
- the same Datacurve row already held with the same score: skipped;
- a Datacurve-attributed row in the same series with a different score:
  a new row that supersedes it;
- any row for the same model and setting whose score matches at the coarser
  precision (a developer quoting this board): skipped as the same run;
- otherwise a new row.

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
CHECKED = "2026-10-07T13:58:00Z"
PAGE = "https://deepswe.datacurve.ai/"
UPDATED = "2026-09-22"

MODELS = {
    "gpt-6-astra": "10005", "gemini-3.8-flash": "30004", "claude-opus-5": "20014", "gpt-5.6-sol": "10010",
    "claude-fable-5": "20012", "glm-5.3": "150005", "kimi-k3": "120003", "grok-4.6": "40002",
    "gpt-5.6-luna": "10009", "gpt-5.5": "10008", "gemini-3.7-flash": "30010", "glm-5.3-flash": "150006",
    "deepseek-v4-pro": "110002", "claude-opus-4.8": "20011", "qwen3.8-max": "130008",
    "muse-spark-1.2": "80003", "claude-sonnet-5": "20013", "deepseek-v4-flash": "110001",
    "gemini-3.6-flash": "30007", "glm-5.2": "150004", "gemini-3.5-flash": "30006",
}


def board():
    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", (HERE / "page.html").read_text(), flags=re.DOTALL)
    lines = [line.strip() for line in html.unescape(re.sub(r"<[^>]+>", "\n", text)).split("\n") if line.strip()]
    joined = " | ".join(lines)
    table = joined[joined.index("Model | Pass@1"):]
    seen, rows = set(), []
    for model, effort, score, ci in re.findall(
            r"([a-z0-9.\-]+) \| \[ \| ([a-z]+) \| \] \| (\d+) \| % \| ± \| (\d+) \| %", table):
        if (model, effort) not in seen:
            seen.add((model, effort))
            rows.append((model, effort, score, f"{score}%±{ci}%"))
    return rows


def coarse_equal(a, b):
    places = min(-Decimal(a).as_tuple().exponent, -Decimal(b).as_tuple().exponent)
    step = Decimal(1).scaleb(-places)
    return Decimal(a).quantize(step) == Decimal(b).quantize(step)


def main(database):
    db = sqlite3.connect(database)
    held = db.execute(
        """SELECT m.registry_no, r.reasoning_level, r.score_value, r.result_key,
                  group_concat(e.key), v.version FROM results r JOIN models m ON m.id = r.model_id
           JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
           JOIN result_evaluators re ON re.result_id = r.id
           JOIN evaluator_organizations e ON e.id = re.evaluator_organization_id
           WHERE b.slug = 'deep-swe' AND v.version IN ('1.1', '1.1 — mini-swe-agent') AND r.retracted_at IS NULL
           GROUP BY r.id""").fetchall()
    results, mapping = [], []
    for model, effort, score, raw in board():
        registry_no = MODELS.get(model)
        row = {"model": model, "effort": effort, "score": score, "registry_no": registry_no}
        mapping.append(row)
        if not registry_no:
            row["status"] = "held: model not in Registry"
            continue
        same_setting = [h for h in held if h[0] == registry_no and h[1] == effort]
        datacurve = [h for h in same_setting if h[4] == "datacurve" and h[5] == "1.1"]
        record = {
            "model_registry_no": registry_no, "reasoning_level": effort, "benchmark_slug": "deep-swe",
            "benchmark_version": "1.1", "metric_key": "deep-swe-pass-at-1", "source_has_single_run": True,
            "score_value": score, "score_raw": raw, "reported_at": UPDATED, "reported_precision": "date",
            "evaluator_keys": ["datacurve"], "source_type": "Benchmark leaderboard", "publisher": "Datacurve",
            "reporting_basis": "independent", "source_archive_url": (HERE / "archive.txt").read_text().strip(),
            "sources": [{"url": PAGE, "checked_at": CHECKED, "primary": True}],
        }
        if any(Decimal(h[2]) == Decimal(score) for h in datacurve):
            row["status"] = "skipped: unchanged from the Datacurve row already held"
        elif datacurve:
            record["supersedes"] = datacurve[0][3]
            row["status"] = f"included: supersedes {datacurve[0][3]} ({datacurve[0][2]})"
            results.append({"operation": "result", "record": record})
        elif any(coarse_equal(h[2], score) for h in same_setting):
            row["status"] = "skipped: a developer row already quotes this run"
        else:
            row["status"] = "included"
            results.append({"operation": "result", "record": record})
    out = ROOT / "data" / "batches" / "evaluator-deepswe-refresh-2026-10-07.json"
    out.write_text(json.dumps({"records": results}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
