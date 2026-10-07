#!/usr/bin/env python3
"""Build the Mercor APEX batch from Mercor's own benchmark runs.

pages/<board>.json holds the leaderboard data embedded in each
mercor.com/apex leaderboard page (fetched 2026-10-07) and methodology.json the
"How Mercor runs benchmarks" table (harness, runs, metric per benchmark).
archives.json maps each page to the Wayback snapshot saved for this batch.
Mercor runs every model itself: rows are independent, evaluator mercor.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:20:00Z"
REPORTED = "2026-10-07"
EVALUATOR = "mercor"

# board -> (family, base version for release date and metric, new version label, slug,
#           dataset label, configuration)
SINGLE_SHOT = {"key": "mercor-single-shot", "label": "Mercor single-shot agent", "kind": "harness"}
BOARDS = {
    "oss-gpqa-diamond-leaderboard": ("gpqa", "Diamond", "Diamond — Mercor single-shot", "diamond-mercor",
                                     "Diamond", SINGLE_SHOT),
    "oss-hle-leaderboard": ("humanitys-last-exam", None, "Text only — Mercor single-shot", "text-only-mercor",
                            "Text only", SINGLE_SHOT),
    "oss-swe-bench-verified-leaderboard": ("swe-bench", "Verified", "Verified — Mercor mini-swe-agent, 1000 steps",
                                           "verified-mercor-mini-swe-agent", "Verified",
                                           {"key": "mercor-mini-swe-agent-1000-steps", "label": "Mercor mini-swe-agent, 1000 steps, 3 hours", "kind": "harness"}),
    "oss-swe-bench-multilingual-leaderboard": ("swe-bench", "Multilingual",
                                               "Multilingual — Mercor mini-swe-agent, 1000 steps",
                                               "multilingual-mercor-mini-swe-agent", "Multilingual",
                                               {"key": "mercor-mini-swe-agent-1000-steps", "label": "Mercor mini-swe-agent, 1000 steps, 3 hours", "kind": "harness"}),
    "oss-terminal-bench-2-1-leaderboard": ("terminal-bench", "2.1", "2.1 — Mercor Terminus 2", "2.1-mercor-terminus-2",
                                           "2.1", {"key": "mercor-terminus-2", "label": "Mercor Terminus 2, 1000 steps, 3 hours", "kind": "harness"}),
    "oss-terminal-bench-4-0-leaderboard": ("terminal-bench", "4.0", "4.0 — Mercor mini-swe-agent", "4.0-mercor-mini-swe-agent",
                                           "4.0", {"key": "mercor-mini-swe-agent-8-hours", "label": "Mercor mini-swe-agent, 1000 steps, 8 hours", "kind": "harness"}),
    "oss-mmmu-pro-leaderboard": ("mmmu-pro", "No tools", "1,730 questions — Mercor single-shot", "1730-mercor",
                                 None, SINGLE_SHOT),
    "oss-mmlu-pro-leaderboard": ("mmlu-pro", "Original", "Original — Mercor single-shot", "original-mercor",
                                 "Original", SINGLE_SHOT),
    "oss-charxiv-leaderboard": ("charxiv", "Reasoning — No tools", "Descriptive and reasoning — Mercor single-shot",
                                "descriptive-reasoning-mercor", None, SINGLE_SHOT),
    "oss-deep-swe-leaderboard": ("deep-swe", "1.1", "1.1 — Mercor mini-swe-agent, 500 steps", "1.1-mercor-mini-swe-agent",
                                 "1.1", {"key": "mercor-mini-swe-agent-500-steps", "label": "Mercor mini-swe-agent, 500 steps, 2 hours", "kind": "harness"}),
    "oss-browsecomp-leaderboard": ("browsecomp", "BrowseComp", "130-question subset — Mercor web research agent",
                                   "130-question-subset-mercor", None,
                                   {"key": "mercor-web-research-agent", "label": "Mercor web research agent, 100 steps, 3 hours", "kind": "tools"}),
    "oss-medxpertqa-mm-leaderboard": ("medxpertqa", "MM", "MM — Mercor single-shot", "mm-mercor", "MM", SINGLE_SHOT),
    "oss-swe-atlas-leaderboard": ("swe-atlas", "Codebase QnA — Public; mini-swe-agent",
                                  "Codebase QnA — Mercor mini-swe-agent, 250 steps", "codebase-qna-mercor-mini-swe-agent",
                                  "Codebase QnA", {"key": "mercor-mini-swe-agent-250-steps", "label": "Mercor mini-swe-agent, 250 steps, 1 hour", "kind": "harness"}),
    "apex-agents-leaderboard": ("apex-agents", "Original", "Original", None, None, None),
}
HLE_TEXT_RELEASE = ("2025-04-03", "hle-accuracy")
MODELS = {
    "Qwen3.5-397B-A17B": "130003", "claude-fable-5": "20012", "claude-fable-5-high": "20012",
    "claude-fable-5.1": "20004", "claude-fable-5.1-high": "20004", "claude-opus-4-6-max": "20008",
    "claude-opus-4-7": "20010", "claude-opus-4-7-high": "20010", "claude-opus-4-8": "20011",
    "claude-opus-4-8-high": "20011", "claude-opus-5": "20014", "claude-opus-5-high": "20014",
    "claude-opus-5-xhigh": "20014", "claude-opus-5-5": "20015", "opus-5.5": "20015",
    "claude-sonnet-4-6-high": "20009", "claude-sonnet-4-6-medium": "20009", "claude-sonnet-5": "20013",
    "claude-sonnet-5-max": "20013", "claude-sonnet-5-5": "20016", "claude-sonnet-5-5-medium": "20016",
    "deepseek-v4-pro": "110002", "gemini-3.1-pro-preview-high": "30005", "gemini-3.5-flash": "30006",
    "gemini-3.6-flash": "30007", "gemini-3.7-flash": "30010", "gemini-3.8-flash": "30004",
    "gemini-4-argon": "30011", "gemma-4-31B": "35002", "glm-5-1": "150003", "glm-5-2": "150004",
    "glm-5-3": "150005", "glm-5-3-flash": "150006", "zai-org/GLM-5": "150002",
    "gpt-5-6-sol-max": "10010", "gpt-5-6-sol-xhigh": "10010", "gpt-5.5-xhigh": "10008",
    "gpt-5.6-luna-max": "10009", "gpt-5.6-terra-max": "10011", "gpt-6-1-sol": "10015",
    "gpt-6-astra": "10005", "gpt-6-astra-max": "10005", "gpt-6-luna": "10013", "gpt-6-sol": "10014",
    "grok-4-5": "40001", "grok-4-6": "40002", "grok-4-6-xhigh": "40002", "grok-4.7": "40003",
    "inkling": "160001", "kimi-k3": "120003", "minimax-m2-7": "140002", "minimax-m3": "140003",
    "muse-spark-1-1": "80002", "muse-spark-1-2": "80003", "muse-spark-1-3": "80005",
    "muse-spark-1-3-max": "80005", "nemotron-3-ultra-nvfp4": "60003", "openai/gpt-oss-120b": "15001",
    "qwen-3-8-max-xhigh": "130008", "responses/gpt-5.4": "10007",
}
EFFORTS = {"max", "xhigh", "high", "medium", "low", "none"}


def score_of(entry):
    value = entry["score"]["pass-1"]
    if isinstance(value, dict):
        return value.get("loop_truncated_tools_agent")
    return value


def canonical(value):
    text = format(Decimal(str(value)), "f")
    return text.rstrip("0").rstrip(".") if "." in text else text


def main(database):
    db = sqlite3.connect(database)
    archives = json.loads((HERE / "archives.json").read_text())
    results, mapping, versions = [], [], {}
    for board, (slug, base, version, version_slug, dataset, config) in BOARDS.items():
        page = json.loads((HERE / "pages" / f"{board}.json").read_text())
        if base:
            release, metric = db.execute(
                """SELECT v.release_at, m.key FROM benchmark_versions v JOIN benchmarks b ON b.id = v.benchmark_id
                   JOIN metrics m ON m.id = v.metric_id WHERE b.slug = ? AND v.version = ?""", (slug, base)).fetchone()
        else:
            release, metric = HLE_TEXT_RELEASE
        seen = {}
        archived = page.get("archived_model_ids")
        for entry in page["leaderboardData"]:
            registry_no = MODELS.get(entry["model_id"])
            effort = entry.get("effort")
            row = {"board": board, "model_id": entry["model_id"], "model_name": entry["model_name"],
                   "effort": effort, "score": score_of(entry), "registry_no": registry_no}
            mapping.append(row)
            if archived is not None and entry["model_id"] not in archived:
                row["status"] = "held: row missing from the Wayback snapshot of the page"
                continue
            if effort not in EFFORTS and effort is not None:
                row["status"] = f"held: effort {effort!r} not on the fixed vocabulary"
                continue
            if not registry_no:
                row["status"] = "held: model not in Registry or build not shown to be the Registry model"
                continue
            if row["score"] is None:
                row["status"] = "held: no Pass@1 score for the canonical harness"
                continue
            key = (registry_no, effort or "")
            if key in seen:
                row["status"] = f"held: two entries for the same model and effort ({seen[key]})"
                continue
            seen[key] = entry["model_id"]
            row["status"] = "included"
            if version_slug:
                versions[(slug, version)] = (version_slug, release, metric, dataset, config, page["url"])
            results.append({"operation": "result", "record": {
                "model_registry_no": registry_no, "reasoning_level": effort or "", "benchmark_slug": slug,
                "benchmark_version": version, "metric_key": metric, "source_has_single_run": True,
                "score_value": canonical(row["score"]), "score_raw": f"{row['score']}%",
                "reported_at": REPORTED, "reported_precision": "date", "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark leaderboard", "publisher": "Mercor", "reporting_basis": "independent",
                "source_archive_url": archives[board],
                "sources": [{"url": page["url"], "checked_at": CHECKED, "primary": True}],
            }})
    families = {}
    for (slug, version), (version_slug, release, metric, _, _, url) in sorted(versions.items()):
        families.setdefault(slug, []).append({
            "version": version, "version_slug": version_slug, "release_at": release, "release_precision": "date",
            "metric_key": metric, "source_url": url, "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR]})
    records = []
    for slug, items in families.items():
        family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
            "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = ?", (slug,)).fetchone()))
        records.append({"operation": "benchmark", "record": {
            "slug": slug, **family, "aliases": [], "evaluators": [], "metrics": [], "versions": items}})
    records += [{"operation": "benchmark_version_configuration", "record": {
        "benchmark_slug": slug, "version": version, "version_slug": version_slug, "dataset_label": dataset,
        "configuration": config, "source_url": "https://www.mercor.com/apex/methodology/",
        "source_checked_at": CHECKED,
    }} for (slug, version), (version_slug, _, _, dataset, config, _) in sorted(versions.items())]
    records += results
    out = ROOT / "data" / "batches" / "evaluator-mercor-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    counts = {}
    for row in mapping:
        counts[row["status"].split(":")[0]] = counts.get(row["status"].split(":")[0], 0) + 1
    print(len(results), "results;", counts, file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
