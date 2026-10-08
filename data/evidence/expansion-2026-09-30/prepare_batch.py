"""Deterministic evidence-to-ingestor preparation; never writes canonical data."""
import hashlib
import json
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHECKED_AT = "2026-09-30T10:00:00Z"
snapshot = json.loads((HERE / "production-before.json").read_text())
existing = json.loads((HERE / "result-identities-before.json").read_text())
benchmarks = {row["id"]: row for row in snapshot["benchmarks"]}
metrics = {row["id"]: row for row in snapshot["metrics"]}
versions = {
    (benchmarks[row["benchmark_id"]]["slug"], row["version"]):
        metrics[row["metric_id"]]["key"]
    for row in snapshot["benchmark_versions"]
}
records = []
ledger = []

entity_file = HERE / "new-benchmark-entities.json"
if entity_file.exists():
    for entity in json.loads(entity_file.read_text()):
        records.append({"operation": "benchmark", "record": entity})
        for version in entity["versions"]:
            versions[(entity["slug"], version["version"])] = version["metric_key"]


def map_result(observation, slug, version, reasoning, evaluator_keys, date, url=None):
    """Only call after reviewing exact identity, configuration and provenance."""
    item = dict(observation)
    item.update(canonical_benchmark_mapping=slug, version=version,
                reasoning_level=reasoning, evaluator_keys=evaluator_keys,
                reported_at=date)
    metric = versions[(slug, version)]
    item["metric"] = metric
    value = str(Decimal(item["normalized_stored_score"]).normalize())
    if "E" in value:
        value = format(Decimal(value), "f")
    item["normalized_stored_score"] = value
    source = url or item["source_url"]
    near = [row for row in existing
            if row["registry_no"] == item["target_registry_no"]
            and row["benchmark_slug"] == slug and row["version"] == version
            and row["reasoning_level"] == reasoning]
    exact_source = [row for row in near
                    if row["primary_source_url"] == source
                    and row["reported_at"] == date]
    if observation.get("same_release_evaluation_copy"):
        exact_source = [row for row in near if row["reported_at"] == date]
    if exact_source:
        row = exact_source[0]
        item["existing_result_key"] = row["result_key"]
        evaluator_hash = hashlib.sha256("\x00".join(["v1", *sorted(evaluator_keys)]).encode()).hexdigest()
        if Decimal(row["score_value"]) == Decimal(value) and row["evaluator_set_key"] == evaluator_hash:
            item["ingestion_outcome"] = "already_present_identical"
            item["reason"] = "Exact source/date/model/version/reasoning identity and score already present; no candidate staged."
        else:
            item["ingestion_outcome"] = "conflict_deferred"
            item["reason"] = "Same release evaluation has conflicting score or evaluator metadata; guarded result correction is unsupported."
        ledger.append(item)
        return
    # A new URL must never manufacture a rerun from disagreeing same-day evidence.
    if any(row["reported_at"] == date for row in near):
        item["ingestion_outcome"] = "conflict_deferred"
        item["reason"] = "Same-day existing result uses another source; independent-run identity not established."
        item["related_result_keys"] = [row["result_key"] for row in near]
        ledger.append(item)

        return
    record = {
        "model_registry_no": item["target_registry_no"],
        "reasoning_level": reasoning, "benchmark_slug": slug,
        "benchmark_version": version, "metric_key": metric,
        "score_value": value, "score_raw": item["displayed_score"],
        "reported_at": date, "reported_precision": "date",
        "evaluator_keys": evaluator_keys, "source_has_single_run": True,
        "sources": [{"url": source, "checked_at": CHECKED_AT, "primary": True}],
    }
    records.append({"operation": "result", "record": record})
    item["ingestion_outcome"] = "mapped_candidate"
    item["candidate_index"] = len(records) - 1
    ledger.append(item)


for observation in json.loads((HERE / "sol-luna-chart-ledger.json").read_text()):
    name = observation["benchmark_as_displayed"]
    mapping = {
        "AutomationBench": ("automationbench", "1.0.6"),
        "DeepSWE": ("deep-swe", "1.1"),
        "OSWorld 2.0, offline set": ("osworld", "2.0 v2026.08.08 Offline — Partial"),
    }
    if name in mapping:
        map_result(observation, *mapping[name], observation["reasoning_level"],
                   ["openai"], "2026-09-22")
    else:
        item = dict(observation)
        item["ingestion_outcome"] = "unresolved"
        if name in ("FrontierCode", "Agents' Last Exam"):
            item["reason"] = "Frozen one-metric-per-version contract conflicts with authoritative benchmark methodology defining multiple metrics for this version. A contract revision is outside this pass."
            item["benchmark_authority_sources"] = (
                ["https://cognition.com/blog/frontier-code", "https://cognition.com/blog/frontier-code-1.1"]
                if name == "FrontierCode" else
                ["https://agents-last-exam.org/", "https://arxiv.org/abs/2606.05405"])
        else:
            item["reason"] = "Internal factuality evaluation has no stable published benchmark version or release date; cannot infer equivalence to SimpleQA or fabricate a version."
        ledger.append(item)

# Curated mappings are explicit evidence decisions, never fuzzy name matching.
decision_file = HERE / "curated-html-decisions.json"
if decision_file.exists():
    observations = json.loads((HERE / "html-table-observations.json").read_text())
    for decision in json.loads(decision_file.read_text()):
        selected = [o for o in observations
                    if o["target_registry_no"] == decision["target_registry_no"]
                    and o["benchmark_as_displayed"] == decision["benchmark_as_displayed"]
                    and o["location"] == decision["location"]]
        assert len(selected) == 1, decision
        item = {**selected[0], **decision.get("evidence", {})}
        item["normalized_stored_score"] = decision["stored_score"]
        map_result(item, decision["slug"], decision["version"],
                   decision["reasoning"], decision["evaluators"], decision["date"],
                   decision.get("identity_source_url"))

reviewed_file = HERE / "reviewed-pdf-observations.json"
if reviewed_file.exists():
    for observation in json.loads(reviewed_file.read_text()):
        decision = observation.get("mapping")
        if decision:
            map_result(observation, decision["slug"], decision["version"],
                       decision["reasoning"], decision["evaluators"],
                       observation["reported_at"])
        else:
            assert observation["ingestion_outcome"] in ("unresolved", "research_pending", "conflict_deferred")
            assert observation["reason"]
            ledger.append(observation)

(HERE / "mapped-evidence-ledger.json").write_text(json.dumps(ledger, indent=2) + "\n")
(ROOT / "data/batches/expansion-2026-09-30.json").write_text(
    json.dumps({"records": records}, indent=2) + "\n")
print(json.dumps({"candidates": len(records), "ledger_records": len(ledger)}))
