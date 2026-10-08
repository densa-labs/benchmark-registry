#!/usr/bin/env python3
"""Build the SWE-bench maintainer-run (mini-SWE-agent) batch from pinned sources.

Inputs (fetched by the curator, pinned by commit):
  leaderboards.json  swe-bench.github.io data/leaderboards.json at SITE_SHA
  meta/*.yaml        SWE-bench/experiments metadata.yaml at EXPERIMENTS_SHA
Writes the batch and mapping.json next to this script's evidence folder.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SITE_SHA = "193160a463a435d05cf44a1fa9dc5eac832113c3"
EXPERIMENTS_SHA = "40f164d5b8f1d249bf95a6df8b74b577fd8e519d"
CHECKED = "2026-10-07T11:40:00Z"
EVALUATOR = "swe-bench-team"

# Leaderboard model tag -> Registry No. Only models already in the Registry.
MODELS = {
    "gpt-4.1-mini-20250414": "10016",
    "gpt-5-2025-08-07": "10018",
    "gpt-5-mini-2025-08-07": "10019",
    "gpt-5-nano-2025-08-07": "10020",
    "GLM-4.5": "150007",
    "glm-4.6": "150009",
    "minimax-m2": "140004",
    "deepseek-v3.2": "110003",
    "claude-3-7-sonnet-20250219": "20001",
    "claude-4-sonnet-20250514": "20003",
    "claude-4-opus-20250514": "20002",
    "claude-sonnet-4-5-20250929": "20005",
    "claude-haiku-4-5-20251001": "20006",
    "claude-opus-4-5-20251101": "20007",
    "claude-4-5-opus": "20007",
    "claude-opus-4-6": "20008",
    "gpt-4.1-20250414": "10002",
    "o3-20250416": "10003",
    "o4-mini-20250416": "10004",
    "gpt-5.2-2025-12-11": "10012",
    "gpt-5-2": "10012",
    "gpt-oss-120b": "15001",
    "gemini-2.0-flash": "30001",
    "gemini-2.5-pro": "30002",
    "gemini-2.5-flash": "30003",
    "gemini-3-pro-preview": "30008",
    "gemini-3-pro": "30008",
    "gemini-3-flash-preview": "30009",
    "gemini-3-flash": "30009",
    "devstral-2512": "90002",
    "devstral-small-2512": "90003",
    "kimi-k2.5": "120001",
    "minimax-m2.5": "140001",
    "minimax-2.5": "140001",
    "glm-5": "150002",
}
BOARDS = {
    "Verified": ("verified", "Verified — mini-swe-agent", "verified.html"),
    "Multilingual": ("multilingual", "Multilingual — mini-swe-agent", "multilingual.html"),
}


def model_tag(entry):
    tags = [t[len("Model: "):] for t in entry["tags"] if t.startswith("Model: ")]
    if len(tags) != 1:
        raise SystemExit(f"{entry['folder']}: expected one model tag, got {tags}")
    return tags[0]


def metadata_resolved(split, folder):
    text = (HERE / "meta" / f"{split[0]}_{folder}.yaml").read_text()
    match = re.search(r"^\s*resolved:\s*([0-9.]+)\s*$", text, re.MULTILINE)
    return match.group(1)


def main():
    board = json.loads((HERE / "leaderboards.json").read_text())
    results, mapping = [], []
    for leaderboard in board["leaderboards"]:
        if leaderboard["name"] not in BOARDS:
            continue
        split, version, page = BOARDS[leaderboard["name"]]
        for entry in sorted(leaderboard["results"], key=lambda e: e["folder"]):
            if entry.get("agent") != "mini-SWE-agent":
                continue
            tag = model_tag(entry)
            registry_no = MODELS.get(tag)
            raw = metadata_resolved(split, entry["folder"])
            if float(raw) != float(entry["resolved"]):
                raise SystemExit(f"{entry['folder']}: metadata {raw} != board {entry['resolved']}")
            row = {
                "board": leaderboard["name"], "folder": entry["folder"], "model_tag": tag,
                "model_display": entry["model_display"], "registry_no": registry_no,
                "reasoning_effort": entry.get("reasoning_effort"), "resolved": raw,
                "date": entry["date"], "mini_version": entry.get("mini-swe-agent_version"),
                "status": "included" if registry_no else "held: model not in Registry",
            }
            mapping.append(row)
            if not registry_no:
                continue
            path = f"evaluation/{split}/{entry['folder']}"
            results.append({"operation": "result", "record": {
                "model_registry_no": registry_no,
                "reasoning_level": entry.get("reasoning_effort") or "",
                "benchmark_slug": "swe-bench",
                "benchmark_version": version,
                "metric_key": "swe-bench-resolved",
                "run_ref": f"swe-bench-experiments:{path}",
                "score_value": raw,
                "score_raw": raw,
                "reported_at": entry["date"],
                "reported_precision": "date",
                "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark repository",
                "publisher": "SWE-bench",
                "reporting_basis": "independent",
                "source_archive_url": f"https://github.com/SWE-bench/experiments/tree/{EXPERIMENTS_SHA}/{path}",
                "sources": [
                    {"url": f"https://github.com/SWE-bench/experiments/tree/main/{path}", "checked_at": CHECKED, "primary": True},
                    {"url": f"https://www.swebench.com/{page}", "checked_at": CHECKED, "primary": False, "same_run": True},
                ],
            }})
    benchmark = {"operation": "benchmark", "record": {
        "canonical_name": "SWE-bench",
        "slug": "swe-bench",
        "source_url": "https://www.swebench.com/",
        "source_checked_at": "2026-09-17T00:00:00Z",
        "aliases": [],
        "evaluators": [{
            "name": "SWE-bench Team", "key": EVALUATOR,
            "source_url": "https://www.swebench.com/verified.html", "source_checked_at": CHECKED,
        }],
        "metrics": [],
        "versions": [
            {"version": "Verified — mini-swe-agent", "version_slug": "verified-mini-swe-agent",
             "release_at": "2025-07-12", "release_precision": "date", "metric_key": "swe-bench-resolved",
             "source_url": "https://github.com/SWE-bench/swe-bench.github.io/commit/2212eb9e64a518ae4076435325a12269641acc30",
             "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR]},
            {"version": "Multilingual — mini-swe-agent", "version_slug": "multilingual-mini-swe-agent",
             "release_at": "2026-02-24", "release_precision": "date", "metric_key": "swe-bench-resolved",
             "source_url": "https://github.com/SWE-bench/swe-bench.github.io/commit/f28b73fd3d529b8d2fe9a648f25b5409887cd6a5",
             "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR]},
        ],
    }}
    configurations = [
        {"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "swe-bench", "version": version, "version_slug": slug, "dataset_label": label,
            "configuration": {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"},
            "source_url": f"https://www.swebench.com/{page}", "source_checked_at": CHECKED}}
        for version, slug, label, page in (
            ("Verified — mini-swe-agent", "verified-mini-swe-agent", "Verified", "verified.html"),
            ("Multilingual — mini-swe-agent", "multilingual-mini-swe-agent", "Multilingual", "multilingual.html"),
        )
    ]
    batch = {"records": [benchmark, *configurations, *results]}
    out = ROOT / "data" / "batches" / "evaluator-swe-bench-2026-10-07.json"
    out.write_text(json.dumps(batch, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(results)} results, {sum(1 for m in mapping if not m['registry_no'])} held", file=sys.stderr)


if __name__ == "__main__":
    main()
