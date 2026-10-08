#!/usr/bin/env python3
"""Build the Terminal-Bench 4.0 leaderboard batch from board.json.

board.json holds the leaderboard entries embedded in https://www.tbench.ai/ as
fetched live on 2026-10-07 and in the Wayback Machine snapshot saved the same
day. An entry is used only when both copies have the same id and accuracy.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T11:40:00Z"
EVALUATOR = "terminal-bench-team"
NEWS = "https://www.tbench.ai/news/terminal-bench-4-0"

MODELS = {
    "Opus 5.5": "20015", "Sonnet 5.5": "20016", "Fable 5.1": "20004", "Opus 5": "20014",
    "Fable 5": "20012", "Opus 4.8": "20011", "Sonnet 5": "20013",
    "GPT-6 Astra": "10005", "GPT-6.1 Sol": "10015", "GPT-6 Sol": "10014", "GPT-6 Luna": "10013",
    "GPT-5.6 Sol": "10010", "GPT-5.6 Terra": "10011", "GPT-5.6 Luna": "10009",
    "GLM-5.3": "150005", "GLM-5.3-Flash": "150006",
    "Grok 4.7": "40003", "Grok 4.6": "40002", "Grok 4.5": "40001",
    "Gemini 3.8 Flash": "30004", "Gemini 3.7 Flash": "30010",
    "Muse Spark 1.3": "80005",
}
# Agent label -> (version label, version slug, configuration)
AGENTS = {
    "Claude Code": ("4.0 — Claude Code", "4.0-claude-code",
                    {"key": "claude-code-harness", "label": "Claude Code harness", "kind": "harness"}),
    "Codex": ("4.0 — Codex", "4.0-codex",
              {"key": "codex-harness", "label": "Codex harness", "kind": "harness"}),
    "Grok Build": ("4.0 — Grok Build", "4.0-grok-build",
                   {"key": "grok-build-harness", "label": "Grok Build harness", "kind": "harness"}),
    "mini-SWE-agent": ("4.0 — mini-swe-agent", "4.0-mini-swe-agent",
                       {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"}),
    "Muse Code": ("4.0 — Muse Code", "4.0-muse-code",
                  {"key": "muse-code-harness", "label": "Muse Code harness", "kind": "harness"}),
}


def canonical(value):
    text = format(value, "f") if isinstance(value, float) else str(value)
    return text.rstrip("0").rstrip(".") if "." in text else text


def main():
    board = json.loads((HERE / "board.json").read_text())
    archived = {e["id"]: e["metrics"]["accuracy"] for e in board["wayback"]["entries"]}
    results, mapping, used = [], [], {}
    for entry in board["live"]["entries"]:
        meta = entry["metadata"]
        model, agent = meta["model_display"]["label"], meta["agent_display"]["label"]
        score = canonical(entry["metrics"]["accuracy"])
        row = {"id": entry["id"], "model": model, "agent": agent, "date": meta["date"],
               "reasoning_effort": meta.get("reasoning_effort"), "score": score,
               "n_trials": entry["n_trials"], "registry_no": MODELS.get(model)}
        mapping.append(row)
        if archived.get(entry["id"]) != entry["metrics"]["accuracy"]:
            row["status"] = "held: archive snapshot differs"
            continue
        if not row["registry_no"]:
            row["status"] = "held: model not in Registry or identity unsettled"
            continue
        version, _, _ = AGENTS[agent]
        used[agent] = AGENTS[agent]
        row["status"] = "included"
        results.append({"operation": "result", "record": {
            "model_registry_no": row["registry_no"],
            "reasoning_level": meta.get("reasoning_effort") or "",
            "benchmark_slug": "terminal-bench",
            "benchmark_version": version,
            "metric_key": "terminal-bench-accuracy",
            "run_ref": f"tbench-leaderboard:{entry['id']}",
            "score_value": score,
            "score_raw": str(entry["metrics"]["accuracy"]),
            "reported_at": meta["date"],
            "reported_precision": "date",
            "evaluator_keys": [EVALUATOR],
            "source_type": "Benchmark leaderboard",
            "publisher": "Terminal-Bench",
            "reporting_basis": "independent",
            "source_archive_url": board["wayback"]["url"],
            "sources": [{"url": board["live"]["url"], "checked_at": CHECKED, "primary": True}],
        }})
    versions = [used[a] for a in sorted(used)]
    records = [
        {"operation": "benchmark", "record": {
            "canonical_name": "Terminal-Bench", "slug": "terminal-bench",
            "source_url": "https://www.tbench.ai/", "source_checked_at": "2026-09-18T13:23:42Z",
            "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": version, "version_slug": slug, "release_at": "2026-08-28",
                "release_precision": "date", "metric_key": "terminal-bench-accuracy",
                "source_url": NEWS, "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            } for version, slug, _ in versions],
        }},
        *[{"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "terminal-bench", "version": version, "version_slug": slug,
            "dataset_label": "4.0", "configuration": config,
            "source_url": board["live"]["url"], "source_checked_at": CHECKED,
        }} for version, slug, config in versions],
        *results,
    ]
    out = ROOT / "data" / "batches" / "evaluator-terminal-bench-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results;", sum(r["status"] != "included" for r in mapping), "held", file=sys.stderr)


if __name__ == "__main__":
    main()
