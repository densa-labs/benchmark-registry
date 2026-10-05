#!/usr/bin/env python3
"""Manual, read-only validation of tracked batches and optional SQLite database."""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REASONING_LABELS = ROOT / "data" / "reasoning-labels.json"
sys.path.insert(0, str(ROOT / "ingestor" / "src"))
from benchmark_registry_ingestor.engine import RECORD_FIELDS
from benchmark_registry_ingestor.values import (
    ValueErrorDetail,
    normalize_temporal,
    normalize_url,
)

PROVENANCE = (
    "evaluated_at",
    "evaluated_precision",
    "source_type",
    "source_archive_url",
    "publisher",
    "reporting_basis",
    "reported_at",
    "evaluator_keys",
)
REQUIRED = {
    "company": {
        "name",
        "slug",
        "source_url",
        "source_checked_at",
        "namespace_authorizations",
    },
    "model": {
        "canonical_name",
        "registry_no",
        "company_slug",
        "namespace_prefix",
        "sequence",
        "release_at",
        "release_precision",
        "release_source_url",
        "source_checked_at",
        "published_at",
        "status",
    },
    "benchmark": {
        "canonical_name",
        "slug",
        "source_url",
        "source_checked_at",
        "versions",
    },
    "result_correction": {
        "result_key",
        "expected",
        "corrected",
        "reason",
        "source_url",
        "source_checked_at",
        "recorded_at",
    },
    "result_retraction": {"result_key", "reason", "source_url", "source_checked_at", "retracted_at"},
    "benchmark_version_configuration": {
        "benchmark_slug",
        "version",
        "version_slug",
        "configuration",
        "source_url",
        "source_checked_at",
    },
    "result": {
        "model_registry_no",
        "benchmark_slug",
        "benchmark_version",
        "metric_key",
        "score_raw",
        "reported_at",
        "reported_precision",
        "evaluator_keys",
        "sources",
    },
}


def validate(batches: list[tuple[str, object]], database: Path | None = None) -> dict:
    report = {"error": [], "warning": [], "info": []}

    def add(severity, rule, location, message):
        report[severity].append(
            {"rule": rule, "location": location, "message": message}
        )

    records = []
    models, companies, evaluators, versions, metrics = set(), set(), set(), {}, {}
    db_results = []
    if database:
        try:
            with sqlite3.connect(
                database.resolve().as_uri() + "?mode=ro", uri=True
            ) as db:
                db.row_factory = sqlite3.Row
                for row in db.execute("PRAGMA integrity_check"):
                    if row[0] != "ok":
                        add("error", "db_integrity", "database", row[0])
                for row in db.execute("PRAGMA foreign_key_check"):
                    add("error", "undefined_reference", "database", str(tuple(row)))
                models.update(
                    row[0] for row in db.execute("SELECT registry_no FROM models")
                )
                companies.update(
                    row[0] for row in db.execute("SELECT slug FROM companies")
                )
                evaluators.update(
                    row[0]
                    for row in db.execute("SELECT key FROM evaluator_organizations")
                )
                metrics.update(
                    {
                        row["key"]: dict(row)
                        for row in db.execute("SELECT * FROM metrics")
                    }
                )
                versions.update(
                    {
                        (row[0], row[1]): row[2]
                        for row in db.execute(
                            "SELECT b.slug,bv.version,m.key FROM benchmark_versions bv JOIN benchmarks b ON b.id=bv.benchmark_id JOIN metrics m ON m.id=bv.metric_id"
                        )
                    }
                )
                for row in db.execute(
                    "SELECT r.*,m.registry_no,b.slug,bv.version,metric.key FROM results r JOIN models m ON m.id=r.model_id JOIN benchmark_versions bv ON bv.id=r.benchmark_version_id JOIN benchmarks b ON b.id=bv.benchmark_id JOIN metrics metric ON metric.id=r.metric_id"
                ):
                    r = dict(row)
                    r.update(
                        model_registry_no=r.pop("registry_no"),
                        benchmark_slug=r.pop("slug"),
                        benchmark_version=r.pop("version"),
                        metric_key=r.pop("key"),
                    )
                    r["sources"] = [
                        {
                            "url": r["primary_source_url"],
                            "primary": True,
                            "checked_at": r["primary_source_checked_at"],
                        }
                    ]
                    r["evaluator_keys"] = [
                        e[0]
                        for e in db.execute(
                            "SELECT eo.key FROM result_evaluators re JOIN evaluator_organizations eo ON eo.id=re.evaluator_organization_id WHERE re.result_id=?",
                            (r["id"],),
                        )
                    ]
                    db_results.append((f"database:result:{r['id']}", r))
        except (sqlite3.Error, OSError) as exc:
            add("error", "database_schema", "database", str(exc))
    list_fields = {
        "aliases",
        "evaluators",
        "metrics",
        "versions",
        "namespace_authorizations",
        "evaluator_keys",
        "sources",
        "registry_nos",
        "authorized_prefixes",
    }
    mapping_fields = {"expected", "corrected", "redirect", "configuration"}
    boolean_fields = {
        "source_has_single_run",
        "establishment_gap_documented",
        "primary",
        "same_run",
        "distinct_run",
    }
    integer_fields = {"sequence", "display_precision"}
    nested_fields = {
        "sources": (
            {"url", "checked_at", "primary", "same_run"},
            {"url", "checked_at", "primary"},
        ),
        "metrics": (
            {
                "name",
                "key",
                "storage_kind",
                "unit",
                "display_precision",
                "direction",
                "minimum_value",
                "maximum_value",
                "source_url",
                "source_checked_at",
            },
            {
                "name",
                "key",
                "storage_kind",
                "unit",
                "display_precision",
                "source_url",
                "source_checked_at",
            },
        ),
        "evaluators": (
            {"name", "key", "source_url", "source_checked_at"},
            {"name", "key", "source_url", "source_checked_at"},
        ),
        "versions": (
            {
                "version",
                "version_slug",
                "release_at",
                "release_precision",
                "metric_key",
                "source_url",
                "source_checked_at",
                "evaluator_keys",
            },
            {
                "version",
                "version_slug",
                "release_at",
                "release_precision",
                "metric_key",
                "source_url",
                "source_checked_at",
                "evaluator_keys",
            },
        ),
        "namespace_authorizations": (
            {"namespace_prefix", "source_url", "source_checked_at"},
            {"namespace_prefix", "source_url", "source_checked_at"},
        ),
        "aliases": (
            {"name", "source_url", "source_checked_at"},
            {"name", "source_url", "source_checked_at"},
        ),
    }

    def schema_types(record, location):
        valid = True
        for key, value in record.items():
            field = f"{location}.{key}"
            if key == "score_value":
                continue  # The score rule handles metric-specific typing.
            okay = value is None or isinstance(value, str)
            if key in integer_fields:
                okay = type(value) is int and value >= (1 if key == "sequence" else 0)
            if key in {"minimum_value", "maximum_value"}:
                okay = (
                    value is None
                    or isinstance(value, (str, int))
                    and not isinstance(value, bool)
                )
            if key in boolean_fields:
                okay = type(value) is bool
            if key in mapping_fields:
                okay = isinstance(value, dict) or key == "redirect" and value is None
            if key in list_fields:
                okay = isinstance(value, list)
                if okay:
                    for index, item in enumerate(value):
                        nested_location = f"{field}[{index}]"
                        if key in nested_fields:
                            allowed, required = nested_fields[key]
                            if (
                                not isinstance(item, dict)
                                or set(item) - allowed
                                or required - set(item)
                            ):
                                add(
                                    "error",
                                    "schema",
                                    nested_location,
                                    "Malformed nested record or missing required fields.",
                                )
                                valid = False
                            if isinstance(item, dict):
                                valid = schema_types(item, nested_location) and valid
                        elif not isinstance(item, str) or not item.strip():
                            okay = False
            if not okay:
                add("error", "schema", field, "Invalid field type or value.")
                valid = False
        return valid

    for filename, payload in batches:
        if (
            not isinstance(payload, dict)
            or set(payload) != {"records"}
            or not isinstance(payload["records"], list)
            or not payload["records"]
        ):
            add(
                "error",
                "schema",
                filename,
                "Expected a non-empty records list in a batch object.",
            )
            continue
        for index, entry in enumerate(payload["records"]):
            loc = f"{filename}:records[{index}]"
            if (
                not isinstance(entry, dict)
                or set(entry) != {"operation", "record"}
                or (
                    not isinstance(entry.get("operation"), str)
                    or entry.get("operation") not in RECORD_FIELDS
                )
                or not isinstance(entry.get("record"), dict)
            ):
                add("error", "schema", loc, "Invalid operation or record object.")
                continue
            op, r = entry["operation"], entry["record"]
            invalid = set(r) - RECORD_FIELDS[op]
            missing = REQUIRED.get(op, set()) - set(r)
            if invalid or missing:
                add(
                    "error",
                    "schema",
                    loc,
                    f"Unknown fields: {sorted(invalid)}; missing fields: {sorted(missing)}",
                )
            if not schema_types(r, loc):
                continue  # Invalid compound identities must never reach set/dict lookups.
            for field in REQUIRED.get(op, set()) - list_fields:
                if r.get(field) is None or r.get(field) == "":
                    add("error", "schema", loc, f"Required field {field} is empty.")
            records.append((loc, op, r))
            if op == "model":
                models.add(r.get("registry_no"))
            if op == "company":
                companies.add(r.get("slug"))
            if op == "benchmark":
                for metric in (
                    r.get("metrics", [])
                    if isinstance(r.get("metrics", []), list)
                    else []
                ):
                    if isinstance(metric, dict):
                        metrics.setdefault(metric.get("key"), metric)
                for evaluator in (
                    r.get("evaluators", [])
                    if isinstance(r.get("evaluators", []), list)
                    else []
                ):
                    if isinstance(evaluator, dict):
                        evaluators.add(evaluator.get("key"))
                for version in (
                    r.get("versions", [])
                    if isinstance(r.get("versions", []), list)
                    else []
                ):
                    if isinstance(version, dict):
                        versions.setdefault(
                            (r.get("slug"), version.get("version")),
                            version.get("metric_key"),
                        )

    def walk(value, loc):
        if isinstance(value, dict):
            for key, item in value.items():
                field = f"{loc}.{key}"
                if (key.endswith("_url") or key == "url") and item is not None:
                    try:
                        normalize_url(item, key)
                        if any(ch.isspace() for ch in item):
                            raise ValueErrorDetail("URL contains whitespace")
                    except (ValueError, TypeError):
                        add(
                            "error",
                            "source_url",
                            field,
                            "Expected an absolute HTTP(S) URL without whitespace.",
                        )
                if key.endswith("_at") and item is not None:
                    precision = value.get(key.replace("_at", "_precision"), "timestamp")
                    if key == "release_at":
                        precision = value.get("release_precision")
                    try:
                        normalize_temporal(item, precision, key)
                    except (ValueError, TypeError):
                        add(
                            "error",
                            "date",
                            field,
                            "Invalid ISO calendar date, timestamp, or precision.",
                        )
                walk(item, field)
        elif isinstance(value, list):
            for index, item in enumerate(value):
                walk(item, f"{loc}[{index}]")

    for loc, op, r in records:
        walk(r, loc)
        if op == "model" and r.get("status") not in {
            "preview",
            "active",
            "deprecated",
            "stealth",
        }:
            add("error", "schema", loc, "Invalid model lifecycle status.")
        if op == "model" and r.get("company_slug") not in companies:
            add(
                "error",
                "undefined_reference",
                loc,
                "Model references an undefined provider.",
            )
        if op == "benchmark":
            for version in (
                r.get("versions", []) if isinstance(r.get("versions", []), list) else []
            ):
                if (
                    not isinstance(version, dict)
                    or version.get("metric_key") not in metrics
                ):
                    add(
                        "error",
                        "undefined_reference",
                        loc,
                        "Version references an undefined metric.",
                    )
    for loc, op, r in records:
        if op != "benchmark_version_configuration":
            continue
        configuration = r.get("configuration")
        if (r.get("benchmark_slug"), r.get("version")) not in versions:
            add("error", "undefined_reference", loc, "Configuration names an undefined benchmark version.")
        if (
            not isinstance(configuration, dict)
            or set(configuration) != {"key", "label", "kind"}
            or configuration.get("kind") not in {"tools", "harness", "context"}
        ):
            add("error", "schema", loc, "Configuration needs key, label and kind (tools, harness or context).")
        dataset = r.get("dataset_label")
        if dataset is not None and not (
            isinstance(r.get("version"), str)
            and r["version"].startswith(dataset)
            and r["version"] != dataset
        ):
            add("error", "schema", loc, "dataset_label must be a leading part of the version label.")
    mapping = json.loads(REASONING_LABELS.read_text())
    reasoning_labels = {row["label"] for row in mapping["labels"]}
    for row in mapping["labels"]:
        if row["effort"] not in {None, *mapping["vocabulary"]}:
            add(
                "error",
                "reasoning_label",
                f"reasoning-labels:{row['label']!r}",
                "Effort is outside the fixed vocabulary.",
            )
    result_records = [(loc, r) for loc, op, r in records if op == "result"]
    counts = Counter()
    seen = {}
    for loc, r in result_records + db_results:
        for field in PROVENANCE:
            if not r.get(field):
                counts[field] += 1
        sources = r.get("sources")
        if (
            not isinstance(sources, list)
            or not sources
            or any(
                not isinstance(s, dict)
                or not isinstance(s.get("url"), str)
                or not s.get("url")
                for s in sources
            )
        ):
            add(
                "error",
                "source_url",
                loc,
                "A non-empty list of source URLs is required.",
            )
            sources = []
        for source in sources:
            if source.get("primary") is False and source.get("same_run") is not True:
                add(
                    "error",
                    "schema",
                    loc,
                    "Additional sources require same_run=true curator confirmation.",
                )
        primary = [
            s for s in sources if isinstance(s, dict) and s.get("primary") is True
        ]
        if len(primary) != 1:
            add(
                "error",
                "schema",
                loc,
                "Exactly one identity-bearing primary source is required.",
            )
        if not isinstance(r.get("evaluator_keys"), list) or not r.get("evaluator_keys"):
            add("error", "schema", loc, "A non-empty evaluator_keys list is required.")
        if (
            r.get("model_registry_no") not in models
            or (r.get("benchmark_slug"), r.get("benchmark_version")) not in versions
            or r.get("metric_key") not in metrics
        ):
            add(
                "error",
                "undefined_reference",
                loc,
                "Result references an undefined model, benchmark version, or metric.",
            )
        elif versions[(r["benchmark_slug"], r["benchmark_version"])] != r["metric_key"]:
            add(
                "error",
                "schema",
                loc,
                "Result metric differs from benchmark version metric.",
            )
        if isinstance(r.get("evaluator_keys"), list) and any(
            key not in evaluators for key in r["evaluator_keys"]
        ):
            add(
                "error",
                "undefined_reference",
                loc,
                "Result references an undefined evaluator.",
            )
        if bool(r.get("evaluated_at")) != bool(r.get("evaluated_precision")) or r.get(
            "evaluated_precision"
        ) not in {None, "date", "timestamp"}:
            add(
                "error",
                "schema",
                loc,
                "Evaluation date and precision must be recorded together.",
            )
        if r.get("reporting_basis") not in {None, "self-reported", "independent"}:
            add("error", "schema", loc, "Invalid reporting_basis.")
        if r.get("reasoning_level", "") not in reasoning_labels:
            add(
                "error",
                "reasoning_label",
                loc,
                "Reasoning level has no reviewed effort mapping in data/reasoning-labels.json.",
            )
        metric = metrics.get(r.get("metric_key"), {})
        if metric.get("storage_kind") not in {"decimal", "integer", "text"}:
            add("error", "schema", loc, "Invalid metric storage kind.")
        if metric.get("direction") not in {None, "higher", "lower"}:
            add("error", "schema", loc, "Invalid recorded metric direction.")
        score = r.get("score_value")
        if metric.get("storage_kind") == "text":
            if score is not None:
                add(
                    "error",
                    "score_type",
                    loc,
                    "Text metrics require a null score_value.",
                )
        else:
            try:
                if not isinstance(score, str):
                    raise InvalidOperation
                number = Decimal(score)
                if not number.is_finite():
                    raise InvalidOperation
                if (
                    metric.get("storage_kind") == "integer"
                    and number != number.to_integral_value()
                ):
                    add(
                        "error",
                        "score_type",
                        loc,
                        "Integer metric contains a fraction.",
                    )
                bounds = (
                    (Decimal(0), Decimal(100))
                    if metric.get("unit") == "percent"
                    else (None, None)
                )
                low = (
                    Decimal(metric["minimum_value"])
                    if metric.get("minimum_value") is not None
                    else bounds[0]
                )
                high = (
                    Decimal(metric["maximum_value"])
                    if metric.get("maximum_value") is not None
                    else bounds[1]
                )
                if (
                    low is not None
                    and number < low
                    or high is not None
                    and number > high
                ):
                    add(
                        "error",
                        "score_range",
                        loc,
                        "Score is outside the metric's recorded/plausible bounds.",
                    )
                if metric.get("unit") == "percent" and 0 < number < 1:
                    add(
                        "warning",
                        "fraction_percent",
                        loc,
                        "Possible fraction-vs-percent mixup; verify primary evidence.",
                    )
            except (InvalidOperation, ValueError, TypeError):
                add(
                    "error",
                    "score_type",
                    loc,
                    "Numeric score must be finite decimal text.",
                )
        for source in primary:
            try:
                identity_url = normalize_url(source["url"], "source.url")[1]
            except (ValueError, TypeError):
                identity_url = source["url"]
            key = (
                r.get("model_registry_no"),
                r.get("benchmark_slug"),
                r.get("benchmark_version"),
                r.get("metric_key"),
                identity_url,
            )
            fingerprint = json.dumps(
                {
                    k: r.get(k)
                    for k in (
                        "reasoning_level",
                        "run_ref",
                        "reported_at",
                        "evaluator_keys",
                        "score_value",
                        "score_raw",
                    )
                },
                sort_keys=True,
            )
            if key in seen:
                previous_loc, previous_fingerprint = seen[key]
                same_batch = (
                    previous_loc.split(":records[")[0] == loc.split(":records[")[0]
                )
                severity = (
                    "error"
                    if same_batch and fingerprint == previous_fingerprint
                    else "info"
                    if fingerprint == previous_fingerprint
                    else "warning"
                )
                add(
                    severity,
                    "duplicate_record",
                    loc,
                    f"Same model/version/metric/source as {previous_loc}; {'exact replay' if fingerprint == previous_fingerprint else 'possibly a distinct reasoning/evaluator/run; review, do not merge'}.",
                )
            else:
                seen[key] = (loc, fingerprint)
        if loc.startswith("database:"):
            walk(
                {
                    key: r.get(key)
                    for key in (
                        "reported_at",
                        "reported_precision",
                        "primary_source_url",
                        "source_archive_url",
                    )
                },
                loc,
            )
    scope = (
        "database"
        if database and db_results
        else "batch observations (includes replays)"
    )
    scoped = db_results if database and db_results else result_records
    report["provenance_missing"] = {
        field: sum(not r.get(field) for _, r in scoped) for field in PROVENANCE
    }
    report["data_gaps"] = {
        "records": len(scoped),
        "metric_direction": sum(
            not metrics.get(r.get("metric_key"), {}).get("direction") for _, r in scoped
        ),
        "weights_openness": len(scoped),
        "benchmark_category": len(scoped),
    }
    add(
        "info",
        "provenance_counts",
        scope,
        json.dumps(report["provenance_missing"], sort_keys=True),
    )
    add(
        "info",
        "data_gap_counts",
        scope,
        json.dumps(report["data_gaps"], sort_keys=True),
    )
    return report


MANIFEST_FILES = {"manifest.json", "expected-counts.json"}


def _applied_timestamp(value) -> bool:
    if value is None:
        return True
    try:
        normalize_temporal(value, "timestamp", "applied")
    except (ValueErrorDetail, TypeError):
        return False
    return True


def check_manifest(directory: Path, manifest: Path) -> tuple[list[dict], list[dict], list[str]]:
    """Check the manifest against the batch files; return (errors, info, ordered files)."""
    errors, info = [], []

    def error(location, message):
        errors.append({"rule": "manifest", "location": location, "message": message})

    try:
        entries = json.loads(manifest.read_text())["batches"]
        if not isinstance(entries, list) or not all(isinstance(e, dict) for e in entries):
            raise TypeError("batches must be a list of objects")
    except (OSError, ValueError, KeyError, TypeError) as exc:
        error(str(manifest), f"Unreadable manifest: {exc}")
        return errors, info, []
    orders = [entry.get("order") for entry in entries]
    if not all(isinstance(order, int) and not isinstance(order, bool) for order in orders):
        error(manifest.name, "Every order must be an integer.")
    else:
        if len(set(orders)) != len(orders):
            error(manifest.name, "Duplicate order values.")
        if sorted(set(orders)) != list(range(1, len(entries) + 1)):
            error(manifest.name, "Order values must run 1..N without gaps.")
    files = [entry.get("file") for entry in entries]
    for name, count in Counter(files).items():
        if count > 1:
            error(str(name), "Listed more than once.")
    for entry in sorted(entries, key=lambda e: e.get("order") if isinstance(e.get("order"), int) else 0):
        name = entry.get("file")
        if not isinstance(name, str) or "/" in name or name in MANIFEST_FILES:
            error(manifest.name, f"Invalid file entry {name!r}.")
            continue
        path = directory / name
        if not path.is_file():
            error(name, "Manifest entry points to a missing file.")
        elif hashlib.sha256(path.read_bytes()).hexdigest() != entry.get("sha256"):
            error(name, "sha256 does not match the manifest.")
        applied = entry.get("applied")
        if (
            not isinstance(applied, dict)
            or set(applied) != {"staging", "production"}
            or not all(_applied_timestamp(applied[key]) for key in applied)
        ):
            error(name, "applied must hold staging and production timestamps or null.")
        authorization = entry.get("authorization")
        if authorization is not None:
            if not isinstance(authorization, str) or not (ROOT / authorization).is_file():
                error(name, f"Authorization {authorization!r} is not a tracked file.")
            else:
                info.append({"rule": "authorization", "location": name,
                             "message": f"Applied under {authorization}."})
    listed = {name for name in files if isinstance(name, str)}
    for path in sorted(directory.glob("*.json")):
        if path.name not in MANIFEST_FILES and path.name not in listed:
            error(path.name, "Batch file is missing from the manifest.")
    ordered = [
        entry["file"]
        for entry in sorted(entries, key=lambda e: e.get("order") if isinstance(e.get("order"), int) else 0)
        if isinstance(entry.get("file"), str) and (directory / entry["file"]).is_file()
    ]
    return errors, info, ordered


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__,
        epilog="Manual run: python3.12 scripts/validate_data.py --json [--db /absolute/registry.sqlite3]. No network calls or writes.",
    )
    parser.add_argument(
        "--batches",
        type=Path,
        default=ROOT / "data" / "batches",
        help="Batch directory (default: data/batches)",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        help="Batch manifest (default: <batches>/manifest.json)",
    )
    parser.add_argument(
        "--staging-only",
        type=Path,
        default=ROOT / "data" / "staging-only",
        help="Records kept off production: schema-checked, never replayed",
    )
    parser.add_argument(
        "--db",
        type=Path,
        help="Optional explicit existing SQLite database, opened read-only",
    )
    parser.add_argument(
        "--json", action="store_true", help="Emit machine-readable JSON"
    )
    args = parser.parse_args(argv)
    manifest_errors, manifest_info, ordered = check_manifest(
        args.batches, args.manifest or args.batches / "manifest.json"
    )
    unlisted = sorted(
        path.name for path in args.batches.glob("*.json")
        if path.name not in MANIFEST_FILES and path.name not in ordered
    )
    staging_only = sorted(args.staging_only.glob("*.json")) if args.staging_only.is_dir() else []
    paths = [args.batches / name for name in ordered + unlisted] + staging_only
    batches, failures = [], []
    for path in paths:
        label = path.name if path.parent == args.batches else f"staging-only/{path.name}"
        try:
            batches.append((label, json.loads(path.read_text())))
        except (ValueError, OSError) as exc:
            failures.append({"rule": "schema", "location": label, "message": str(exc)})
    report = validate(batches, args.db)
    report["error"].extend(failures + manifest_errors)
    report["info"].extend(manifest_info)
    if not batches and not args.db:
        report["error"].append(
            {
                "rule": "schema",
                "location": str(args.batches),
                "message": "No batch files found.",
            }
        )
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        for severity in ("error", "warning", "info"):
            print(f"{severity.upper()} ({len(report[severity])})")
            for entry in report[severity]:
                print(f"  [{entry['rule']}] {entry['location']}: {entry['message']}")
    return 1 if report["error"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
