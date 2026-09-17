"""Command-line entry point for the Benchmark Registry ingestor."""

import argparse
from collections.abc import Sequence

from benchmark_registry_ingestor import __version__


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
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run the ingestor command-line interface."""
    parser = build_parser()
    parser.parse_args(argv)
    parser.print_help()
    return 0
