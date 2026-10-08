#!/usr/bin/env python3
"""Build the CWE-bench v1 batch (Collinear AI) from page.html.

page.html is https://cwe-bench.com/ fetched 2026-10-07; the Wayback snapshot in
archive.txt shows the same v1 table. The held-out set "is private to Collinear
and is not available to any external organization", so Collinear runs every
model: rows are independent, evaluator collinear-ai. The page says each model
runs "at high reasoning". Score: programmatic pass@1 (the Registry's metric).

Usage: build_batch.py <local replay database> [page]
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
CHECKED = "2026-10-07T14:27:00Z"
PAGE = "https://cwe-bench.com/"
MODELS = {
    "Grok 4.7": "40003", "Gemini 4 Argon": "30011", "GPT-6 Astra": "10005", "Claude Opus 5.5": "20015",
    "Claude Fable 5.1": "20004", "Grok 4.6": "40002", "Muse Spark 1.3": "80005", "GPT-6 Sol": "10014",
    "Inkling": "160001",
}
HARNESSES = {
    "opencode": ("OpenCode", "opencode", {"key": "opencode-harness", "label": "OpenCode harness", "kind": "harness"}),
    "Codex": ("Codex", "codex", {"key": "codex-harness", "label": "Codex harness", "kind": "harness"}),
    "Claude Code": ("Claude Code", "claude-code", {"key": "claude-code-harness", "label": "Claude Code harness", "kind": "harness"}),
    "Antigravity": ("Antigravity", "antigravity", {"key": "antigravity-harness", "label": "Antigravity harness", "kind": "harness"}),
}


def v1_rows(path):
    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", path.read_text(errors="ignore"), flags=re.DOTALL)
    joined = " | ".join(line.strip() for line in html.unescape(re.sub(r"<[^>]+>", "\n", text)).split("\n")
                        if line.strip())
    start = joined.index("CWE-bench leaderboard | # | Rank | Model | Harness | Programmatic | Judge panel")
    end = joined.index("Sorting.", start)
    rows = re.findall(r"\| (?:T?\d+) \| ([^|]+?) \| ([^|]+?) \| (\d+)% \| (?:\d+%|—) \|", joined[start:end])
    return [(model.replace("\xa0", " "), harness.replace("\xa0", " "), score) for model, harness, score in rows]


def main(database, page=HERE / "page.html"):
    db = sqlite3.connect(database)
    family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = 'cwe-bench'").fetchone()))
    held = db.execute(
        """SELECT m.registry_no, r.score_value FROM results r JOIN models m ON m.id = r.model_id
           JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
           WHERE b.slug = 'cwe-bench' AND r.retracted_at IS NULL""").fetchall()
    results, mapping, versions = [], [], {}
    for model, harness, score in v1_rows(Path(page)):
        registry_no = MODELS.get(model)
        row = {"model": model, "harness": harness, "programmatic_pass_at_1": score, "registry_no": registry_no}
        mapping.append(row)
        if not registry_no:
            row["status"] = "held: model not in Registry or preview build"
            continue
        if any(no == registry_no and Decimal(value) == Decimal(score) for no, value in held):
            row["status"] = "skipped: the Registry already holds this run from a developer report"
            continue
        name, slug_part, config = HARNESSES[harness]
        version = f"1 — {name}"
        versions[version] = (f"1-{slug_part}", config)
        row["status"] = "included"
        results.append({"operation": "result", "record": {
            "model_registry_no": registry_no, "reasoning_level": "high", "benchmark_slug": "cwe-bench",
            "benchmark_version": version, "metric_key": "cwe-bench-programmatic-pass-at-1",
            "source_has_single_run": True, "score_value": score, "score_raw": f"{score}%",
            "reported_at": "2026-10-07", "reported_precision": "date", "evaluator_keys": ["collinear-ai"],
            "source_type": "Benchmark leaderboard", "publisher": "Collinear AI", "reporting_basis": "independent",
            "source_archive_url": (HERE / "archive.txt").read_text().strip(),
            "sources": [{"url": PAGE, "checked_at": CHECKED, "primary": True}],
        }})
    if page != HERE / "page.html":
        print(json.dumps(mapping))
        return
    records = [{"operation": "benchmark", "record": {
        "slug": "cwe-bench", **family, "aliases": [], "evaluators": [], "metrics": [],
        "versions": [{"version": version, "version_slug": version_slug, "release_at": "2026-09-25",
                      "release_precision": "date", "metric_key": "cwe-bench-programmatic-pass-at-1",
                      "source_url": PAGE, "source_checked_at": CHECKED, "evaluator_keys": ["collinear-ai"]}
                     for version, (version_slug, _) in sorted(versions.items())],
    }}]
    records += [{"operation": "benchmark_version_configuration", "record": {
        "benchmark_slug": "cwe-bench", "version": version, "version_slug": version_slug, "dataset_label": "1",
        "configuration": config, "source_url": PAGE, "source_checked_at": CHECKED,
    }} for version, (version_slug, config) in sorted(versions.items())]
    out = ROOT / "data" / "batches" / "evaluator-cwe-bench-2026-10-07.json"
    out.write_text(json.dumps({"records": records + results}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "page.html")
