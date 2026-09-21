"""One-off assembly of the primary-source launch batch (no database writes)."""

import json
import re
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/batches/launch-dataset.json"
CHECKED = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
old = json.loads(subprocess.check_output(["git", "show", "HEAD:data/batches/launch-dataset.json"], cwd=ROOT))
records = []
benchmarks = {r["record"]["slug"]: r["record"] for r in old["records"] if r["operation"] == "benchmark"}
seed = json.loads((ROOT / "data/batches/p4-seed.json").read_text())
seed_benchmarks = {r["record"]["slug"]: r["record"] for r in seed["records"] if r["operation"] == "benchmark"}
known_evaluators = {e["key"]: e for b in [*seed_benchmarks.values(), *benchmarks.values()]
                    for e in b["evaluators"]}
models = []
results = []


def model(name, company, prefix, sequence, date, url, exception=None, aliases=()):
    registry_no = f"{prefix}{sequence:03d}"
    models.append({"operation": "model", "record": {
        "canonical_name": name, "company_slug": company, "namespace_prefix": prefix,
        "sequence": sequence, "registry_no": registry_no, "release_at": date,
        "release_precision": "date", "release_source_url": url,
        "source_checked_at": CHECKED, "published_at": CHECKED,
        "status": "active", "sequence_exception_reason": exception,
        "aliases": [{"name": a, "source_url": url, "source_checked_at": CHECKED} for a in aliases],
    }})
    return registry_no


def add_version(slug, version, version_slug, date, metric_key, url, evaluator_keys):
    b = benchmarks[slug]
    b["versions"].append({"version": version, "version_slug": version_slug,
        "release_at": date, "release_precision": "date", "metric_key": metric_key,
        "source_url": url, "source_checked_at": CHECKED, "evaluator_keys": evaluator_keys})


def benchmark(name, slug, version, version_slug, date, metric, key, url, evaluator, ev_key,
              unit="percent", precision=1, storage="decimal"):
    benchmarks[slug] = {"canonical_name": name, "slug": slug, "source_url": url,
        "source_checked_at": CHECKED, "aliases": [],
        "evaluators": [dict(known_evaluators[ev_key]) if ev_key in known_evaluators else
                       {"name": evaluator, "key": ev_key, "source_url": url,
                        "source_checked_at": CHECKED}],
        "metrics": [{"name": metric, "key": key, "storage_kind": storage,
                     "unit": unit, "display_precision": precision,
                     "minimum_value": "0", "maximum_value": "100" if unit == "percent" else None,
                     "source_url": url, "source_checked_at": CHECKED}],
        "versions": [{"version": version, "version_slug": version_slug,
                      "release_at": date, "release_precision": "date", "metric_key": key,
                      "source_url": url, "source_checked_at": CHECKED,
                      "evaluator_keys": [ev_key]}]}


def ensure_evaluator(slug, name, key, url):
    b = benchmarks.get(slug) or seed_benchmarks[slug]
    if not any(e["key"] == key for e in b["evaluators"]):
        b["evaluators"].append({"name": name, "key": key, "source_url": url,
                                "source_checked_at": CHECKED})


def result(registry_no, slug, version, score, date, url, evaluator, effort="", raw=None):
    b = benchmarks.get(slug) or seed_benchmarks[slug]
    v = next(v for v in b["versions"] if v["version"] == version)
    raw = raw if raw is not None else f"{score}%"
    results.append({"operation": "result", "record": {
        "model_registry_no": registry_no, "reasoning_level": effort,
        "benchmark_slug": slug, "benchmark_version": version,
        "metric_key": v["metric_key"], "score_value": str(score), "score_raw": raw,
        "reported_at": date, "reported_precision": "date", "evaluator_keys": [evaluator],
        "source_has_single_run": True,
        "sources": [{"url": url, "checked_at": CHECKED, "primary": True}],
    }})


# Prior public identifiers are retained only after reviewing their developer pages
# and the cited evaluator pages again. This is a fresh batch, not a copy of HEAD.
for r in old["records"]:
    if r["operation"] == "model":
        x = json.loads(json.dumps(r))
        models.append(x)
    elif r["operation"] == "result":
        x = json.loads(json.dumps(r))
        results.append(x)


# Version and family definitions from the benchmark owners' official publications.
add_version("terminal-bench", "2.1", "2-1", "2026-05-06", "terminal-bench-accuracy",
            "https://www.tbench.ai/news/terminal-bench-2-1", ["terminal-bench-team"])
add_version("terminal-bench", "2.0", "2-0", "2025-11-07", "terminal-bench-accuracy",
            "https://www.tbench.ai/news/announcement-2-0", ["terminal-bench-team"])
benchmark("SWE-bench Pro", "swe-bench-pro", "Public", "public", "2025-09-19",
          "Public tasks resolved", "swe-bench-pro-resolved", "https://labs.scale.com/papers/swe_bench_pro",
          "Scale AI", "scale-ai")
benchmark("MMMU-Pro", "mmmu-pro", "No tools", "no-tools", "2024-09-04",
          "MMMU-Pro accuracy", "mmmu-pro-accuracy", "https://arxiv.org/abs/2409.02813",
          "MMMU-Pro Authors", "mmmu-pro-authors")
add_version("mmmu-pro", "With tools", "with-tools", "2026-03-05", "mmmu-pro-accuracy",
            "https://openai.com/index/introducing-gpt-5-4/", ["mmmu-pro-authors"])
benchmarks["osworld"]["metrics"].append({
    "name": "OSWorld-Verified success rate", "key": "osworld-verified-resolved",
    "storage_kind": "decimal", "unit": "percent", "display_precision": 1,
    "minimum_value": "0", "maximum_value": "100",
    "source_url": "https://github.com/xlang-ai/OSWorld", "source_checked_at": CHECKED,
})
add_version("osworld", "Verified", "verified", "2025-07-28", "osworld-verified-resolved",
            "https://github.com/xlang-ai/OSWorld", ["xlang-lab"])
benchmark("GDPval", "gdpval", "GDPval", "gdpval", "2025-09-25",
          "Wins or ties", "gdpval-win-tie-rate", "https://openai.com/index/gdpval/",
          "OpenAI", "openai")
benchmark("Toolathlon", "toolathlon", "Original", "original", "2025-10-29",
          "Tasks completed", "toolathlon-task-success", "https://arxiv.org/abs/2510.25726",
          "Toolathlon Authors", "toolathlon-authors")
benchmark("MLE-bench", "mle-bench", "MLE-bench", "mle-bench", "2024-10-10",
          "Tasks solved", "mle-bench-solved", "https://openai.com/index/mle-bench/",
          "OpenAI", "openai")

# Developer-published runs. Artificial Analysis-branded rows are excluded.
u53 = "https://openai.com/index/introducing-gpt-5-3-codex/"
m53 = model("GPT-5.3-Codex", "openai", "10", 6, "2026-02-05", u53,
            "late_backfill", ["gpt-5.3-codex"])
for slug, ver, score in [
    ("swe-bench-pro", "Public", "56.8"), ("terminal-bench", "2.0", "77.3"),
    ("osworld", "Verified", "64.7"), ("gdpval", "GDPval", "70.9")]:
    result(m53, slug, ver, score, "2026-02-05", u53, "openai", "xhigh")

u54 = "https://openai.com/index/introducing-gpt-5-4/"
m54 = model("GPT-5.4", "openai", "10", 7, "2026-03-05", u54,
            "late_backfill", ["gpt-5.4"])
for slug, ver, score in [
    ("swe-bench-pro", "Public", "57.7"), ("terminal-bench", "2.0", "75.1"),
    ("osworld", "Verified", "75.0"), ("gdpval", "GDPval", "83.0"),
    ("browsecomp", "BrowseComp", "82.7"), ("gpqa", "Diamond", "92.8"),
    ("humanitys-last-exam", "Full set — No tools", "39.8"),
    ("humanitys-last-exam", "Full set — With tools", "52.1"),
    ("mmmu-pro", "No tools", "81.2"), ("mmmu-pro", "With tools", "82.1")]:
    result(m54, slug, ver, score, "2026-03-05", u54, "openai", "xhigh")

u55 = "https://openai.com/index/introducing-gpt-5-5/"
m55 = model("GPT-5.5", "openai", "10", 8, "2026-04-23", u55,
            "late_backfill", ["gpt-5.5"])
for slug, ver, score in [
    ("terminal-bench", "2.0", "82.7"), ("osworld", "Verified", "78.7"),
    ("gdpval", "GDPval", "84.9"), ("browsecomp", "BrowseComp", "84.4"),
    ("gpqa", "Diamond", "93.6"),
    ("humanitys-last-exam", "Full set — No tools", "41.4"),
    ("humanitys-last-exam", "Full set — With tools", "52.2"),
    ("mmmu-pro", "No tools", "81.2"), ("mmmu-pro", "With tools", "83.2")]:
    result(m55, slug, ver, score, "2026-04-23", u55, "openai", "xhigh")

u56 = "https://openai.com/index/gpt-5-6/"
for seq, name, alias, vals in [
    (9, "GPT-5.6 Luna", "gpt-5.6-luna", ["84.7", "67.2", "83.3", "92.3", "78.4", "79.5", "22.7"]),
    (10, "GPT-5.6 Sol", "gpt-5.6-sol", ["88.8", "72.7", "90.4", "94.6", "83", "84.6", "30.7"]),
    (11, "GPT-5.6 Terra", "gpt-5.6-terra", ["87.4", "69.6", "87.5", "92.9", "80.7", "82", "24.7"]),
]:
    m = model(name, "openai", "10", seq, "2026-07-09", u56,
              "late_backfill", [alias])
    for (slug, ver), score in zip([
        ("terminal-bench", "2.1"), ("deep-swe", "1.1"),
        ("browsecomp", "BrowseComp"), ("gpqa", "Diamond"),
        ("mmmu-pro", "No tools"), ("mmmu-pro", "With tools"),
        ("gdp-pdf", "GDP.pdf"),
    ], vals):
        result(m, slug, ver, score, "2026-07-09", u56, "openai", "")


# Google model-card self-evaluations. Their comparative competitor columns are
# deliberately not imported, and GDPval-AA rows are excluded.
google_cards = [
    (5, "Gemini 3.1 Pro", "2026-02-19", "https://deepmind.google/models/model-cards/gemini-3-1-pro/",
     [("terminal-bench", "2.0", "68.5"), ("gpqa", "Diamond", "94.3"),
      ("swe-bench", "Verified", "80.6"), ("swe-bench-pro", "Public", "54.2"),
      ("browsecomp", "BrowseComp", "85.9"), ("mmmu-pro", "No tools", "80.5"),
      ("humanitys-last-exam", "Full set — No tools", "44.4")]),
    (6, "Gemini 3.5 Flash", "2026-05-19", "https://deepmind.google/models/model-cards/gemini-3-5-flash/",
     [("terminal-bench", "2.1", "76.2"), ("swe-bench-pro", "Public", "55.1"),
      ("osworld", "Verified", "78.4"),
      ("charxiv", "Reasoning — No tools", "84.2"), ("mmmu-pro", "No tools", "83.6"),
      ("humanitys-last-exam", "Full set — No tools", "40.2"),
      ("toolathlon", "Original", "56.5")]),
    (7, "Gemini 3.6 Flash", "2026-07-21", "https://deepmind.google/models/model-cards/gemini-3-6-flash/",
     [("terminal-bench", "2.1", "78.0"), ("swe-bench-pro", "Public", "58.7"),
      ("deep-swe", "1.1", "49"), ("osworld", "Verified", "83.0"),
      ("charxiv", "Reasoning — No tools", "85.2"),
      ("mle-bench", "MLE-bench", "63.9")]),
]
for seq, name, date, url, vals in google_cards:
    m = model(name, "google", "30", seq, date, url, "late_backfill")
    for slug, ver, score in vals:
        result(m, slug, ver, score, date, url, "google-deepmind", "High" if seq == 5 else "")


# Benchmark definitions extend seed; source-check timestamps record this rebuild.
# Reused definitions retain their original checked timestamps so the batch is
# idempotent against records that may already have been ingested.

records.extend(models)
records.extend({"operation": "benchmark", "record": b} for b in benchmarks.values())
records.extend(results)
OUT.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
print(f"models={len(models)} benchmarks={len(benchmarks)} results={len(results)}")
