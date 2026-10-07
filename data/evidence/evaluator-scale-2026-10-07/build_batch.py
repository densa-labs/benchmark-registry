#!/usr/bin/env python3
"""Build the Scale AI SEAL batch (SWE-Bench Pro, Humanity's Last Exam, MCP Atlas).

Input: boards.json in this folder, the leaderboard entries embedded in each page
as fetched live on 2026-10-07 and in the Wayback Machine snapshot used as the
archive. A row is used only when both copies show the same score.
Writes data/batches/evaluator-scale-2026-10-07.json and mapping.json here.
"""
import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T11:50:00Z"
EVALUATOR = "scale-ai"

# Board model string -> (Registry No., reasoning label exactly as shown).
# None marks a model that is not in the Registry or whose identity is not settled.
SWE_PRO = {
    "Muse Spark 1.1*": ("80002", ""),
    "gpt-5.4 (xHigh)*": ("10007", "xHigh"),
    "gpt-5.4(xHigh)*": ("10007", "xHigh"),
    "Muse Spark*": ("80001", ""),
    "claude-opus-4-6 (thinking)*": ("20008", "thinking"),
    "gemini-3.1-pro (thinking)*": ("30005", "thinking"),
    "claude-opus-4-5-20251101": ("20007", ""),
    "Opus 4.5": ("20007", ""),
    "claude-4-5-Sonnet": ("20005", ""),
    "gemini-3-pro-preview": ("30008", ""),
    "Gemini 3 Pro": ("30008", ""),
    "claude-4-Sonnet": ("20003", ""),
    "Claude Sonnet 4": ("20003", ""),
    "claude-4-5-haiku": ("20006", ""),
    "gemini-3-flash": ("30009", ""),
    "gpt-5.2": ("10012", ""),
    "GPT 5.2": ("10012", ""),
    "gpt-oss-120b": ("15001", ""),
}
HLE = {
    "GPT 6 Astra": ("10005", ""),
    "Fable 5.1 (xhigh)": ("20004", "xhigh"),
    "gemini-3.1-pro-preview (thinking high)": ("30005", "thinking high"),
    "Gemini 3.8 Flash": ("30004", ""),
    "Muse Spark": ("80001", ""),
    "gemini-3-pro-preview": ("30008", ""),
    "gpt-5.4-2026-03-05 (xhigh thinking)": ("10007", "xhigh thinking"),
    "claude-opus-4-7": ("20010", ""),
    "claude-opus-4-6-thinking-max": ("20008", "thinking-max"),
    "gpt-5.2-2025-12-11": ("10012", ""),
    "claude-opus-4-5-20251101-thinking": ("20007", "thinking"),
    "kimi-k2.5": ("120001", ""),
    "Gemini 2.5 Pro Experimental (March 2025)": ("30002", ""),
    "o3 (high) (April 2025)": ("10003", "high"),
    "o3 (medium) (April 2025)": ("10003", "medium"),
    "claude-opus-4-6 (Non-Thinking)": ("20008", "Non-Thinking"),
    "o4-mini (high) (April 2025)": ("10004", "high"),
    "o4-mini (medium) (April 2025)": ("10004", "medium"),
    "claude-opus-4-5-20251101": ("20007", ""),
    "claude-sonnet-4-5-20250929-thinking": ("20005", "thinking"),
    "Gemini 2.5 Flash (April 2025)": ("30003", ""),
    "Claude Opus 4 (Thinking)": ("20002", "Thinking"),
    "Claude 3.7 Sonnet (Thinking)": ("20001", "Thinking"),
    "Claude Sonnet 4 (Thinking)": ("20003", "Thinking"),
    "claude-sonnet-4-5-20250929": ("20005", ""),
    "Claude Opus 4": ("20002", ""),
    "Claude Sonnet 4": ("20003", ""),
    "GPT 4.5 Preview": ("10001", ""),
    "GPT-4.1": ("10002", ""),
}
MCP = {
    "Muse Spark 1.1": ("80002", ""),
    "Fable 5.1": ("20004", ""),
    "claude-opus-5 (xhigh)": ("20014", "xhigh"),
    "GLM 5.3": ("150005", ""),
    "Gemini 3.5 Flash (high)": ("30006", "high"),
    "Claude Fable 5": ("20012", ""),
    "kimi-k3 (max)": ("120003", "max"),
    "claude-opus-4-8 (max)": ("20011", "max"),
    "Muse Spark": ("80001", ""),
    "gpt-5.6 (sol)": ("10010", "sol"),
    "Inkling-small": ("160002", ""),
    "claude-opus-4-7 (max)": ("20010", "max"),
    "gemini-3.1-pro-preview (high)": ("30005", "high"),
    "glm-5p2": ("150004", ""),
    "claude-opus-4-6 (max)": ("20008", "max"),
    "Inkling (xHigh)": ("160001", "xHigh"),
    "glm-5p1": ("150003", ""),
    "gpt-5.5 (xhigh)": ("10008", "xhigh"),
    "gpt-5.4 (xhigh)": ("10007", "xhigh"),
    "gemini-3-pro-preview": ("30008", ""),
    "claude-opus-4-5 (high)": ("20007", "high"),
    "claude-sonnet-4-6": ("20009", ""),
    "gpt-5.2 (xhigh)": ("10012", "xhigh"),
    "kimi-k2p5": ("120001", ""),
    "Nemotron 3 Ultra (thinking)": ("60003", "thinking"),
    "gemini-3-flash-preview": ("30009", ""),
    "claude-sonnet-4-5 (thinking)": ("20005", "thinking"),
    "glm-4p7": ("150001", ""),
    "claude-haiku-4-5": ("20006", ""),
}

SWE_PRO_PAGE = "https://labs.scale.com/leaderboard/swe_bench_pro"
BOARDS = [
    # board, variant, entry filter, mapping, benchmark, version, metric, decimals
    ("swe_bench_pro", "public", lambda m: m.endswith("*"), SWE_PRO, "swe-bench-pro",
     "Public — Scale AI mini-swe-agent", "swe-bench-pro-resolved"),
    ("swe_bench_pro", "public", lambda m: not m.endswith("*"), SWE_PRO, "swe-bench-pro",
     "Public — Scale AI SWE-Agent", "swe-bench-pro-resolved"),
    ("swe_bench_pro", "private", lambda m: m.endswith("*"), SWE_PRO, "swe-bench-pro",
     "Private — Scale AI mini-swe-agent", "swe-bench-pro-resolved"),
    ("swe_bench_pro", "private", lambda m: not m.endswith("*"), SWE_PRO, "swe-bench-pro",
     "Private — Scale AI SWE-Agent", "swe-bench-pro-resolved"),
    ("humanitys_last_exam", "default", lambda m: True, HLE, "humanitys-last-exam",
     "Full set — Scale AI evaluation", "hle-accuracy"),
    ("mcp_atlas", "default", lambda m: True, MCP, "mcp-atlas",
     "Public, April 2026 update", "mcp-atlas-pass-rate"),
]


def canonical(value):
    text = format(value, "f") if isinstance(value, float) else str(value)
    return text.rstrip("0").rstrip(".") if "." in text else text


def existing_mcp(database):
    """Existing MCP Atlas rows, keyed by (Registry No., reasoning label)."""
    if not database:
        raise SystemExit("pass the local replay database path to check MCP Atlas rows")
    rows = sqlite3.connect(database).execute(
        """SELECT m.registry_no, r.reasoning_level, r.score_value, r.result_key
        FROM results r JOIN models m ON m.id = r.model_id
        JOIN benchmark_versions v ON v.id = r.benchmark_version_id
        JOIN benchmarks b ON b.id = v.benchmark_id WHERE b.slug = 'mcp-atlas'"""
    )
    return {(no, level.lower()): (score, key) for no, level, score, key in rows}


def main(database=None):
    boards = json.loads((HERE / "boards.json").read_text())
    mcp_rows = existing_mcp(database)
    results, mapping = [], []
    for board, variant, wanted, models, slug, version, metric in BOARDS:
        page = boards[board]
        live = page["live"]["entries"][variant]
        archived = {e["model"].strip(): e["score"] for e in page["wayback"]["entries"][variant]}
        reported = page["wayback"]["url"].split("/web/")[1][:8]
        reported = f"{reported[:4]}-{reported[4:6]}-{reported[6:]}"
        for entry in live:
            name = entry["model"].strip()
            if not wanted(name):
                continue
            target = models.get(name)
            score = canonical(entry["score"])
            row = {"board": board, "variant": variant, "version": version, "model": name,
                   "score": score, "registry_no": target and target[0],
                   "reasoning_level": target and target[1]}
            mapping.append(row)
            if archived.get(name) != entry["score"]:
                row["status"] = "held: archive snapshot shows a different score"
                continue
            if not target:
                row["status"] = "held: model not in Registry or identity unsettled"
                continue
            registry_no, level = target
            if slug == "mcp-atlas":
                known = mcp_rows.get((registry_no, level.lower()))
                if known and known[0] == score:
                    row["status"] = f"skipped: unchanged from {known[1]}"
                    continue
                if known:
                    row["status"] = "held: changed score, needs supersedes review"
                    continue
            row["status"] = "included"
            results.append({"operation": "result", "record": {
                "model_registry_no": registry_no,
                "reasoning_level": level,
                "benchmark_slug": slug,
                "benchmark_version": version,
                "metric_key": metric,
                "source_has_single_run": True,
                "score_value": score,
                "score_raw": str(entry["score"]),
                "reported_at": reported,
                "reported_precision": "date",
                "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark leaderboard",
                "publisher": "Scale AI",
                "reporting_basis": "independent",
                "source_archive_url": page["wayback"]["url"],
                "sources": [{"url": page["live"]["url"], "checked_at": CHECKED, "primary": True}],
            }})
    swe_pro_versions = [
        (f"{split} — Scale AI {harness}", f"{split.lower()}-scale-ai-{key}", split, config)
        for split in ("Public", "Private")
        for harness, key, config in (
            ("SWE-Agent", "swe-agent",
             {"key": "swe-agent-250-turns", "label": "SWE-Agent harness, 250 turns, uncapped cost", "kind": "harness"}),
            ("mini-swe-agent", "mini-swe-agent",
             {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"}),
        )
    ]
    records = [
        {"operation": "benchmark", "record": {
            "canonical_name": "SWE-bench Pro", "slug": "swe-bench-pro",
            **FAMILY["swe-bench-pro"], "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": version, "version_slug": version_slug, "release_at": "2025-09-19",
                "release_precision": "date", "metric_key": "swe-bench-pro-resolved",
                "source_url": SWE_PRO_PAGE, "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            } for version, version_slug, _, _ in swe_pro_versions],
        }},
        {"operation": "benchmark", "record": {
            "canonical_name": "Humanity's Last Exam", "slug": "humanitys-last-exam",
            **FAMILY["humanitys-last-exam"], "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": "Full set — Scale AI evaluation", "version_slug": "full-set-scale-ai",
                "release_at": "2025-04-03", "release_precision": "date", "metric_key": "hle-accuracy",
                "source_url": "https://labs.scale.com/leaderboard/humanitys_last_exam",
                "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            }],
        }},
        *[{"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "swe-bench-pro", "version": version, "version_slug": version_slug,
            "dataset_label": split, "configuration": config,
            "source_url": SWE_PRO_PAGE, "source_checked_at": CHECKED,
        }} for version, version_slug, split, config in swe_pro_versions],
        *results,
    ]
    out = ROOT / "data" / "batches" / "evaluator-scale-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    statuses = {}
    for row in mapping:
        statuses[row["status"].split(":")[0]] = statuses.get(row["status"].split(":")[0], 0) + 1
    print(statuses, file=sys.stderr)


# Family facts exactly as already stored, so the benchmark records only add versions.
FAMILY = {}

if __name__ == "__main__":
    FAMILY.update(json.loads((HERE / "families.json").read_text()))
    main(sys.argv[1] if len(sys.argv) > 1 else None)
