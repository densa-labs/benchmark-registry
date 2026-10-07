#!/usr/bin/env python3
"""Build the τ³-bench batch from Sierra's published submission files.

manifest.json and submissions/<dir>.json are copies of
https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json
and .../<dir>/submission.json, the data behind https://taubench.com/leaderboard,
fetched 2026-10-07. archives.json maps each file to its Wayback snapshot.
Only current (non-legacy) standard submissions run by Sierra are used.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T14:00:00Z"
BUCKET = "https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions"
EVALUATOR = "sierra-research"
RELEASE_V101 = "https://github.com/sierra-research/tau2-bench/releases/tag/v1.0.1"

MODELS = {
    "claude-opus-4-5_sierra_2026-02-26": "20007",
    "claude-sonnet-4-5_sierra_2026-02-26": "20005",
    "gpt-5-2_sierra_2026-02-26": "10012",
    "gpt-5-2-none_sierra_2026-02-26": "10012",
    "glm-5-think_sierra_2026-03-02": "150002",
    "qwen3.5-397b-a17b-think_sierra_2026-03-02": "130003",
    "gemini-3-flash_sierra_2026-03-02": "30009",
    "gemini-3-pro_sierra_2026-03-02": "30008",
    "gpt-5-4_sierra_2026-03-25": "10007",
    "gpt-5-5_sierra_2026-05-05": "10008",
    "claude-opus-4-6_sierra_2026-05-05": "20008",
    "claude-opus-4-7_sierra_2026-05-05": "20010",
    "gemini-3-1-pro-preview_sierra_2026-05-05": "30005",
    "gpt-5-6-sol_sierra_2026-08-04": "10010",
    "claude-opus-4-8_sierra_2026-08-04": "20011",
    "claude-fable-5_sierra_2026-08-04": "20012",
    "muse-spark-1-1_sierra_2026-08-04": "80002",
    "kimi-k3_sierra_2026-08-04": "120003",
    "glm-5-2_sierra_2026-08-04": "150004",
    "grok-4-5_sierra_2026-08-04": "40001",
    "inkling_sierra_2026-08-04": "160001",
    "claude-opus-5_sierra_2026-08-04": "20014",
}
DOMAINS = {"airline": "τ³ — Airline", "retail": "τ³ — Retail", "telecom": "τ³ — Telecom"}
RETRIEVAL = {
    "alltools": "AllTools",
    "terminal": "Terminal",
    "text-emb-3-large": "text-embedding-3-large",
    "qwen_embeddings": "Qwen embeddings",
}


def banking_version(config):
    name = RETRIEVAL[config]
    slug = config.replace("_", "-").replace(".", "-")
    return (f"τ³ — Banking, {name} retrieval, v1.0.1 grading", f"banking-{slug}-retrieval-v1-0-1",
            {"key": f"retrieval-{slug}", "label": f"{name} retrieval", "kind": "tools"})


def main(database):
    db = sqlite3.connect(database)
    family = dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = 'tau3-bench'").fetchone()))
    archives = json.loads((HERE / "archives.json").read_text())
    manifest = json.loads((HERE / "manifest.json").read_text())
    results, mapping, banking = [], [], {}
    for directory in manifest["submissions"]:
        submission = json.loads((HERE / "submissions" / f"{directory}.json").read_text())
        methodology = submission.get("methodology", {})
        verification = methodology.get("verification", {})
        base = {"submission": directory, "model": submission["model_name"],
                "submitter": submission.get("submitting_organization"),
                "registry_no": MODELS.get(directory)}
        reasons = []
        if submission.get("submitting_organization") != "Sierra":
            reasons.append("skipped: not run by Sierra")
        elif submission.get("submission_type") != "standard":
            reasons.append("skipped: custom agent, not the standard scaffold")
        elif verification.get("modified_prompts") or verification.get("omitted_questions"):
            reasons.append("skipped: modified prompts or omitted questions")
        elif methodology.get("tau2_bench_version") != "1.0.1":
            reasons.append("held: not run on tau2-bench 1.0.1")
        elif not base["registry_no"]:
            reasons.append("held: model not in Registry or release date differs from the Registry's")
        evaluated = methodology.get("evaluation_date")
        reported = max(submission["submission_date"], evaluated or submission["submission_date"])
        for domain, result in submission["results"].items():
            entry = {**base, "domain": domain, "pass_1": result and result.get("pass_1")}
            mapping.append(entry)
            if reasons:
                entry["status"] = reasons[0]
                continue
            if not result or result.get("pass_1") is None:
                entry["status"] = "held: no score for this domain"
                continue
            if domain == "banking_knowledge":
                config = result.get("retrieval_config")
                if config not in RETRIEVAL:
                    entry["status"] = f"held: retrieval setting {config!r} not mapped"
                    continue
                version, version_slug, configuration = banking_version(config)
                banking[version] = (version_slug, configuration)
            else:
                version = DOMAINS[domain]
            entry["status"] = "included"
            score = json.dumps(result["pass_1"])
            results.append({"operation": "result", "record": {
                "model_registry_no": base["registry_no"],
                "reasoning_level": submission.get("reasoning_effort") or "",
                "benchmark_slug": "tau3-bench",
                "benchmark_version": version,
                "metric_key": "tau3-success",
                "run_ref": f"tau-bench-submissions:{directory}",
                "score_value": score,
                "score_raw": score,
                "reported_at": reported,
                "reported_precision": "date",
                "evaluated_at": evaluated,
                "evaluated_precision": "date",
                "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark leaderboard",
                "publisher": "Sierra",
                "reporting_basis": "independent",
                "source_archive_url": archives[directory],
                "sources": [
                    {"url": f"{BUCKET}/{directory}/submission.json", "checked_at": CHECKED, "primary": True},
                    {"url": "https://taubench.com/leaderboard", "checked_at": CHECKED, "primary": False,
                     "same_run": True},
                ],
            }})
    records = []
    if banking:
        records.append({"operation": "benchmark", "record": {
            "slug": "tau3-bench", **family, "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": version, "version_slug": version_slug, "release_at": "2026-07-22",
                "release_precision": "date", "metric_key": "tau3-success", "source_url": RELEASE_V101,
                "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            } for version, (version_slug, _) in sorted(banking.items())],
        }})
        records += [{"operation": "benchmark_version_configuration", "record": {
            "benchmark_slug": "tau3-bench", "version": version, "version_slug": version_slug,
            "dataset_label": "τ³ — Banking", "configuration": configuration,
            "source_url": "https://taubench.com/leaderboard", "source_checked_at": CHECKED,
        }} for version, (version_slug, configuration) in sorted(banking.items())]
    records += results
    out = ROOT / "data" / "batches" / "evaluator-tau3-bench-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    print(len(results), "results", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
