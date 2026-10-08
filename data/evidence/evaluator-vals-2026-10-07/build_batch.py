#!/usr/bin/env python3
"""Build the Vals AI batch from views/*.json and archives.json.

views/<slug>.json: the "overall" table of each Vals benchmark page, taken from
the page's own data file on 2026-10-07. Only the score is recorded; cost and
latency are details of the run (owner decision, 2026-10-07).
archives.json: the Wayback Machine snapshot of each page saved for this batch.

Usage: build_batch.py <local replay database>
"""
import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED = "2026-10-07T12:00:00Z"
EVALUATOR = "vals-ai"

# Vals model key -> Registry No. Keys not listed are held for the new-model
# batch or because the build is not shown to be the Registry model.
MODELS = {
    "openai/gpt-5-2025-08-07": "10018",
    "openai/gpt-5-mini-2025-08-07": "10019",
    "openai/gpt-5-nano-2025-08-07": "10020",
    "openai/gpt-4.1-mini-2025-04-14": "10016",
    "openai/gpt-4.1-nano-2025-04-14": "10017",
    "openai/gpt-5.4-mini-2026-03-17": "10021",
    "openai/gpt-5.4-nano-2026-03-17": "10022",
    "anthropic/claude-opus-4-1-20250805": "20017",
    "anthropic/claude-opus-4-1-20250805-thinking": "20017",
    "grok/grok-4-0709": "40004",
    "zai/glm-4.5": "150007",
    "zai/glm-4.6": "150009",
    "fireworks/deepseek-v3p2": "110003",
    "fireworks/deepseek-v3p2-thinking": "110003",
    "anthropic/claude-3-7-sonnet-20250219": "20001",
    "anthropic/claude-3-7-sonnet-20250219-thinking": "20001",
    "anthropic/claude-opus-4-20250514": "20002",
    "anthropic/claude-opus-4-20250514-thinking": "20002",
    "anthropic/claude-sonnet-4-20250514": "20003",
    "anthropic/claude-sonnet-4-20250514-thinking": "20003",
    "anthropic/claude-fable-5-1": "20004",
    "anthropic/claude-sonnet-4-5-20250929-thinking": "20005",
    "anthropic/claude-haiku-4-5-20251001-thinking": "20006",
    "anthropic/claude-opus-4-5-20251101": "20007",
    "anthropic/claude-opus-4-5-20251101-thinking": "20007",
    "anthropic/claude-opus-4-6": "20008",
    "anthropic/claude-opus-4-6-thinking": "20008",
    "anthropic/claude-sonnet-4-6": "20009",
    "anthropic/claude-sonnet-4-6-claude-code": "20009",
    "anthropic/claude-opus-4-7": "20010",
    "anthropic/claude-opus-4-8": "20011",
    "anthropic/claude-opus-4-8-claude-code": "20011",
    "anthropic/claude-fable-5": "20012",
    "anthropic/claude-sonnet-5": "20013",
    "anthropic/claude-opus-5": "20014",
    "anthropic/claude-opus-5-5": "20015",
    "anthropic/claude-sonnet-5-5": "20016",
    "openai/gpt-4.1-2025-04-14": "10002",
    "openai/o3-2025-04-16": "10003",
    "openai/o4-mini-2025-04-16": "10004",
    "openai/gpt-6-astra": "10005",
    "openai/gpt-5.3-codex": "10006",
    "openai/gpt-5.4": "10007",
    "openai/gpt-5.4-2026-03-05": "10007",
    "openai/gpt-5.5": "10008",
    "openai/gpt-5.5-codex": "10008",
    "openai/gpt-5.5-factory": "10008",
    "openai/gpt-5.6-luna": "10009",
    "openai/gpt-5.6-sol": "10010",
    "openai/gpt-5.6-terra": "10011",
    "openai/gpt-5.2-2025-12-11": "10012",
    "openai/gpt-6-luna": "10013",
    "openai/gpt-6-sol": "10014",
    "openai/gpt-6.1-sol": "10015",
    "fireworks/gpt-oss-120b": "15001",
    "google/gemini-2.0-flash-001": "30001",
    "google/gemini-2.5-pro-exp-03-25": "30002",
    "google/gemini-2.5-pro-preview-03-25": "30002",
    "google/gemini-2.5-flash-preview-04-17": "30003",
    "google/gemini-2.5-flash-preview-04-17-thinking": "30003",
    "google/gemini-3.8-flash": "30004",
    "google/gemini-3.1-pro-preview": "30005",
    "google/gemini-3.5-flash": "30006",
    "google/gemini-3.6-flash": "30007",
    "google/gemini-3-pro-preview": "30008",
    "google/gemini-3-flash-preview": "30009",
    "google/gemini-3.7-flash": "30010",
    "google/gemini-4-argon": "30011",
    "google/gemma-4-31b-it": "35002",
    "grok/grok-4.5": "40001",
    "grok/grok-4.6": "40002",
    "grok/grok-4.7": "40003",
    "cursor/composer-2.5": "50004",
    "nvidia/nemotron-3-ultra-550b-a55b": "60003",
    "meta/muse_spark": "80001",
    "meta/muse_spark_1_1": "80002",
    "meta/muse_spark_1_2": "80003",
    "meta/muse_spark_1_3": "80005",
    "mistralai/mistral-large-2512": "90001",
    "mistralai/devstral-2512": "90002",
    "mistralai/labs-devstral-small-2512": "90003",
    "mistralai/mistral-small-2603": "90004",
    "mistralai/mistral-medium-3.5": "90005",
    "deepseek/deepseek-v4-pro": "110002",
    "kimi/kimi-k2.5-thinking": "120001",
    "kimi/kimi-k2.6": "120002",
    "kimi/kimi-k3": "120003",
    "alibaba/qwen3-max-2026-01-23": "130002",
    "alibaba/qwen3.6-plus": "130004",
    "alibaba/qwen3.7-max": "130006",
    "alibaba/qwen3.7-plus": "130007",
    "alibaba/qwen3.8-max": "130008",
    "minimax/MiniMax-M2.5": "140001",
    "minimax/MiniMax-M2.7": "140002",
    "minimax/MiniMax-M3": "140003",
    "zai/glm-4.7": "150001",
    "zai/glm-5-thinking": "150002",
    "zai/glm-5.1": "150003",
    "zai/glm-5.2": "150004",
    "zai/glm-5.3": "150005",
    "zai/glm-5.3-flash": "150006",
    "thinkingmachines/inkling": "160001",
    "thinkingmachines/inkling-small": "160002",
}

# Rows whose published score includes tasks served by another model after a
# refusal, as each page's own notes say. Held: the score is not the model's alone.
FALLBACK = {
    "vals_index": {"anthropic/claude-sonnet-5-5", "anthropic/claude-opus-5-5", "anthropic/claude-fable-5-1"},
    "gpqa": {"anthropic/claude-fable-5"},
    "hlab": {"anthropic/claude-fable-5"},
    "terminal-bench-2-1": {"anthropic/claude-opus-5-5", "anthropic/claude-fable-5", "anthropic/claude-opus-5"},
    "terminal-bench-4": {"anthropic/claude-opus-5-5", "anthropic/claude-fable-5-1", "anthropic/claude-fable-5",
                         "anthropic/claude-sonnet-5-5", "anthropic/claude-opus-5"},
}

# Model keys that name a model inside a vendor agent rather than a model; they
# are used only where the page splits rows by harness (Vibe Code Bench).
HARNESS_VARIANTS = {
    "anthropic/claude-opus-4-8-claude-code", "anthropic/claude-sonnet-4-6-claude-code",
    "openai/gpt-5.5-codex", "openai/gpt-5.5-factory",
}

# Vals page -> (benchmark slug, metric, version, version slug, release date,
# release source, dataset label, configuration). A version named with "{harness}"
# is split by each row's harness.
BOARDS = {
    "vals_index": ("vals-index", "vals-index-accuracy", "2.1", None, None, None, None, None),
    "fabv2": ("finance-agent", "finance-agent-accuracy", "2 — October 2026 evaluation",
              "2-october-2026", "2026-10-06", None, "2", None),
    "hlab": ("harveys-legal-agent-benchmark", "hlab-task-pass-rate", "October 2026 evaluation",
             "october-2026", "2026-10-06", None, None, None),
    "vibe-code": ("vibe-code-bench", "vibe-code-bench-score", "1.1 — {harness}, October 2026 evaluation",
                  "1.1-{harness_slug}-october-2026", "2026-10-06", None, "1.1", "harness"),
    "gpqa": ("gpqa", "gpqa-diamond-accuracy", "Diamond — Vals AI harness", "diamond-vals-ai",
             "2023-11-20", None, "Diamond",
             {"key": "vals-ai-gpqa-cot", "label": "Vals AI harness: mean of zero-shot and few-shot CoT", "kind": "harness"}),
    "mmlu_pro": ("mmlu-pro", "mmlu-pro-accuracy", "Original — Vals AI harness", "original-vals-ai",
                 "2024-06-03", None, "Original",
                 {"key": "vals-ai-harness", "label": "Vals AI harness", "kind": "harness"}),
    "mmmu": ("mmmu-pro", "mmmu-pro-accuracy", "Vals AI harness", "vals-ai",
             "2024-09-04", None, None,
             {"key": "vals-ai-harness", "label": "Vals AI harness", "kind": "harness"}),
    "swebench": ("swe-bench", "swe-bench-resolved", "Verified — Vals AI mini-swe-agent",
                 "verified-vals-ai-mini-swe-agent", "2024-08-13", None, "Verified",
                 {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"}),
    "terminal-bench-2": ("terminal-bench", "terminal-bench-accuracy", "2.0 — Vals AI Terminus 2",
                         "2.0-vals-ai-terminus-2", "2025-11-07", None, "2.0",
                         {"key": "terminus-2-harness", "label": "Terminus-2 harness", "kind": "harness"}),
    "terminal-bench-2-1": ("terminal-bench", "terminal-bench-accuracy", "2.1 — Vals AI Terminus 2",
                           "2.1-vals-ai-terminus-2", "2026-05-06", None, "2.1",
                           {"key": "terminus-2-harness", "label": "Terminus-2 harness", "kind": "harness"}),
    "terminal-bench-4": ("terminal-bench", "terminal-bench-accuracy", "4.0 — Vals AI mini-swe-agent",
                         "4.0-vals-ai-mini-swe-agent", "2026-08-28", None, "4.0",
                         {"key": "mini-swe-agent-harness", "label": "mini-swe-agent harness", "kind": "harness"}),
}
HARNESSES = {
    "OpenHands": ("OpenHands", "openhands", {"key": "openhands-harness", "label": "OpenHands harness", "kind": "harness"}),
    "Claude Code": ("Claude Code", "claude-code", {"key": "claude-code-harness", "label": "Claude Code harness", "kind": "harness"}),
    "Codex": ("Codex", "codex", {"key": "codex-harness", "label": "Codex harness", "kind": "harness"}),
    "Factory": ("Factory", "factory", {"key": "factory-harness", "label": "Factory harness", "kind": "harness"}),
    "Cursor CLI": ("Cursor CLI", "cursor-cli", {"key": "cursor-cli-harness", "label": "Cursor CLI harness", "kind": "harness"}),
}
FAMILIES = ("vals-index", "finance-agent", "harveys-legal-agent-benchmark", "vibe-code-bench", "gpqa",
            "mmlu-pro", "mmmu-pro", "swe-bench", "terminal-bench")


def canonical(value):
    text = format(value, "f") if isinstance(value, float) else str(value)
    return text.rstrip("0").rstrip(".") if "." in text else text


def label(key, row):
    effort = row.get("reasoning_effort")
    if effort:
        return effort
    return "thinking" if key.endswith("-thinking") else ""


def main(database):
    db = sqlite3.connect(database)
    families = {slug: dict(zip(("canonical_name", "source_url", "source_checked_at"), db.execute(
        "SELECT canonical_name, source_url, source_checked_at FROM benchmarks WHERE slug = ?", (slug,)
    ).fetchone())) for slug in FAMILIES}
    # Models whose Vals result the Registry already holds through a developer
    # relay of the same run (Gemini 4 Argon's launch report quotes Vals).
    relayed = {(no, slug) for no, slug in db.execute(
        """SELECT m.registry_no, b.slug FROM results r JOIN models m ON m.id = r.model_id
        JOIN benchmark_versions v ON v.id = r.benchmark_version_id JOIN benchmarks b ON b.id = v.benchmark_id
        JOIN result_evaluators re ON re.result_id = r.id
        JOIN evaluator_organizations e ON e.id = re.evaluator_organization_id WHERE e.key = 'vals-ai'""")}
    archives = json.loads((HERE / "archives.json").read_text())
    results, mapping, versions = [], [], {}
    for page, (slug, metric, version, version_slug, release, _, dataset, config) in BOARDS.items():
        view = json.loads((HERE / "views" / f"{page}.json").read_text())
        reported = view["metadata"]["updated"]
        seen = {}
        for key, row in sorted(view["overall"].items()):
            entry = {"page": page, "model": key, "score": row.get("accuracy"),
                     "harness": row.get("harness"), "reasoning_level": label(key, row),
                     "registry_no": MODELS.get(key)}
            mapping.append(entry)
            if row.get("accuracy") is None:
                entry["status"] = "held: no overall score"
                continue
            if key in FALLBACK.get(page, ()):
                entry["status"] = "held: score includes refusal-fallback tasks served by another model"
                continue
            if key in HARNESS_VARIANTS and config != "harness":
                entry["status"] = "held: run inside a vendor agent, not the page's stated harness"
                continue
            if not entry["registry_no"]:
                entry["status"] = "held: model not in Registry or build not shown to be the Registry model"
                continue
            if (entry["registry_no"], slug) in relayed:
                entry["status"] = "skipped: the Registry already holds this Vals run via a developer report"
                continue
            this_version, this_slug, this_config = version, version_slug, config
            if config == "harness":
                name, harness_slug, this_config = HARNESSES.get(row.get("harness"), (None, None, None))
                if not name:
                    entry["status"] = f"held: harness {row.get('harness')!r} not mapped"
                    continue
                this_version = version.format(harness=name)
                this_slug = version_slug.format(harness_slug=harness_slug)
            series = (entry["registry_no"], entry["reasoning_level"], this_version)
            if series in seen:
                entry["status"] = f"held: same model, setting and version as {seen[series]}; runs not distinguishable"
                for other in mapping:
                    if other["page"] == page and other["model"] == seen[series] and other["status"] == "included":
                        other["status"] = f"held: same model, setting and version as {key}; runs not distinguishable"
                results[:] = [r for r in results if r["_key"] != (page, seen[series])]
                continue
            seen[series] = key
            entry["status"] = "included"
            if release:
                versions.setdefault(slug, {})[this_version] = (this_slug, release, dataset, this_config, view["page"])
            results.append({"_key": (page, key), "operation": "result", "record": {
                "model_registry_no": entry["registry_no"],
                "reasoning_level": entry["reasoning_level"],
                "benchmark_slug": slug,
                "benchmark_version": this_version,
                "metric_key": metric,
                "source_has_single_run": True,
                "score_value": canonical(row["accuracy"]),
                "score_raw": str(row["accuracy"]),
                "reported_at": reported,
                "reported_precision": "date",
                "evaluator_keys": [EVALUATOR],
                "source_type": "Benchmark leaderboard",
                "publisher": "Vals AI",
                "reporting_basis": "independent",
                "source_archive_url": archives[page],
                "sources": [{"url": view["page"], "checked_at": CHECKED, "primary": True}],
            }})
    benchmarks, configurations = [], []
    for slug, items in versions.items():
        benchmarks.append({"operation": "benchmark", "record": {
            "slug": slug, **families[slug], "aliases": [], "evaluators": [], "metrics": [],
            "versions": [{
                "version": version, "version_slug": version_slug, "release_at": release,
                "release_precision": "date", "metric_key": BOARD_METRIC[slug],
                "source_url": page_url, "source_checked_at": CHECKED, "evaluator_keys": [EVALUATOR],
            } for version, (version_slug, release, _, _, page_url) in sorted(items.items())],
        }})
        for version, (version_slug, _, dataset, config, page_url) in sorted(items.items()):
            if config:
                configurations.append({"operation": "benchmark_version_configuration", "record": {
                    "benchmark_slug": slug, "version": version, "version_slug": version_slug,
                    "dataset_label": dataset, "configuration": config,
                    "source_url": page_url, "source_checked_at": CHECKED,
                }})
    for result in results:
        result.pop("_key")
    records = [*benchmarks, *configurations, *results]
    out = ROOT / "data" / "batches" / "evaluator-vals-2026-10-07.json"
    out.write_text(json.dumps({"records": records}, indent=2, ensure_ascii=False) + "\n")
    (HERE / "mapping.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")
    counts = {}
    for entry in mapping:
        counts[entry["status"].split(":")[0]] = counts.get(entry["status"].split(":")[0], 0) + 1
    print(len(results), "results;", counts, file=sys.stderr)


BOARD_METRIC = {board[0]: board[1] for board in BOARDS.values()}

if __name__ == "__main__":
    main(sys.argv[1])
