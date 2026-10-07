#!/usr/bin/env python3
"""Build the Toolathlon maintainer batch from leaderboard.md.

leaderboard.md is https://toolathlon.xyz/docs/leaderboard.md as fetched on
2026-10-07; the Wayback snapshot in archive.txt is byte-identical. Only rows
with the board's "Evaluated by us" badge are used; the other rows link to the
model developer's own report.

Usage: build_batch.py <local replay database>
"""
import html
import json
import re
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T13:40:00Z"
PAGE = "https://toolathlon.xyz/docs/leaderboard"
EVALUATOR = "toolathlon-authors"

# (table, model text) -> (Registry No., reasoning label as shown)
MODELS = {
    ("Verified", "GLM 5.3 Flash (max)"): ("150006", "max"),
    ("Verified", "Kimi K3 (max)"): ("120003", "max"),
    ("Verified", "Claude Opus 4.8 (max)"): ("20011", "max"),
    ("Verified", "Muse Spark 1.2 (xhigh)"): ("80003", "xhigh"),
    ("Verified", "Muse Spark 1.1 (xhigh)"): ("80002", "xhigh"),
    ("Verified", "GPT-5.5 (xhigh)"): ("10008", "xhigh"),
    ("Verified", "Claude Sonnet 5 (max)"): ("20013", "max"),
    ("Verified", "Gemini 3.5 Flash (high)"): ("30006", "high"),
    ("Verified", "Gemini 3.1 Pro (high)"): ("30005", "high"),
    ("Verified", "GLM 5.2 (max)"): ("150004", "max"),
    ("Verified", "Kimi K2.6"): ("120002", ""),
    ("Verified", "DeepSeek V4 Pro (max)"): ("110002", "max"),
    ("Verified", "Inkling-Small (xhigh)"): ("160002", "xhigh"),
    ("Verified", "DeepSeek V4 Flash (max)"): ("110001", "max"),
    ("Verified", "MiniMax M2.7"): ("140002", ""),
    ("Verified", "Inkling (xhigh)"): ("160001", "xhigh"),
    ("Verified", "Qwen3.5 397B-A17B"): ("130003", ""),
    ("Verified", "Nemotron 3 Ultra"): ("60003", ""),
    ("Verified", "Kimi K2.5"): ("120001", ""),
    ("Original", "Gemini-3.5-Flash"): ("30006", ""),
    ("Original", "DeepSeek-V4-Pro Max"): ("110002", "Max"),
    ("Original", "Claude-Opus-4.7"): ("20010", ""),
    ("Original", "Gemini-3-Flash"): ("30009", ""),
    ("Original", "Gemini-3.1-Pro"): ("30005", ""),
    ("Original", "DeepSeek-V4-Flash Max"): ("110001", "Max"),
    ("Original", "Claude-Sonnet-4.6"): ("20009", ""),
    ("Original", "GPT-5.2-xhigh‡"): ("10012", "xhigh"),
    ("Original", "Claude-Opus-4.5"): ("20007", ""),
    ("Original", "GPT-5.2-high‡"): ("10012", "high"),
    ("Original", "GLM-5"): ("150002", ""),
    ("Original", "Claude-Sonnet-4.5"): ("20005", ""),
    ("Original", "Gemini-3-Pro"): ("30008", ""),
    ("Original", "Claude-Sonnet-4"): ("20003", ""),
    ("Original", "Kimi-K2.5"): ("120001", ""),
    ("Original", "Claude-Haiku-4.5"): ("20006", ""),
    ("Original", "GLM-4.7"): ("150001", ""),
    ("Original", "o3"): ("10003", ""),
    ("Original", "o4-mini"): ("10004", ""),
}


def rows():
    text = (HERE / "leaderboard.md").read_text()
    archived = text.index("This archived snapshot shows the leaderboard immediately before Toolathlon-Verified")
    for match in re.finditer(r'<tr className="rank[^"]*">(.*?)</tr>', text, re.S):
        row = match.group(1)

        def cell(label):
            found = re.search(r'data-label="' + re.escape(label) + r'">(.*?)</td>', row, re.S)
            return found.group(1) if found else ""

        name = re.sub(r"<svg.*?</svg>", "", cell("Model"), flags=re.S)
        verified = "verified-badge" in name
        name = html.unescape(re.sub(r"<[^>]+>", "", name)).replace("✓", "").strip()
        score = re.sub(r"<[^>]+>", "", re.sub(r"<sub>.*?</sub>", "", cell("Pass@1"))).strip()
        yield {"table": "Original" if match.start() > archived else "Verified", "model": name,
               "verified": verified, "agent": cell("Agent").strip(), "date": cell("Date").strip(),
               "pass_at_1": score}


def main(database):
    db = sqlite3.connect(database)
    held = {(no, version, score) for no, version, score in db.execute(
        """SELECT m.registry_no, v.version, r.score_value FROM results r JOIN models m ON m.id = r.model_id
        JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
        WHERE b.slug = 'toolathlon' AND r.retracted_at IS NULL""")}
    archive = (HERE / "archive.txt").read_text().strip()
    results, mapping = [], []
    for row in rows():
        target = MODELS.get((row["table"], row["model"]))
        mapping.append(row)
        score = row["pass_at_1"].rstrip("†")
        if not row["verified"]:
            row["status"] = "skipped: submitted result; the board links to the developer's own report"
        elif row["agent"] != "Default":
            row["status"] = f"held: agent {row['agent']!r} differs from the default harness"
        elif not re.fullmatch(r"\d+(\.\d+)?", score):
            row["status"] = "held: no Pass@1 score"
        elif not target:
            row["status"] = "held: model not in Registry or build not shown to be the Registry model"
        elif (target[0], row["table"], score) in held:
            row["status"] = "skipped: the Registry already holds this score via the developer's report of the same run"
        else:
            row["status"] = "included"
            results.append({"operation": "result", "record": {
                "model_registry_no": target[0],
                "reasoning_level": target[1],
                "benchmark_slug": "toolathlon",
                "benchmark_version": row["table"],
                "metric_key": "toolathlon-task-success",
                "source_has_single_run": True,
                "score_value": score,
                "score_raw": row["pass_at_1"],
                "reported_at": row["date"],
                "reported_precision": "date",
                "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark leaderboard",
                "publisher": "Toolathlon",
                "reporting_basis": "independent",
                "source_archive_url": archive,
                "sources": [{"url": PAGE, "checked_at": CHECKED, "primary": True}],
            }})
    out = ROOT / "data" / "batches" / "evaluator-toolathlon-2026-10-07.json"
    out.write_text(json.dumps({"records": results}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    counts = {}
    for row in mapping:
        counts[row["status"].split(":")[0]] = counts.get(row["status"].split(":")[0], 0) + 1
    print(len(results), "results;", counts, file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
