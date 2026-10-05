"""Command-line entry point for the Benchmark Registry ingestor."""

import argparse
import hashlib
import json
import os
import subprocess
import sys
from collections.abc import Sequence
from pathlib import Path

from benchmark_registry_ingestor import __version__
from benchmark_registry_ingestor.database import (
    DatabaseFailure,
    database_from_environment,
)
from benchmark_registry_ingestor.engine import (
    IngestionFailure,
    Ingestor,
    LaterRecord,
    PublicationPending,
)


class ManifestFailure(ValueError):
    """The batch manifest does not describe the tracked batch files."""


def load_manifest(path: Path) -> list[tuple[str, object]]:
    """Return each manifest batch as (file name, payload), in replay order."""
    manifest = json.loads(path.read_text(encoding="utf-8"))
    entries = sorted(manifest["batches"], key=lambda entry: entry["order"])
    if [entry["order"] for entry in entries] != list(range(1, len(entries) + 1)):
        raise ManifestFailure("manifest order must run 1..N without gaps or repeats")
    batches = []
    for entry in entries:
        data = (path.parent / entry["file"]).read_bytes()
        if hashlib.sha256(data).hexdigest() != entry["sha256"]:
            raise ManifestFailure(f"{entry['file']} does not match its manifest sha256")
        batches.append((entry["file"], json.loads(data)))
    return batches


def replay(args: argparse.Namespace) -> int:
    """Run every manifest batch in order, each with the later batches as context."""
    if args.target == "remote" and args.commit:
        raise ManifestFailure(
            "replay commits only to a local database; commit remote batches one at a "
            "time with `batch`"
        )
    batches = load_manifest(args.input)
    database = database_from_environment(args.target, commit=args.commit)
    for index, (name, payload) in enumerate(batches):
        later = [
            LaterRecord(later_name, item["operation"], item["record"])
            for later_name, later_payload in batches[index + 1 :]
            for item in later_payload["records"]
        ]
        try:
            outcomes = Ingestor(database).run(
                "batch", payload, commit=args.commit, later=later
            )
        except IngestionFailure as exc:
            print(json.dumps({"status": exc.status, "operation": "replay", "batch": name,
                              "identifier": exc.identifier, "message": exc.message},
                             sort_keys=True), file=sys.stderr)
            return 3 if exc.status == "CONFLICT" else 2
        for outcome in outcomes:
            print(json.dumps({**outcome.as_dict(), "batch": name}, sort_keys=True))
    return 0


def publication_callback(target: str):
    if target != "remote":
        return None
    environments = {
        "59a384d9-5fba-45e4-97be-3bd1e047def1": "staging",
        "a7b3e1d1-34d6-432b-bd31-8ec4636916ab": "production",
    }
    environment = environments.get(os.environ.get("CLOUDFLARE_D1_DATABASE_ID", ""))
    if environment is None:
        return None  # Disposable atomicity probes have no public read store.
    app = Path(__file__).parents[3] / "app"

    def publish():
        result = subprocess.run(
            ["node", "scripts/materialize.mjs", "--environment", environment],
            cwd=app, capture_output=True, text=True, check=False,
        )
        if result.returncode:
            raise RuntimeError(
                f"materializer exited {result.returncode}: "
                f"{(result.stderr or result.stdout)[-2000:].strip()}"
            )

    return publish


def build_parser() -> argparse.ArgumentParser:
    """Build the ingestor command-line parser."""
    parser = argparse.ArgumentParser(
        prog="registry-ingest",
        description="Validate and ingest curated Benchmark Registry records.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    subparsers = parser.add_subparsers(dest="operation")
    for operation in (
        "company",
        "company_correction",
        "company_attestation",
        "model_provider_correction",
        "provider_name_correction",
        "provider_retirement",
        "model",
        "benchmark",
        "benchmark_version_configuration",
        "result",
        "result_correction",
        "result_retraction",
        "batch",
        "replay",
    ):
        command = subparsers.add_parser(
            operation,
            help="replay every batch listed in a manifest, in order"
            if operation == "replay"
            else f"validate and ingest a {operation} JSON document",
        )
        command.add_argument(
            "input",
            type=Path,
            help="path to data/batches/manifest.json"
            if operation == "replay"
            else "path to the JSON input document",
        )
        mode = command.add_mutually_exclusive_group(required=True)
        mode.add_argument(
            "--dry-run",
            action="store_true",
            help="validate and report without mutation",
        )
        mode.add_argument(
            "--commit",
            action="store_true",
            help="atomically commit the complete validated unit",
        )
        command.add_argument(
            "--target",
            choices=("local", "remote"),
            default="local",
            help="database adapter to use (default: local)",
        )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run the ingestor command-line interface."""
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.operation is None:
        parser.print_help()
        return 0
    try:
        if args.operation == "replay":
            return replay(args)
        with args.input.open(encoding="utf-8") as input_file:
            payload = json.load(input_file)
        database = database_from_environment(args.target, commit=args.commit)
        outcomes = Ingestor(database, publication_callback(args.target)).run(
            args.operation,
            payload,
            commit=args.commit,
        )
    except PublicationPending as exc:
        print(json.dumps({"status": "ERROR", "operation": args.operation,
                          "canonical_committed": True, "materialization_pending": True,
                          "message": str(exc)}, sort_keys=True), file=sys.stderr)
        return 4
    except (OSError, json.JSONDecodeError, KeyError, DatabaseFailure, ManifestFailure) as exc:
        print(
            json.dumps(
                {
                    "status": "ERROR",
                    "operation": args.operation,
                    "identifier": str(args.input),
                    "message": str(exc),
                },
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 2
    except IngestionFailure as exc:
        print(
            json.dumps(
                {
                    "status": exc.status,
                    "operation": args.operation,
                    "input": str(args.input),
                    "identifier": exc.identifier,
                    "message": exc.message,
                },
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 3 if exc.status == "CONFLICT" else 2
    for outcome in outcomes:
        print(json.dumps(outcome.as_dict(), sort_keys=True))
    return 0
