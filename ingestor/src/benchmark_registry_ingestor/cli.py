"""Command-line entry point for the Benchmark Registry ingestor."""

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path

from benchmark_registry_ingestor import __version__
from benchmark_registry_ingestor.database import (
    DatabaseFailure,
    database_from_environment,
)
from benchmark_registry_ingestor.engine import IngestionFailure, Ingestor


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
        "result",
        "batch",
    ):
        command = subparsers.add_parser(
            operation,
            help=f"validate and ingest a {operation} JSON document",
        )
        command.add_argument("input", type=Path, help="path to the JSON input document")
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
        with args.input.open(encoding="utf-8") as input_file:
            payload = json.load(input_file)
        database = database_from_environment(args.target, commit=args.commit)
        outcomes = Ingestor(database).run(
            args.operation,
            payload,
            commit=args.commit,
        )
    except (OSError, json.JSONDecodeError, DatabaseFailure) as exc:
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
