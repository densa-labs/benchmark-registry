#!/usr/bin/env python3
"""Build the PostTrainBench batch from the board's own data files.

scores-v1.2.js, scores.js (v1.1) and config.js are the data and agent table
behind https://posttrainbench.com/ (fetched 2026-10-07, page "Updated Oct 6");
archives.txt lists byte-identical Wayback copies of the two score files and the
page. extracted.json is what node read from them (aggregatedScores, the per-cell
fallback flags, agentInfo). The PostTrainBench team runs every agent except the
external Locus entry.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:24:00Z"
REPORTED = "2026-10-06"
PAGE = "https://posttrainbench.com/"
RELEASES = {"v1.2": ("1.2", "2026-09-30"), "v1.1": ("1.1", "2026-07-28")}
MODELS = {
    "glm-5.2": "150004", "glm-5.3": "150005", "glm-5.3-flash": "150006", "gpt-5.4-high": "10007",
    "gpt-5.5-xhigh": "10008", "gpt-5.6-sol": "10010", "gpt-6-astra": "10005", "gpt-6.1-sol": "10015",
    "gemini-3.1-pro": "30005", "grok-4.5-high": "40001", "kimi-k3": "120003", "opus-4.7": "20010",
    "opus-4.8": "20011", "opus-4.8-max": "20011", "opus-5": "20014", "opus-5.5-max": "20015",
}
# The page notes that these agents' GPQA cells fell back to another model.
FALLBACK = {"fable-5", "fable-5.1"}
LABELS = {"Max": "Max", "xHigh": "xHigh", "High": "High", None: ""}
SCAFFOLDS = {
    "Claude Code": ("claude-code", {"key": "claude-code-harness", "label": "Claude Code harness", "kind": "harness"}),
    "Codex CLI": ("codex-cli", {"key": "codex-harness", "label": "Codex harness", "kind": "harness"}),
    "OpenCode": ("opencode", {"key": "opencode-harness", "label": "OpenCode harness", "kind": "harness"}),
    "Cursor CLI": ("cursor-cli", {"key": "cursor-cli-harness", "label": "Cursor CLI harness", "kind": "harness"}),
}


def main(database):
    db = sqlite3.connect(database)
    family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = 'posttrainbench'").fetchone()))
    existing = {row[0] for row in db.execute(
        "SELECT v.version FROM benchmark_versions v JOIN benchmarks b ON b.id = v.benchmark_id WHERE b.slug = 'posttrainbench'")}
    data = json.loads((HERE / "extracted.json").read_text())
    archives = dict(line.split() for line in (HERE / "archives.txt").read_text().splitlines())
    results, mapping, versions = [], [], {}
    for release_key, (label, release) in RELEASES.items():
        for agent, score in data[release_key]["aggregatedScores"].items():
            info = data["agentInfo"].get(agent, {})
            row = {"results_version": release_key, "agent": agent, "avg": score["avg"], "n": score["n"],
                   "scaffold": info.get("scaffold"), "effort": info.get("reasoningEffort")}
            mapping.append(row)
            if agent in FALLBACK or data[release_key]["fallback"].get(agent):
                row["status"] = "held: score includes cells another model answered (page note)"
                continue
            if agent not in MODELS:
                row["status"] = "held: external entry or model not in Registry"
                continue
            if info.get("reasoningEffort") not in LABELS or info.get("scaffold") not in SCAFFOLDS:
                row["status"] = "held: effort or scaffold not mapped"
                continue
            slug_part, config = SCAFFOLDS[info["scaffold"]]
            version = f"{label} — {info['scaffold']}"
            version_slug = f"{label}-{slug_part}"
            if version not in existing:
                versions[version] = (version_slug, release, label, config)
            row["status"] = "included"
            results.append({"operation": "result", "record": {
                "model_registry_no": MODELS[agent], "reasoning_level": LABELS[info.get("reasoningEffort")],
                "benchmark_slug": "posttrainbench", "benchmark_version": version,
                "metric_key": "posttrainbench-weighted-score", "source_has_single_run": True,
                "score_value": str(score["avg"]), "score_raw": str(score["avg"]),
                "reported_at": REPORTED, "reported_precision": "date", "evaluator_keys": ["posttrainbench-team"],
                "source_type": "Benchmark leaderboard", "publisher": "PostTrainBench",
                "reporting_basis": "independent",
                "source_archive_url": archives["https://posttrainbench.com/"],
                "sources": [
                    {"url": PAGE, "checked_at": CHECKED, "primary": True},
                    {"url": "https://posttrainbench.com/scores-v1.2.js" if release_key == "v1.2"
                     else "https://posttrainbench.com/scores.js",
                     "checked_at": CHECKED, "primary": False, "same_run": True},
                ],
            }})
    records = [{"operation": "benchmark", "record": {
        "slug": "posttrainbench", **family, "aliases": [], "evaluators": [], "metrics": [],
        "versions": [{"version": version, "version_slug": version_slug, "release_at": release,
                      "release_precision": "date", "metric_key": "posttrainbench-weighted-score",
                      "source_url": PAGE, "source_checked_at": CHECKED, "evaluator_keys": ["posttrainbench-team"]}
                     for version, (version_slug, release, _, _) in sorted(versions.items())],
    }}]
    records += [{"operation": "benchmark_version_configuration", "record": {
        "benchmark_slug": "posttrainbench", "version": version, "version_slug": version_slug,
        "dataset_label": label, "configuration": config, "source_url": PAGE, "source_checked_at": CHECKED,
    }} for version, (version_slug, _, label, config) in sorted(versions.items())]
    records += results
    out = ROOT / "data" / "batches" / "evaluator-posttrainbench-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
