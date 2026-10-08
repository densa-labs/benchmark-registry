#!/usr/bin/env python3
"""Build the Epoch AI batch from Epoch's own benchmark runs.

The CSVs here come from https://epoch.ai/data/benchmark_data.zip (CC BY 4.0),
fetched 2026-10-07; benchmark_data.zip.sha256 is the zip's hash and the Wayback
copy in archive.txt is byte-identical. Only Epoch's internal runs are used
(files without the "_external" suffix): GPQA Diamond, SWE-bench Verified and
SimpleQA Verified.

Usage: build_batch.py <local replay database>
"""
import csv
import json
import sqlite3
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T13:50:00Z"
PAGE = "https://epoch.ai/benchmarks"
UPDATED = "2026-10-07"
EVALUATOR = "epoch-ai"
EFFORTS = {"max", "xhigh", "high", "medium", "low", "none"}

MODELS = {
    "gpt-5-2025-08-07": "10018", "gpt-5-mini-2025-08-07": "10019", "gpt-5-nano-2025-08-07": "10020",
    "gpt-4.1-mini-2025-04-14": "10016", "gpt-4.1-nano-2025-04-14": "10017",
    "gpt-5.4-mini-2026-03-17": "10021", "gpt-5.4-nano-2026-03-17": "10022",
    "claude-opus-4-1-20250805": "20017", "grok-4-0709": "40004",
    "claude-3-7-sonnet-20250219": "20001", "claude-fable-5-1": "20004", "claude-fable-5": "20012",
    "claude-haiku-4-5-20251001": "20006", "claude-opus-4-20250514": "20002",
    "claude-opus-4-5-20251101": "20007", "claude-opus-4-6": "20008", "claude-opus-4-7": "20010",
    "claude-opus-4-8": "20011", "claude-opus-5": "20014", "claude-opus-5-5": "20015",
    "claude-sonnet-4-20250514": "20003", "claude-sonnet-4-5-20250929": "20005",
    "claude-sonnet-4-6": "20009", "claude-sonnet-5-5": "20016", "claude-sonnet-5": "20013",
    "deepseek-v4-pro": "110002", "fireworks/kimi-k2p5": "120001", "kimi-k2.5": "120001",
    "kimi-k2.6": "120002", "kimi-k3": "120003",
    "gemini-2.0-flash-001": "30001", "gemini-2.5-pro-exp-03-25": "30002",
    "gemini-3-flash-preview": "30009", "gemini-3-pro-preview": "30008",
    "gemini-3.1-pro-preview": "30005", "gemini-3.5-flash": "30006", "gemini-3.6-flash": "30007",
    "gemini-3.7-flash": "30010", "gemini-3.8-flash": "30004", "gemma-4-31b-it": "35002",
    "gemma-4-26b-a4b-it": "35001",
    "glm-4.7": "150001", "glm-5": "150002", "glm-5.1": "150003", "glm-5.2": "150004",
    "glm-5.3": "150005", "glm-5.3-flash": "150006",
    "gpt-4.1-2025-04-14": "10002", "gpt-4.5-preview-2025-02-27": "10001",
    "gpt-5.2-2025-12-11": "10012", "gpt-5.3-codex": "10006", "gpt-5.4-2026-03-05": "10007",
    "gpt-5.5": "10008", "gpt-5.6-luna": "10009", "gpt-5.6-sol": "10010", "gpt-5.6-terra": "10011",
    "gpt-6-astra": "10005", "gpt-6-luna": "10013", "gpt-6-sol": "10014", "gpt-6.1-sol": "10015",
    "openai/gpt-oss-120b": "15001",
    "grok-4.5": "40001", "grok-4.6": "40002", "grok-4.7": "40003",
    "Inkling": "160001", "inkling-small": "160002",
    "MiniMax-M3": "140003", "muse-spark": "80001", "muse-spark-1.1": "80002",
    "muse-spark-1.2": "80003", "nemotron-3-ultra": "60003",
    "o3-2025-04-16": "10003", "o4-mini-2025-04-16": "10004",
    "qwen3.5-397b-a17b": "130003", "qwen3.6-35b-a3b": "130005", "qwen3.6-plus": "130004",
    "qwen3.7-max": "130006", "qwen3.7-plus": "130007", "qwen3.8-max": "130008",
}
FILES = {
    "gpqa_diamond.csv": ("gpqa", "gpqa-diamond-accuracy", "Diamond — Epoch AI harness", "diamond-epoch-ai",
                         "2023-11-20", "Diamond"),
    "swe_bench_verified.csv": ("swe-bench", "swe-bench-resolved", "Verified — Epoch AI harness",
                               "verified-epoch-ai", "2024-08-13", "Verified"),
    "simpleqa_verified.csv": ("simpleqa-verified", "simpleqa-verified-accuracy", "Original — Epoch AI harness",
                              "original-epoch-ai", "2025-09-09", "Original"),
}


def split(version):
    base, _, suffix = version.rpartition("_")
    if base and suffix in EFFORTS:
        return base, suffix
    if base and suffix not in EFFORTS:
        return version, None  # a token budget or "minimal": not on the fixed vocabulary
    return version, ""


def main(database):
    db = sqlite3.connect(database)
    released = dict(db.execute("SELECT registry_no, release_at FROM models"))
    families, results, mapping, used = {}, [], [], {}
    for name, (slug, metric, version, version_slug, release, dataset) in FILES.items():
        families[slug] = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
            "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = ?", (slug,)).fetchone()))
        for row in csv.DictReader(open(HERE / name, newline="")):
            base, label = split(row["Model version"])
            registry_no = MODELS.get(base)
            entry = {"file": name, "model_version": row["Model version"], "id": row["id"],
                     "score": row["Best score (across scorers)"], "registry_no": registry_no,
                     "epoch_release_date": row["Release date"]}
            mapping.append(entry)
            if label is None:
                entry["status"] = "held: setting is a token budget or 'minimal', not on the fixed effort vocabulary"
                continue
            if not registry_no:
                entry["status"] = "held: model not in Registry or build not shown to be the Registry model"
                continue
            if row["Release date"] and abs(
                    (date.fromisoformat(row["Release date"]) - date.fromisoformat(released[registry_no])).days) > 31:
                entry["status"] = f"held: Epoch release date {row['Release date']} is over a month from the Registry's {released[registry_no]}"
                continue
            if not row["Best score (across scorers)"]:
                entry["status"] = "held: no score"
                continue
            raw = row["Best score (across scorers)"]
            score = format((Decimal(raw) * 100).normalize(), "f")
            entry["status"] = "included"
            used[slug] = (version, version_slug, release, dataset, metric)
            record = {
                "model_registry_no": registry_no,
                "reasoning_level": label,
                "benchmark_slug": slug,
                "benchmark_version": version,
                "metric_key": metric,
                "run_ref": f"epoch-ai:{row['id']}",
                "score_value": score,
                "score_raw": raw,
                "reported_at": UPDATED,
                "reported_precision": "date",
                "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark leaderboard",
                "publisher": "Epoch AI",
                "reporting_basis": "independent",
                "source_archive_url": (HERE / "archive.txt").read_text().strip(),
                "sources": [{"url": PAGE, "checked_at": CHECKED, "primary": True}],
            }
            if row["Started at"]:
                record["evaluated_at"] = row["Started at"].replace(".000Z", "Z")
                record["evaluated_precision"] = "timestamp"
            results.append({"operation": "result", "record": record})
    records = []
    for slug, (version, version_slug, release, dataset, metric) in used.items():
        records.append({"operation": "benchmark", "record": {
            "slug": slug, **families[slug], "aliases": [],
            "evaluators": [] if slug != "gpqa" else [{
                "name": "Epoch AI", "key": EVALUATOR, "source_url": PAGE, "source_checked_at": CHECKED}],
            "metrics": [],
            "versions": [{
                "version": version, "version_slug": version_slug, "release_at": release,
                "release_precision": "date", "metric_key": metric, "source_url": PAGE,
                "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            }],
        }})
    records.sort(key=lambda r: r["record"]["slug"] != "gpqa")
    records += [{"operation": "benchmark_version_configuration", "record": {
        "benchmark_slug": slug, "version": version, "version_slug": version_slug, "dataset_label": dataset,
        "configuration": {"key": "epoch-ai-harness", "label": "Epoch AI harness", "kind": "harness"},
        "source_url": PAGE, "source_checked_at": CHECKED,
    }} for slug, (version, version_slug, _, dataset, _) in used.items()]
    records += results
    out = ROOT / "data" / "batches" / "evaluator-epoch-ai-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    counts = {}
    for entry in mapping:
        counts[entry["status"].split(":")[0]] = counts.get(entry["status"].split(":")[0], 0) + 1
    print(len(results), "results;", counts, file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
