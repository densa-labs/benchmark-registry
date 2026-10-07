#!/usr/bin/env python3
"""Build the second Scale AI batch: SWE Atlas Codebase QnA and Refactoring, and
Humanity's Last Exam (text only).

boards.json holds the entries embedded in each leaderboard page, fetched live
on 2026-10-07, and in the Wayback snapshot saved for this batch; both copies
show the same scores. Board model strings name the harness in brackets and the
effort after it, e.g. "Opus 4.8 (Claude Code) xhigh".

Usage: build_batch.py <local replay database>
"""
import json
import re
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T13:50:00Z"
EVALUATOR = "scale-ai"

ATLAS_MODELS = {
    "opus5": "20014", "fable5.1": "20004", "gpt6astra": "10005", "opus4.8": "20011",
    "glm5.2": "150004", "gemini3.8flash": "30004", "gpt5.6sol": "10010", "gpt5.5": "10008",
    "musespark1.1": "80002", "gpt5.4": "10007", "opus4.7": "20010", "fable5": "20012",
    "opus4.6": "20008", "gpt5.3": "10006", "sonnet4.6": "20009", "deepseekv4pro": "110002",
    "glm5": "150002", "gemini3.1pro": "30005", "kimik2.5": "120001", "minimaxm2.5": "140001",
    "gemini3flash": "30009",
}
HARNESSES = {
    "claude code": ("Claude Code", "claude-code", {"key": "claude-code-harness", "label": "Claude Code harness", "kind": "harness"}),
    "codex": ("Codex", "codex", {"key": "codex-harness", "label": "Codex harness", "kind": "harness"}),
    "mini-swe-agent": ("mini-swe-agent", "mini-swe-agent", {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"}),
    "mini-swe": ("mini-swe-agent", "mini-swe-agent", {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"}),
    "gemini cli": ("Gemini CLI", "gemini-cli", {"key": "gemini-cli-harness", "label": "Gemini CLI harness", "kind": "harness"}),
}
ATLAS = {
    "sweatlas-qna": ("Codebase QnA — Public; {harness}", "codebase-qna-public-{slug}", "Codebase QnA — Public",
                     "2026-03-04", "https://scale.com/blog/swe-atlas"),
    "sweatlas-refactoring": ("Refactoring — {harness}", "refactoring-{slug}", "Refactoring",
                             "2026-05-07", "https://scale.com/blog/swe-atlas-complete"),
}
HLE_TEXT = {
    "GPT 6 Astra": ("10005", ""),
    "gemini-3.1-pro-preview (thinking high)": ("30005", "thinking high"),
    "Fable 5.1 (xhigh)": ("20004", "xhigh"),
    "Gemini 3.8 Flash": ("30004", ""),
    "Muse Spark": ("80001", ""),
    "gemini-3-pro-preview": ("30008", ""),
    "gpt-5.4-2026-03-05 (xhigh thinking)": ("10007", "xhigh thinking"),
    "claude-opus-4-6-thinking-max": ("20008", "thinking-max"),
    "gpt-5.2-2025-12-11": ("10012", ""),
    "claude-opus-4-5-20251101-thinking": ("20007", "thinking"),
    "o3 (high) (April 2025)": ("10003", "high"),
    "o3 (medium) (April 2025)": ("10003", "medium"),
    "claude-opus-4-6 (Non-Thinking)": ("20008", "Non-Thinking"),
    "o4-mini (high) (April 2025)": ("10004", "high"),
    "Gemini 2.5 Pro Experimental (March 2025)": ("30002", ""),
    "gpt-oss-120b": ("15001", ""),
    "o4-mini (medium) (April 2025)": ("10004", "medium"),
    "claude-sonnet-4-5-20250929-thinking": ("20005", "thinking"),
    "claude-opus-4-5-20251101": ("20007", ""),
    "Gemini 2.5 Flash (April 2025)": ("30003", ""),
    "Claude Opus 4 (Thinking)": ("20002", "Thinking"),
    "Claude 3.7 Sonnet (Thinking)": ("20001", "Thinking"),
    "Claude Sonnet 4 (Thinking)": ("20003", "Thinking"),
    "claude-sonnet-4-5-20250929": ("20005", ""),
    "Claude Opus 4": ("20002", ""),
    "Claude Sonnet 4": ("20003", ""),
    "GPT 4.5 Preview": ("10001", ""),
    "GPT-4.1": ("10002", ""),
    "claude-opus-4-7": ("20010", ""),
    "kimi-k2.5": ("120001", ""),
}
EFFORT = {"xhigh": "xhigh", "xHigh": "xHigh", "high": "high", "max": "max"}


def parse_atlas(name):
    """'Opus 4.8 (Claude Code) xhigh' -> ('opus4.8', 'claude code', 'xhigh')."""
    name = name.strip().rstrip("*").strip()
    match = re.fullmatch(r"(.+?)\s*\(([^)]+)\)\s*(\S+)?", name) or re.fullmatch(
        r"(.+?)\s+(\S+)\s*\(([^)]+)\)", name)
    if not match:
        return None
    if match.re.pattern.startswith("(.+?)\\s*\\("):
        model, harness, effort = match.group(1), match.group(2), match.group(3)
    else:
        model, effort, harness = match.group(1), match.group(2), match.group(3)
    words = model.split()
    if not effort and words[-1] in EFFORT:
        model, effort = " ".join(words[:-1]), words[-1]
    key = re.sub(r"[\s-]", "", model.lower())
    return key, harness.lower(), effort


def reported(url):
    stamp = url.split("/web/")[1][:8]
    return f"{stamp[:4]}-{stamp[4:6]}-{stamp[6:]}"


def result(registry_no, level, slug, version, metric, entry, page):
    return {"operation": "result", "record": {
        "model_registry_no": registry_no, "reasoning_level": level, "benchmark_slug": slug,
        "benchmark_version": version, "metric_key": metric, "source_has_single_run": True,
        "score_value": format(entry["score"], "f").rstrip("0").rstrip(".") if isinstance(entry["score"], float) else str(entry["score"]),
        "score_raw": str(entry["score"]), "reported_at": reported(page["wayback"]["url"]),
        "reported_precision": "date", "evaluator_keys": [EVALUATOR], "source_type": "Benchmark leaderboard",
        "publisher": "Scale AI", "reporting_basis": "independent",
        "source_archive_url": page["wayback"]["url"],
        "sources": [{"url": page["live"]["url"], "checked_at": CHECKED, "primary": True}],
    }}


def main(database):
    db = sqlite3.connect(database)
    families = {slug: dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = ?", (slug,)).fetchone()))
        for slug in ("swe-atlas", "humanitys-last-exam")}
    existing = {row[0] for row in db.execute(
        "SELECT v.version FROM benchmark_versions v JOIN benchmarks b ON b.id = v.benchmark_id WHERE b.slug = 'swe-atlas'")}
    boards = json.loads((HERE / "boards.json").read_text())
    results, mapping, versions = [], [], {}
    for page_key, (label, slug_pattern, dataset, release, release_source) in ATLAS.items():
        page = boards[page_key]
        for entry in page["live"]["entries"]:
            row = {"board": page_key, "model": entry["model"].strip(), "score": entry["score"]}
            mapping.append(row)
            parsed = parse_atlas(entry["model"])
            if not parsed or parsed[1] not in HARNESSES:
                row["status"] = "held: harness not stated or not mapped"
                continue
            key, harness, effort = parsed
            if key not in ATLAS_MODELS:
                row["status"] = "held: model not in Registry"
                continue
            if effort and effort not in EFFORT:
                row["status"] = f"held: effort {effort!r} not mapped"
                continue
            name, harness_slug, config = HARNESSES[harness]
            version = label.format(harness=name)
            versions.setdefault(version, (slug_pattern.format(slug=harness_slug), dataset, release,
                                          release_source, config, page["live"]["url"]))
            row["status"] = "included"
            results.append(result(ATLAS_MODELS[key], EFFORT.get(effort, ""), "swe-atlas", version,
                                  "swe-atlas-pass-at-1", entry, page))
    page = boards["humanitys_last_exam_text_only"]
    for entry in page["live"]["entries"]:
        name = entry["model"].strip()
        row = {"board": "humanitys_last_exam_text_only", "model": name, "score": entry["score"]}
        mapping.append(row)
        if name not in HLE_TEXT:
            row["status"] = "held: model not in Registry or identity unsettled"
            continue
        row["status"] = "included"
        results.append(result(*HLE_TEXT[name], "humanitys-last-exam", "Text only — Scale AI evaluation",
                              "hle-accuracy", entry, page))
    new_atlas = {v: d for v, d in versions.items() if v not in existing}
    records = [
        {"operation": "benchmark", "record": {
            "slug": "swe-atlas", **families["swe-atlas"], "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": version, "version_slug": version_slug, "release_at": release,
                "release_precision": "date", "metric_key": "swe-atlas-pass-at-1", "source_url": source,
                "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            } for version, (version_slug, _, release, source, _, _) in sorted(new_atlas.items())],
        }},
        {"operation": "benchmark", "record": {
            "slug": "humanitys-last-exam", **families["humanitys-last-exam"], "aliases": [], "evaluators": [],
            "metrics": [], "versions": [{
                "version": "Text only — Scale AI evaluation", "version_slug": "text-only-scale-ai",
                "release_at": "2025-04-03", "release_precision": "date", "metric_key": "hle-accuracy",
                "source_url": "https://labs.scale.com/leaderboard/humanitys_last_exam_text_only",
                "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            }],
        }},
        *[{"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "swe-atlas", "version": version, "version_slug": version_slug,
            "dataset_label": dataset, "configuration": config, "source_url": page_url,
            "source_checked_at": CHECKED,
        }} for version, (version_slug, dataset, _, _, config, page_url) in sorted(new_atlas.items())],
        *results,
    ]
    out = ROOT / "data" / "batches" / "evaluator-scale-atlas-hle-text-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
