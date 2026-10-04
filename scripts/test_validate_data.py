import copy
import json
import tempfile
import unittest
from pathlib import Path

from validate_data import main, validate


def fixture():
    result = {
        "model_registry_no": "10001",
        "benchmark_slug": "test",
        "benchmark_version": "1",
        "metric_key": "accuracy",
        "score_value": "50",
        "score_raw": "50%",
        "reported_at": "2026-01-01",
        "reported_precision": "date",
        "evaluator_keys": ["evaluator"],
        "sources": [
            {
                "url": "https://example.org/result",
                "primary": True,
                "checked_at": "2026-01-01T00:00:00Z",
            }
        ],
    }
    metric = {
        "key": "accuracy",
        "name": "Accuracy",
        "unit": "percent",
        "storage_kind": "decimal",
        "display_precision": 1,
        "source_url": "https://example.org/metric",
        "source_checked_at": "2026-01-01T00:00:00Z",
    }
    entries = [
        {
            "operation": "company",
            "record": {
                "slug": "provider",
                "name": "Provider",
                "source_url": "https://example.org",
                "source_checked_at": "2026-01-01T00:00:00Z",
                "namespace_authorizations": [
                    {
                        "namespace_prefix": "10",
                        "source_url": "https://example.org",
                        "source_checked_at": "2026-01-01T00:00:00Z",
                    }
                ],
            },
        },
        {
            "operation": "model",
            "record": {
                "registry_no": "10001",
                "canonical_name": "Model",
                "company_slug": "provider",
                "namespace_prefix": "10",
                "sequence": 1,
                "release_at": "2026-01-01",
                "release_precision": "date",
                "release_source_url": "https://example.org/model",
                "source_checked_at": "2026-01-01T00:00:00Z",
                "published_at": "2026-01-01T00:00:00Z",
                "status": "active",
            },
        },
        {
            "operation": "benchmark",
            "record": {
                "slug": "test",
                "canonical_name": "Test",
                "source_url": "https://example.org/benchmark",
                "source_checked_at": "2026-01-01T00:00:00Z",
                "metrics": [metric],
                "versions": [
                    {
                        "version": "1",
                        "version_slug": "1",
                        "metric_key": "accuracy",
                        "release_at": "2026-01-01",
                        "release_precision": "date",
                        "source_url": "https://example.org/version",
                        "source_checked_at": "2026-01-01T00:00:00Z",
                        "evaluator_keys": ["evaluator"],
                    }
                ],
                "evaluators": [
                    {
                        "key": "evaluator",
                        "name": "Evaluator",
                        "source_url": "https://example.org/evaluator",
                        "source_checked_at": "2026-01-01T00:00:00Z",
                    }
                ],
            },
        },
        {"operation": "result", "record": result},
    ]
    return {"records": entries}, result, metric


class ValidationTests(unittest.TestCase):
    def check_rule(self, mutate, rule, severity="error"):
        batch, result, metric = fixture()
        mutate(batch, result, metric)
        report = validate([("fixture.json", batch)])
        self.assertIn(rule, [entry["rule"] for entry in report[severity]])

    def test_valid_and_provenance_counts(self):
        batch, _, _ = fixture()
        report = validate([("fixture.json", batch)])
        self.assertEqual(report["error"], [])
        self.assertEqual(report["provenance_missing"]["source_type"], 1)
        self.assertEqual(report["provenance_missing"]["reported_at"], 0)

    def test_schema(self):
        self.assertTrue(validate([("fixture.json", [])])["error"])
        self.check_rule(lambda b, r, m: r.update(extra=True), "schema")

    def test_malformed_types_do_not_crash(self):
        for field in (
            "model_registry_no",
            "benchmark_slug",
            "benchmark_version",
            "metric_key",
            "reporting_basis",
        ):
            self.check_rule(lambda b, r, m: r.update({field: []}), "schema")
        self.check_rule(lambda b, r, m: r.update(evaluator_keys=[{}]), "schema")
        self.check_rule(
            lambda b, r, m: r["sources"][0].update(primary="true"), "schema"
        )
        self.check_rule(lambda b, r, m: m.update(display_precision="one"), "schema")
        self.check_rule(lambda b, r, m: b["records"][0].update(operation=[]), "schema")
        self.check_rule(
            lambda b, r, m: b["records"][2]["record"]["versions"][0].pop(
                "version_slug"
            ),
            "schema",
        )

    def test_duplicate_and_replay(self):
        self.check_rule(
            lambda b, r, m: b["records"].append(copy.deepcopy(b["records"][-1])),
            "duplicate_record",
        )
        batch, _, _ = fixture()
        report = validate([("a.json", batch), ("b.json", batch)])
        self.assertEqual(report["error"], [])
        self.assertIn("duplicate_record", [entry["rule"] for entry in report["info"]])

    def test_source_fragments_share_duplicate_identity(self):
        batch, _, _ = fixture()
        duplicate = copy.deepcopy(batch["records"][-1])
        duplicate["record"]["sources"][0]["url"] += "#table"
        batch["records"].append(duplicate)
        self.assertIn(
            "duplicate_record",
            [entry["rule"] for entry in validate([("fixture.json", batch)])["error"]],
        )

    def test_distinct_context_warning(self):
        def mutate(b, r, m):
            other = copy.deepcopy(b["records"][-1])
            other["record"]["reasoning_level"] = "high"
            b["records"].append(other)

        self.check_rule(mutate, "duplicate_record", "warning")

    def test_bounds(self):
        for score in ("-1", "101"):
            self.check_rule(lambda b, r, m: r.update(score_value=score), "score_range")
        self.check_rule(
            lambda b, r, m: (
                m.update(unit="points", maximum_value="10"),
                r.update(score_value="11"),
            ),
            "score_range",
        )

    def test_fraction_mixup(self):
        self.check_rule(
            lambda b, r, m: r.update(score_value="0.5"), "fraction_percent", "warning"
        )

    def test_score_type(self):
        for score in (None, "NaN", "Infinity", {}, 5):
            self.check_rule(lambda b, r, m: r.update(score_value=score), "score_type")
        self.check_rule(
            lambda b, r, m: (
                m.update(storage_kind="integer"),
                r.update(score_value="1.5"),
            ),
            "score_type",
        )
        self.check_rule(lambda b, r, m: m.update(storage_kind="text"), "score_type")

    def test_urls(self):
        for source in (
            "",
            "relative",
            "javascript:alert(1)",
            "https://example.org/a b",
        ):
            self.check_rule(
                lambda b, r, m: r["sources"][0].update(url=source), "source_url"
            )
        self.check_rule(lambda b, r, m: r.update(sources=[]), "source_url")

    def test_evaluation_date_requires_real_precision(self):
        self.check_rule(lambda b, r, m: r.update(evaluated_at="2026-01-01"), "schema")
        self.check_rule(
            lambda b, r, m: r.update(
                evaluated_at="2026-02-30", evaluated_precision="date"
            ),
            "date",
        )

    def test_dates(self):
        for date in ("2026-02-30", "2026-13-01", "yesterday"):
            self.check_rule(lambda b, r, m: r.update(reported_at=date), "date")

    def test_undefined(self):
        for field in (
            "model_registry_no",
            "benchmark_slug",
            "benchmark_version",
            "metric_key",
        ):
            self.check_rule(
                lambda b, r, m: r.update({field: "missing"}), "undefined_reference"
            )
        self.check_rule(
            lambda b, r, m: r.update(evaluator_keys=["missing"]), "undefined_reference"
        )

    def test_metric_mismatch(self):
        self.check_rule(
            lambda b, r, m: b["records"][2]["record"]["versions"][0].update(
                metric_key="other"
            ),
            "schema",
        )

    def test_json_and_exit_status(self):
        import contextlib
        import io

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "batch.json"
            path.write_text('{"records":[]}')
            with contextlib.redirect_stdout(io.StringIO()) as output:
                status = main(["--batches", directory, "--json"])
            self.assertEqual(status, 1)
            self.assertTrue(json.loads(output.getvalue())["error"])


class ManifestTests(unittest.TestCase):
    def run_main(self, mutate=None, staging=None):
        import contextlib
        import hashlib
        import io

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            batches, only = root / "batches", root / "staging-only"
            batches.mkdir()
            only.mkdir()
            batch, _, _ = fixture()
            (batches / "a.json").write_text(json.dumps(batch))
            entries = [{
                "order": 1,
                "file": "a.json",
                "sha256": hashlib.sha256((batches / "a.json").read_bytes()).hexdigest(),
                "applied": {"staging": None, "production": "2026-10-04T11:12:00Z"},
            }]
            if staging is not None:
                (only / "held.json").write_text(json.dumps(staging))
            if mutate:
                mutate(batches, entries)
            (batches / "manifest.json").write_text(json.dumps({"batches": entries}))
            with contextlib.redirect_stdout(io.StringIO()) as output:
                status = main(["--batches", str(batches), "--staging-only", str(only), "--json"])
            return status, json.loads(output.getvalue())

    def assert_manifest_error(self, mutate, location):
        status, report = self.run_main(mutate)
        self.assertEqual(status, 1)
        self.assertIn(
            ("manifest", location),
            [(entry["rule"], entry["location"]) for entry in report["error"]],
        )

    def test_valid_manifest_passes(self):
        status, report = self.run_main()
        self.assertEqual((status, report["error"]), (0, []))

    def test_unlisted_batch_file(self):
        def mutate(batches, entries):
            (batches / "b.json").write_text((batches / "a.json").read_text())

        self.assert_manifest_error(mutate, "b.json")

    def test_entry_for_missing_file(self):
        self.assert_manifest_error(
            lambda batches, entries: (batches / "a.json").unlink(), "a.json"
        )

    def test_sha256_mismatch(self):
        self.assert_manifest_error(
            lambda batches, entries: entries[0].update(sha256="0" * 64), "a.json"
        )

    def test_duplicate_order(self):
        def mutate(batches, entries):
            (batches / "b.json").write_text((batches / "a.json").read_text())
            entries.append({**entries[0], "file": "b.json"})

        self.assert_manifest_error(mutate, "manifest.json")

    def test_non_contiguous_order(self):
        self.assert_manifest_error(
            lambda batches, entries: entries[0].update(order=2), "manifest.json"
        )

    def test_applied_must_be_timestamp_or_null(self):
        self.assert_manifest_error(
            lambda batches, entries: entries[0]["applied"].update(staging="soon"),
            "a.json",
        )

    def test_authorization_must_be_tracked(self):
        self.assert_manifest_error(
            lambda batches, entries: entries[0].update(authorization="data/nowhere.md"),
            "a.json",
        )

    def test_staging_only_is_schema_checked_but_not_listed(self):
        batch, result, _ = fixture()
        held = {"records": [{"operation": "result", "record": result}]}
        status, report = self.run_main(staging=held)
        self.assertEqual((status, report["error"]), (0, []))
        held["records"][0]["record"]["score_value"] = "101"
        status, report = self.run_main(staging=held)
        self.assertEqual(status, 1)
        self.assertTrue(
            any(entry["location"].startswith("staging-only/held.json") for entry in report["error"])
        )


if __name__ == "__main__":
    unittest.main()
