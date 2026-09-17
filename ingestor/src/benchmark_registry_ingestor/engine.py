"""Validation and statement planning for the controlled ingestion path."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from .database import AmbiguousWriteFailure, Database, DatabaseFailure, Statement
from .values import (
    ValueErrorDetail,
    canonical_decimal,
    compare_temporal,
    normalize_checked_at,
    normalize_name,
    normalize_temporal,
    normalize_url,
    require_key,
    require_slug,
    require_string,
    require_version_slug,
)

Record = dict[str, Any]


class IngestionFailure(RuntimeError):
    def __init__(self, status: str, identifier: str, message: str):
        super().__init__(message)
        self.status = status
        self.identifier = identifier
        self.message = message


@dataclass(frozen=True)
class Outcome:
    status: str
    operation: str
    identifier: str
    message: str

    def as_dict(self) -> dict[str, str]:
        return {
            "status": self.status,
            "operation": self.operation,
            "identifier": self.identifier,
            "message": self.message,
        }


TABLES = (
    "companies",
    "namespaces",
    "namespace_companies",
    "models",
    "model_aliases",
    "benchmarks",
    "benchmark_aliases",
    "metrics",
    "evaluator_organizations",
    "benchmark_versions",
    "benchmark_version_evaluators",
    "results",
    "result_evaluators",
    "result_sources",
    "registry_redirects",
)


@dataclass
class Catalog:
    rows: dict[str, list[Record]]
    next_ids: dict[str, int]

    @classmethod
    def load(cls, database: Database) -> Catalog:
        rows = {table: database.query(f"SELECT * FROM {table}") for table in TABLES}
        next_ids = {
            table: max((int(row["id"]) for row in values), default=0) + 1
            for table, values in rows.items()
            if values and "id" in values[0]
        }
        for table in (
            "companies",
            "models",
            "model_aliases",
            "benchmarks",
            "benchmark_aliases",
            "metrics",
            "evaluator_organizations",
            "benchmark_versions",
            "results",
            "result_sources",
        ):
            next_ids.setdefault(table, 1)
        return cls(rows, next_ids)

    def allocate(self, table: str) -> int:
        value = self.next_ids[table]
        self.next_ids[table] += 1
        return value

    def one(self, table: str, **criteria: object) -> Record | None:
        matches = [
            row
            for row in self.rows[table]
            if all(row.get(key) == value for key, value in criteria.items())
        ]
        if len(matches) > 1:
            raise RuntimeError(f"database invariant violated for {table}: {criteria}")
        return matches[0] if matches else None

    def many(self, table: str, **criteria: object) -> list[Record]:
        return [
            row
            for row in self.rows[table]
            if all(row.get(key) == value for key, value in criteria.items())
        ]

    def add(self, table: str, row: Record) -> None:
        self.rows[table].append(row)


@dataclass
class Plan:
    catalog: Catalog
    statements: list[Statement] = field(default_factory=list)
    outcomes: list[Outcome] = field(default_factory=list)

    def valid(self, operation: str, identifier: str, message: str) -> None:
        self.outcomes.append(Outcome("VALID", operation, identifier, message))

    def skipped(self, operation: str, identifier: str, message: str) -> None:
        self.outcomes.append(Outcome("SKIPPED", operation, identifier, message))


def _mapping(value: object, field_name: str) -> Record:
    if not isinstance(value, dict):
        raise ValueErrorDetail(f"{field_name} must be an object")
    return value


def _list(value: object, field_name: str, *, required: bool = False) -> list[object]:
    if value is None:
        values: list[object] = []
    elif isinstance(value, list):
        values = value
    else:
        raise ValueErrorDetail(f"{field_name} must be an array")
    if required and not values:
        raise ValueErrorDetail(f"{field_name} must contain at least one item")
    return values


def _same(row: Record, expected: Record, fields: tuple[str, ...]) -> bool:
    return all(row.get(field) == expected.get(field) for field in fields)


def _hash_components(components: list[str]) -> str:
    return hashlib.sha256("\x00".join(components).encode()).hexdigest()


def _source(record: Record, prefix: str = "source") -> Record:
    exact, normalized = normalize_url(record.get(f"{prefix}_url"), f"{prefix}_url")
    checked = normalize_checked_at(
        record.get(f"{prefix}_checked_at"), f"{prefix}_checked_at"
    )
    return {
        f"{prefix}_url": exact,
        f"normalized_{prefix}_url": normalized,
        f"{prefix}_checked_at": checked,
    }


class Ingestor:
    def __init__(self, database: Database):
        self.database = database

    def run(
        self,
        operation: str,
        payload: object,
        *,
        commit: bool,
    ) -> list[Outcome]:
        try:
            records = self._records(operation, payload)
        except ValueErrorDetail as exc:
            raise IngestionFailure("ERROR", operation, str(exc)) from exc
        plan = self._build(records)
        if commit and plan.statements:
            try:
                self.database.execute_batch(plan.statements)
            except AmbiguousWriteFailure:
                verification = self._build(records)
                if verification.statements or any(
                    outcome.status != "SKIPPED" for outcome in verification.outcomes
                ):
                    raise IngestionFailure(
                        "ERROR",
                        operation,
                        "remote write response was ambiguous and logical identities "
                        "do not prove the batch committed; no retry was attempted",
                    ) from None
                return [
                    Outcome(
                        "SKIPPED",
                        outcome.operation,
                        outcome.identifier,
                        "verified present after an ambiguous remote response",
                    )
                    for outcome in verification.outcomes
                ]
            except DatabaseFailure as exc:
                raise IngestionFailure("ERROR", operation, str(exc)) from exc
        return plan.outcomes

    def _records(self, operation: str, payload: object) -> list[tuple[str, Record]]:
        if operation == "batch":
            root = _mapping(payload, "batch")
            items = _list(root.get("records"), "records", required=True)
            records: list[tuple[str, Record]] = []
            for index, raw_item in enumerate(items):
                item = _mapping(raw_item, f"records[{index}]")
                item_operation = require_string(
                    item.get("operation"), f"records[{index}].operation"
                )
                if item_operation not in {"company", "model", "benchmark", "result"}:
                    raise IngestionFailure(
                        "ERROR", f"records[{index}]", "unsupported batch operation"
                    )
                records.append(
                    (
                        item_operation,
                        _mapping(item.get("record"), f"records[{index}].record"),
                    )
                )
            return records
        if operation not in {"company", "model", "benchmark", "result"}:
            raise IngestionFailure("ERROR", operation, "unsupported operation")
        return [(operation, _mapping(payload, operation))]

    def _build(self, records: list[tuple[str, Record]]) -> Plan:
        plan = Plan(Catalog.load(self.database))
        for operation, record in records:
            try:
                getattr(self, f"_plan_{operation}")(plan, record)
            except IngestionFailure:
                raise
            except ValueErrorDetail as exc:
                raise IngestionFailure(
                    "ERROR", self._identifier(operation, record), str(exc)
                ) from exc
        return plan

    @staticmethod
    def _identifier(operation: str, record: Record) -> str:
        fields = {
            "company": "slug",
            "model": "registry_no",
            "benchmark": "slug",
            "result": "run_ref",
        }
        value = record.get(fields[operation])
        return str(value) if value is not None else operation

    def _plan_company(self, plan: Plan, record: Record) -> None:
        name, normalized_name = normalize_name(record.get("name"), "name")
        slug = require_slug(record.get("slug"))
        source_url, normalized_source_url = normalize_url(
            record.get("source_url"), "source_url"
        )
        source_checked_at = normalize_checked_at(record.get("source_checked_at"))
        establishment_values = (
            record.get("established_at"),
            record.get("established_precision"),
            record.get("established_source_url"),
        )
        if all(value is None for value in establishment_values):
            if record.get("establishment_gap_documented") is not True:
                raise ValueErrorDetail(
                    "missing establishment facts require "
                    "establishment_gap_documented=true"
                )
            established_at = established_precision = established_source_url = None
            established_source_normalized_url = None
        elif any(value is None for value in establishment_values):
            raise ValueErrorDetail(
                "establishment fields must be all present or all null"
            )
        else:
            if record.get("establishment_gap_documented") not in {None, False}:
                raise ValueErrorDetail(
                    "establishment_gap_documented is only valid when facts are absent"
                )
            established_at, established_precision = normalize_temporal(
                establishment_values[0], establishment_values[1], "established_at"
            )
            established_source_url, established_source_normalized_url = normalize_url(
                establishment_values[2], "established_source_url"
            )
        expected = {
            "name": name,
            "normalized_name": normalized_name,
            "slug": slug,
            "established_at": established_at,
            "established_precision": established_precision,
            "established_source_url": established_source_url,
            "established_source_normalized_url": established_source_normalized_url,
            "source_url": source_url,
            "normalized_source_url": normalized_source_url,
            "source_checked_at": source_checked_at,
        }
        existing = plan.catalog.one("companies", slug=slug)
        normalized_existing = plan.catalog.one(
            "companies", normalized_name=normalized_name
        )
        if normalized_existing and normalized_existing is not existing:
            raise IngestionFailure(
                "CONFLICT", slug, "company canonical name already uses another slug"
            )
        changed = False
        if existing:
            if not _same(existing, expected, tuple(expected)):
                raise IngestionFailure(
                    "CONFLICT", slug, "company already exists with different facts"
                )
            company = existing
        else:
            company = {"id": plan.catalog.allocate("companies"), **expected}
            plan.catalog.add("companies", company)
            plan.statements.append(
                Statement(
                    """INSERT INTO companies (
                        id, name, normalized_name, slug, established_at,
                        established_precision, established_source_url,
                        established_source_normalized_url, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    tuple(company[field] for field in ("id", *expected)),
                )
            )
            changed = True

        authorizations = _list(
            record.get("namespace_authorizations"),
            "namespace_authorizations",
            required=True,
        )
        seen_prefixes: set[str] = set()
        for index, raw_authorization in enumerate(authorizations):
            authorization = _mapping(
                raw_authorization, f"namespace_authorizations[{index}]"
            )
            prefix = require_string(
                authorization.get("namespace_prefix"), "namespace_prefix"
            )
            if prefix in seen_prefixes:
                raise ValueErrorDetail(
                    "namespace_authorizations contains a duplicate prefix"
                )
            seen_prefixes.add(prefix)
            namespace = plan.catalog.one("namespaces", prefix=prefix)
            if not namespace:
                raise IngestionFailure(
                    "ERROR", slug, f"unknown namespace prefix {prefix}"
                )
            auth_source_url, auth_normalized_url = normalize_url(
                authorization.get("source_url"), "authorization.source_url"
            )
            auth_checked_at = normalize_checked_at(
                authorization.get("source_checked_at"),
                "authorization.source_checked_at",
            )
            auth_expected = {
                "namespace_id": namespace["id"],
                "company_id": company["id"],
                "source_url": auth_source_url,
                "normalized_source_url": auth_normalized_url,
                "source_checked_at": auth_checked_at,
            }
            existing_auth = plan.catalog.one(
                "namespace_companies",
                namespace_id=namespace["id"],
                company_id=company["id"],
            )
            if existing_auth:
                if not _same(existing_auth, auth_expected, tuple(auth_expected)):
                    raise IngestionFailure(
                        "CONFLICT", slug, f"namespace {prefix} authorization differs"
                    )
                continue
            plan.catalog.add("namespace_companies", auth_expected)
            plan.statements.append(
                Statement(
                    """INSERT INTO namespace_companies (
                        namespace_id, company_id, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?)""",
                    tuple(auth_expected.values()),
                )
            )
            changed = True
        if changed:
            plan.valid("company", slug, "company and authorizations are valid")
        else:
            plan.skipped("company", slug, "exact company duplicate")

    def _plan_model(self, plan: Plan, record: Record) -> None:
        name, normalized_name = normalize_name(
            record.get("canonical_name"), "canonical_name"
        )
        registry_no = require_string(record.get("registry_no"), "registry_no")
        company_slug = require_slug(record.get("company_slug"), "company_slug")
        prefix = require_string(record.get("namespace_prefix"), "namespace_prefix")
        sequence = record.get("sequence")
        if isinstance(sequence, bool) or not isinstance(sequence, int):
            raise ValueErrorDetail("sequence must be an integer")
        if not 1 <= sequence <= 999:
            raise ValueErrorDetail("sequence must be between 1 and 999")
        namespace = plan.catalog.one("namespaces", prefix=prefix)
        company = plan.catalog.one("companies", slug=company_slug)
        if not namespace:
            raise IngestionFailure(
                "ERROR", registry_no, f"unknown namespace prefix {prefix}"
            )
        if not company:
            raise IngestionFailure(
                "ERROR", registry_no, f"unknown company {company_slug}"
            )
        if not plan.catalog.one(
            "namespace_companies",
            namespace_id=namespace["id"],
            company_id=company["id"],
        ):
            raise IngestionFailure(
                "ERROR", registry_no, "company is not authorized for this namespace"
            )
        if registry_no != f"{prefix}{sequence:03d}":
            raise ValueErrorDetail(
                "registry_no does not match namespace prefix and sequence"
            )
        release_at, release_precision = normalize_temporal(
            record.get("release_at"), record.get("release_precision"), "release_at"
        )
        if release_precision == "year":
            raise ValueErrorDetail("model release precision may not be year")
        release_source_url, release_source_normalized_url = normalize_url(
            record.get("release_source_url"), "release_source_url"
        )
        source_checked_at = normalize_checked_at(record.get("source_checked_at"))
        published_at = normalize_temporal(
            record.get("published_at"), "timestamp", "published_at"
        )[0]
        status = require_string(record.get("status"), "status")
        if status not in {"preview", "active", "deprecated", "stealth"}:
            raise ValueErrorDetail("status is invalid")
        if (prefix == "00") != (status == "stealth"):
            raise IngestionFailure(
                "ERROR",
                registry_no,
                "namespace 00 and stealth status must be used together",
            )
        exception = record.get("sequence_exception_reason")
        if exception not in {None, "late_backfill"}:
            raise ValueErrorDetail("sequence_exception_reason is invalid")
        expected = {
            "canonical_name": name,
            "normalized_name": normalized_name,
            "company_id": company["id"],
            "namespace_id": namespace["id"],
            "sequence": sequence,
            "registry_no": registry_no,
            "release_at": release_at,
            "release_precision": release_precision,
            "release_source_url": release_source_url,
            "release_source_normalized_url": release_source_normalized_url,
            "source_checked_at": source_checked_at,
            "published_at": published_at,
            "status": status,
            "sequence_exception_reason": exception,
        }
        existing = plan.catalog.one("models", registry_no=registry_no)
        if existing:
            if not _same(existing, expected, tuple(expected)):
                raise IngestionFailure(
                    "CONFLICT", registry_no, "model already exists with different facts"
                )
            model = existing
            changed = False
        else:
            self._validate_new_sequence(plan.catalog, namespace, expected)
            collision = plan.catalog.one("models", normalized_name=normalized_name)
            alias_collision = plan.catalog.one(
                "model_aliases", normalized_name=normalized_name
            )
            if collision or alias_collision:
                raise IngestionFailure(
                    "CONFLICT", registry_no, "model canonical name collides"
                )
            model = {"id": plan.catalog.allocate("models"), **expected}
            plan.catalog.add("models", model)
            plan.statements.append(
                Statement(
                    """INSERT INTO models (
                        id, canonical_name, normalized_name, company_id,
                        namespace_id, sequence, registry_no, release_at,
                        release_precision, release_source_url,
                        release_source_normalized_url, source_checked_at,
                        published_at, status, sequence_exception_reason
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    tuple(model[field] for field in ("id", *expected)),
                )
            )
            changed = True

        aliases = _list(record.get("aliases"), "aliases")
        seen_aliases: set[str] = set()
        for index, raw_alias in enumerate(aliases):
            alias = _mapping(raw_alias, f"aliases[{index}]")
            alias_name, normalized_alias = normalize_name(
                alias.get("name"), "alias.name"
            )
            if normalized_alias in seen_aliases:
                raise ValueErrorDetail("aliases contains a duplicate normalized name")
            seen_aliases.add(normalized_alias)
            source_url, normalized_source_url = normalize_url(
                alias.get("source_url"), "alias.source_url"
            )
            checked_at = normalize_checked_at(
                alias.get("source_checked_at"), "alias.source_checked_at"
            )
            alias_expected = {
                "model_id": model["id"],
                "name": alias_name,
                "normalized_name": normalized_alias,
                "source_url": source_url,
                "normalized_source_url": normalized_source_url,
                "source_checked_at": checked_at,
            }
            existing_alias = plan.catalog.one(
                "model_aliases", normalized_name=normalized_alias
            )
            canonical_collision = plan.catalog.one(
                "models", normalized_name=normalized_alias
            )
            if canonical_collision and canonical_collision["id"] != model["id"]:
                raise IngestionFailure(
                    "CONFLICT", registry_no, f"alias {alias_name} collides with a model"
                )
            if existing_alias:
                if not _same(existing_alias, alias_expected, tuple(alias_expected)):
                    raise IngestionFailure(
                        "CONFLICT", registry_no, f"alias {alias_name} already differs"
                    )
                continue
            alias_row = {"id": plan.catalog.allocate("model_aliases"), **alias_expected}
            plan.catalog.add("model_aliases", alias_row)
            plan.statements.append(
                Statement(
                    """INSERT INTO model_aliases (
                        id, model_id, name, normalized_name, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    tuple(alias_row.values()),
                )
            )
            changed = True

        redirect = record.get("redirect")
        if redirect is not None:
            redirect_data = _mapping(redirect, "redirect")
            target_registry_no = require_string(
                redirect_data.get("target_registry_no"), "redirect.target_registry_no"
            )
            target = plan.catalog.one("models", registry_no=target_registry_no)
            if not target:
                raise IngestionFailure(
                    "ERROR",
                    registry_no,
                    f"unknown redirect target {target_registry_no}",
                )
            target_namespace = plan.catalog.one("namespaces", id=target["namespace_id"])
            if (
                prefix != "00"
                or status != "stealth"
                or target_namespace is None
                or target_namespace["prefix"] == "00"
                or target["status"] == "stealth"
            ):
                raise IngestionFailure(
                    "ERROR", registry_no, "redirect endpoints have invalid roles"
                )
            if plan.catalog.one(
                "registry_redirects", source_model_id=target["id"]
            ) or plan.catalog.one("registry_redirects", target_model_id=model["id"]):
                raise IngestionFailure(
                    "ERROR", registry_no, "redirect chains and cycles are not allowed"
                )
            source_url, normalized_source_url = normalize_url(
                redirect_data.get("source_url"), "redirect.source_url"
            )
            checked_at = normalize_checked_at(
                redirect_data.get("source_checked_at"), "redirect.source_checked_at"
            )
            redirect_expected = {
                "source_model_id": model["id"],
                "target_model_id": target["id"],
                "source_url": source_url,
                "normalized_source_url": normalized_source_url,
                "source_checked_at": checked_at,
            }
            existing_redirect = plan.catalog.one(
                "registry_redirects", source_model_id=model["id"]
            )
            if existing_redirect:
                if not _same(
                    existing_redirect, redirect_expected, tuple(redirect_expected)
                ):
                    raise IngestionFailure(
                        "CONFLICT", registry_no, "redirect already differs"
                    )
            else:
                plan.catalog.add("registry_redirects", redirect_expected)
                plan.statements.append(
                    Statement(
                        """INSERT INTO registry_redirects (
                            source_model_id, target_model_id, source_url,
                            normalized_source_url, source_checked_at
                        ) VALUES (?, ?, ?, ?, ?)""",
                        tuple(redirect_expected.values()),
                    )
                )
                changed = True
        if changed:
            plan.valid("model", registry_no, "model is valid")
        else:
            plan.skipped("model", registry_no, "exact model duplicate")

    @staticmethod
    def _validate_new_sequence(
        catalog: Catalog, namespace: Record, model: Record
    ) -> None:
        existing = sorted(
            catalog.many("models", namespace_id=namespace["id"]),
            key=lambda row: int(row["sequence"]),
        )
        if existing and int(existing[-1]["sequence"]) == 999:
            raise IngestionFailure(
                "ERROR", model["registry_no"], "namespace sequence is exhausted"
            )
        expected_sequence = int(existing[-1]["sequence"]) + 1 if existing else 1
        if model["sequence"] != expected_sequence:
            raise IngestionFailure(
                "ERROR",
                model["registry_no"],
                f"next available namespace sequence is {expected_sequence:03d}",
            )
        if not existing:
            if model["sequence_exception_reason"] is not None:
                raise IngestionFailure(
                    "ERROR",
                    model["registry_no"],
                    "first model cannot be a late backfill",
                )
            return

        def compares_before(other: Record) -> bool:
            ordering = compare_temporal(
                model["release_at"],
                model["release_precision"],
                other["release_at"],
                other["release_precision"],
            )
            if ordering == 0:
                left = (
                    model["normalized_name"],
                    model["release_source_normalized_url"],
                )
                right = (
                    other["normalized_name"],
                    other["release_source_normalized_url"],
                )
                ordering = (left > right) - (left < right)
            return ordering < 0

        is_backfill = any(compares_before(other) for other in existing)
        if is_backfill and model["sequence_exception_reason"] != "late_backfill":
            raise IngestionFailure(
                "ERROR",
                model["registry_no"],
                "historical release requires sequence_exception_reason=late_backfill",
            )
        if not is_backfill and model["sequence_exception_reason"] is not None:
            raise IngestionFailure(
                "ERROR", model["registry_no"], "late_backfill is not justified"
            )

    def _plan_benchmark(self, plan: Plan, record: Record) -> None:
        name, normalized_name = normalize_name(
            record.get("canonical_name"), "canonical_name"
        )
        slug = require_slug(record.get("slug"))
        source_url, normalized_source_url = normalize_url(
            record.get("source_url"), "source_url"
        )
        checked_at = normalize_checked_at(record.get("source_checked_at"))
        expected = {
            "canonical_name": name,
            "normalized_name": normalized_name,
            "slug": slug,
            "source_url": source_url,
            "normalized_source_url": normalized_source_url,
            "source_checked_at": checked_at,
        }
        existing = plan.catalog.one("benchmarks", slug=slug)
        normalized_existing = plan.catalog.one(
            "benchmarks", normalized_name=normalized_name
        )
        if normalized_existing and normalized_existing is not existing:
            raise IngestionFailure(
                "CONFLICT", slug, "benchmark canonical name collides"
            )
        changed = False
        if existing:
            if not _same(existing, expected, tuple(expected)):
                raise IngestionFailure(
                    "CONFLICT", slug, "benchmark family already has different facts"
                )
            benchmark = existing
        else:
            if plan.catalog.one("benchmark_aliases", normalized_name=normalized_name):
                raise IngestionFailure(
                    "CONFLICT", slug, "benchmark canonical name collides"
                )
            benchmark = {"id": plan.catalog.allocate("benchmarks"), **expected}
            plan.catalog.add("benchmarks", benchmark)
            plan.statements.append(
                Statement(
                    """INSERT INTO benchmarks (
                        id, canonical_name, normalized_name, slug, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    tuple(benchmark.values()),
                )
            )
            changed = True

        changed |= self._plan_benchmark_aliases(plan, benchmark, record)
        changed |= self._plan_evaluators(plan, slug, record)
        changed |= self._plan_metrics(plan, slug, record)
        changed |= self._plan_versions(plan, benchmark, record)
        if changed:
            plan.valid("benchmark", slug, "benchmark family and versions are valid")
        else:
            plan.skipped("benchmark", slug, "exact benchmark duplicate")

    def _plan_benchmark_aliases(
        self, plan: Plan, benchmark: Record, record: Record
    ) -> bool:
        changed = False
        seen: set[str] = set()
        for raw_alias in _list(record.get("aliases"), "aliases"):
            alias = _mapping(raw_alias, "alias")
            name, normalized_name = normalize_name(alias.get("name"), "alias.name")
            if normalized_name in seen:
                raise ValueErrorDetail("aliases contains a duplicate normalized name")
            seen.add(normalized_name)
            source_url, normalized_source_url = normalize_url(
                alias.get("source_url"), "alias.source_url"
            )
            checked_at = normalize_checked_at(
                alias.get("source_checked_at"), "alias.source_checked_at"
            )
            expected = {
                "benchmark_id": benchmark["id"],
                "name": name,
                "normalized_name": normalized_name,
                "source_url": source_url,
                "normalized_source_url": normalized_source_url,
                "source_checked_at": checked_at,
            }
            existing = plan.catalog.one(
                "benchmark_aliases", normalized_name=normalized_name
            )
            collision = plan.catalog.one("benchmarks", normalized_name=normalized_name)
            if collision and collision["id"] != benchmark["id"]:
                raise IngestionFailure("CONFLICT", benchmark["slug"], "alias collides")
            if existing:
                if not _same(existing, expected, tuple(expected)):
                    raise IngestionFailure(
                        "CONFLICT", benchmark["slug"], "alias differs"
                    )
                continue
            row = {"id": plan.catalog.allocate("benchmark_aliases"), **expected}
            plan.catalog.add("benchmark_aliases", row)
            plan.statements.append(
                Statement(
                    """INSERT INTO benchmark_aliases (
                        id, benchmark_id, name, normalized_name, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    tuple(row.values()),
                )
            )
            changed = True
        return changed

    def _plan_evaluators(self, plan: Plan, identifier: str, record: Record) -> bool:
        changed = False
        seen: set[str] = set()
        for raw_evaluator in _list(record.get("evaluators"), "evaluators"):
            evaluator = _mapping(raw_evaluator, "evaluator")
            name, normalized_name = normalize_name(
                evaluator.get("name"), "evaluator.name"
            )
            key = require_key(evaluator.get("key"), "evaluator.key")
            if key in seen:
                raise ValueErrorDetail("evaluators contains a duplicate key")
            seen.add(key)
            source_url, normalized_source_url = normalize_url(
                evaluator.get("source_url"), "evaluator.source_url"
            )
            checked_at = normalize_checked_at(
                evaluator.get("source_checked_at"), "evaluator.source_checked_at"
            )
            expected = {
                "name": name,
                "normalized_name": normalized_name,
                "key": key,
                "source_url": source_url,
                "normalized_source_url": normalized_source_url,
                "source_checked_at": checked_at,
            }
            existing = plan.catalog.one("evaluator_organizations", key=key)
            normalized_existing = plan.catalog.one(
                "evaluator_organizations", normalized_name=normalized_name
            )
            if normalized_existing and normalized_existing is not existing:
                raise IngestionFailure(
                    "CONFLICT", identifier, "evaluator name collides"
                )
            if existing:
                if not _same(existing, expected, tuple(expected)):
                    raise IngestionFailure(
                        "CONFLICT", identifier, f"evaluator {key} differs"
                    )
                continue
            row = {"id": plan.catalog.allocate("evaluator_organizations"), **expected}
            plan.catalog.add("evaluator_organizations", row)
            plan.statements.append(
                Statement(
                    """INSERT INTO evaluator_organizations (
                        id, name, normalized_name, key, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    tuple(row.values()),
                )
            )
            changed = True
        return changed

    def _plan_metrics(self, plan: Plan, identifier: str, record: Record) -> bool:
        changed = False
        seen: set[str] = set()
        for raw_metric in _list(record.get("metrics"), "metrics"):
            metric = _mapping(raw_metric, "metric")
            name = require_string(metric.get("name"), "metric.name")
            key = require_key(metric.get("key"), "metric.key")
            if key in seen:
                raise ValueErrorDetail("metrics contains a duplicate key")
            seen.add(key)
            storage_kind = require_string(
                metric.get("storage_kind"), "metric.storage_kind"
            )
            if storage_kind not in {"decimal", "integer", "text"}:
                raise ValueErrorDetail("metric.storage_kind is invalid")
            unit = require_string(metric.get("unit"), "metric.unit")
            display_precision = metric.get("display_precision")
            if (
                isinstance(display_precision, bool)
                or not isinstance(display_precision, int)
                or display_precision < 0
                or (storage_kind == "text" and display_precision != 0)
            ):
                raise ValueErrorDetail("metric.display_precision is invalid")
            minimum = metric.get("minimum_value")
            maximum = metric.get("maximum_value")
            if storage_kind == "text" and (minimum is not None or maximum is not None):
                raise ValueErrorDetail("text metrics may not have numeric bounds")
            minimum_value = (
                canonical_decimal(minimum, "metric.minimum_value")
                if minimum is not None
                else None
            )
            maximum_value = (
                canonical_decimal(maximum, "metric.maximum_value")
                if maximum is not None
                else None
            )
            if (
                minimum_value is not None
                and maximum_value is not None
                and Decimal(minimum_value) > Decimal(maximum_value)
            ):
                raise ValueErrorDetail("metric minimum exceeds maximum")
            source_url, normalized_source_url = normalize_url(
                metric.get("source_url"), "metric.source_url"
            )
            checked_at = normalize_checked_at(
                metric.get("source_checked_at"), "metric.source_checked_at"
            )
            expected = {
                "name": name,
                "key": key,
                "storage_kind": storage_kind,
                "unit": unit,
                "display_precision": display_precision,
                "minimum_value": minimum_value,
                "maximum_value": maximum_value,
                "source_url": source_url,
                "normalized_source_url": normalized_source_url,
                "source_checked_at": checked_at,
            }
            existing = plan.catalog.one("metrics", key=key)
            if existing:
                if not _same(existing, expected, tuple(expected)):
                    raise IngestionFailure(
                        "CONFLICT", identifier, f"metric {key} differs"
                    )
                continue
            row = {"id": plan.catalog.allocate("metrics"), **expected}
            plan.catalog.add("metrics", row)
            plan.statements.append(
                Statement(
                    """INSERT INTO metrics (
                        id, name, key, storage_kind, unit, display_precision,
                        minimum_value, maximum_value, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    tuple(row.values()),
                )
            )
            changed = True
        return changed

    def _plan_versions(self, plan: Plan, benchmark: Record, record: Record) -> bool:
        changed = False
        versions = _list(record.get("versions"), "versions", required=True)
        seen: set[tuple[str, str]] = set()
        for raw_version in versions:
            version_record = _mapping(raw_version, "version")
            version = require_string(version_record.get("version"), "version")
            version_slug = require_version_slug(version_record.get("version_slug"))
            if (version, version_slug) in seen:
                raise ValueErrorDetail("versions contains a duplicate")
            seen.add((version, version_slug))
            release_at, release_precision = normalize_temporal(
                version_record.get("release_at"),
                version_record.get("release_precision"),
                "version.release_at",
            )
            if release_precision == "year":
                raise ValueErrorDetail(
                    "benchmark version release precision may not be year"
                )
            metric_key = require_key(
                version_record.get("metric_key"), "version.metric_key"
            )
            metric = plan.catalog.one("metrics", key=metric_key)
            if not metric:
                raise IngestionFailure(
                    "ERROR", benchmark["slug"], f"unknown metric {metric_key}"
                )
            source_url, normalized_source_url = normalize_url(
                version_record.get("source_url"), "version.source_url"
            )
            checked_at = normalize_checked_at(
                version_record.get("source_checked_at"), "version.source_checked_at"
            )
            evaluator_keys = self._evaluator_keys(
                version_record.get("evaluator_keys"), "version.evaluator_keys"
            )
            evaluators = []
            for key in evaluator_keys:
                evaluator = plan.catalog.one("evaluator_organizations", key=key)
                if not evaluator:
                    raise IngestionFailure(
                        "ERROR", benchmark["slug"], f"unknown evaluator {key}"
                    )
                evaluators.append(evaluator)
            expected = {
                "benchmark_id": benchmark["id"],
                "version": version,
                "version_slug": version_slug,
                "release_at": release_at,
                "release_precision": release_precision,
                "metric_id": metric["id"],
                "source_url": source_url,
                "normalized_source_url": normalized_source_url,
                "source_checked_at": checked_at,
            }
            existing = plan.catalog.one(
                "benchmark_versions", benchmark_id=benchmark["id"], version=version
            )
            by_slug = plan.catalog.one(
                "benchmark_versions",
                benchmark_id=benchmark["id"],
                version_slug=version_slug,
            )
            if by_slug and by_slug is not existing:
                raise IngestionFailure(
                    "CONFLICT",
                    benchmark["slug"],
                    f"version slug {version_slug} collides",
                )
            if existing:
                if not _same(existing, expected, tuple(expected)):
                    raise IngestionFailure(
                        "CONFLICT", benchmark["slug"], f"version {version} differs"
                    )
                existing_evaluator_ids = {
                    row["evaluator_organization_id"]
                    for row in plan.catalog.many(
                        "benchmark_version_evaluators",
                        benchmark_version_id=existing["id"],
                    )
                }
                if existing_evaluator_ids != {item["id"] for item in evaluators}:
                    raise IngestionFailure(
                        "CONFLICT",
                        benchmark["slug"],
                        f"version {version} evaluator set differs",
                    )
                continue
            row = {"id": plan.catalog.allocate("benchmark_versions"), **expected}
            plan.catalog.add("benchmark_versions", row)
            plan.statements.append(
                Statement(
                    """INSERT INTO benchmark_versions (
                        id, benchmark_id, version, version_slug, release_at,
                        release_precision, metric_id, source_url,
                        normalized_source_url, source_checked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    tuple(row.values()),
                )
            )
            for evaluator in evaluators:
                join = {
                    "benchmark_version_id": row["id"],
                    "evaluator_organization_id": evaluator["id"],
                }
                plan.catalog.add("benchmark_version_evaluators", join)
                plan.statements.append(
                    Statement(
                        "INSERT INTO benchmark_version_evaluators VALUES (?, ?)",
                        tuple(join.values()),
                    )
                )
            changed = True
        return changed

    @staticmethod
    def _evaluator_keys(value: object, field_name: str) -> list[str]:
        keys = [
            require_key(item, field_name)
            for item in _list(value, field_name, required=True)
        ]
        if len(keys) != len(set(keys)):
            raise ValueErrorDetail(f"{field_name} contains duplicates")
        return sorted(keys)

    def _plan_result(self, plan: Plan, record: Record) -> None:
        registry_no = require_string(
            record.get("model_registry_no"), "model_registry_no"
        )
        model = plan.catalog.one("models", registry_no=registry_no)
        if not model:
            raise IngestionFailure("ERROR", registry_no, "unknown model")
        benchmark_slug = require_slug(record.get("benchmark_slug"), "benchmark_slug")
        benchmark = plan.catalog.one("benchmarks", slug=benchmark_slug)
        if not benchmark:
            raise IngestionFailure("ERROR", registry_no, "unknown benchmark family")
        version_text = require_string(
            record.get("benchmark_version"), "benchmark_version"
        )
        version = plan.catalog.one(
            "benchmark_versions", benchmark_id=benchmark["id"], version=version_text
        )
        if not version:
            raise IngestionFailure("ERROR", registry_no, "unknown benchmark version")
        metric_key = require_key(record.get("metric_key"), "metric_key")
        metric = plan.catalog.one("metrics", key=metric_key)
        if not metric:
            raise IngestionFailure("ERROR", registry_no, f"unknown metric {metric_key}")
        if metric["id"] != version["metric_id"]:
            raise IngestionFailure("ERROR", registry_no, "metric/version mismatch")

        reasoning_level = require_string(
            record.get("reasoning_level", ""), "reasoning_level", allow_empty=True
        )
        reported_at, reported_precision = normalize_temporal(
            record.get("reported_at"), record.get("reported_precision"), "reported_at"
        )
        if reported_precision == "year":
            raise ValueErrorDetail("result reported precision may not be year")
        sources = self._result_sources(record)
        primary = next(source for source in sources if source["primary"])
        run_ref_value = record.get("run_ref")
        if run_ref_value is None:
            if record.get("source_has_single_run") is not True:
                raise IngestionFailure(
                    "ERROR",
                    registry_no,
                    "missing run_ref is ambiguous without source_has_single_run=true",
                )
            run_ref = f"source:{primary['normalized_url']}#{reported_at}"
        else:
            run_ref = require_string(run_ref_value, "run_ref")
        evaluator_keys = self._evaluator_keys(
            record.get("evaluator_keys"), "evaluator_keys"
        )
        evaluators = []
        for key in evaluator_keys:
            evaluator = plan.catalog.one("evaluator_organizations", key=key)
            if not evaluator:
                raise IngestionFailure("ERROR", run_ref, f"unknown evaluator {key}")
            evaluators.append(evaluator)
        evaluator_set_key = _hash_components(["v1", *evaluator_keys])
        score_raw = require_string(record.get("score_raw"), "score_raw")
        score_value = self._score(metric, record.get("score_value"))
        result_key = _hash_components(
            [
                "v1",
                registry_no,
                reasoning_level,
                benchmark_slug,
                version_text,
                metric_key,
                run_ref,
            ]
        )
        identity = {
            "model_id": model["id"],
            "reasoning_level": reasoning_level,
            "benchmark_version_id": version["id"],
            "metric_id": metric["id"],
            "run_ref": run_ref,
        }
        expected = {
            **identity,
            "result_key": result_key,
            "score_value": score_value,
            "score_raw": score_raw,
            "reported_at": reported_at,
            "reported_precision": reported_precision,
            "evaluator_set_key": evaluator_set_key,
            "primary_source_url": primary["url"],
            "primary_source_normalized_url": primary["normalized_url"],
            "primary_source_checked_at": primary["checked_at"],
        }
        existing = plan.catalog.one("results", **identity)
        if existing:
            core_fields = tuple(expected)
            if not _same(existing, expected, core_fields):
                raise IngestionFailure(
                    "CONFLICT",
                    result_key,
                    "logical result identity has different facts",
                )
            existing_evaluator_ids = {
                row["evaluator_organization_id"]
                for row in plan.catalog.many(
                    "result_evaluators", result_id=existing["id"]
                )
            }
            if existing_evaluator_ids != {evaluator["id"] for evaluator in evaluators}:
                raise IngestionFailure(
                    "CONFLICT", result_key, "logical result evaluator set differs"
                )
            existing_sources = {
                (
                    row["source_url"],
                    row["normalized_source_url"],
                    row["source_checked_at"],
                )
                for row in plan.catalog.many("result_sources", result_id=existing["id"])
            }
            incoming_sources = {
                (source["url"], source["normalized_url"], source["checked_at"])
                for source in sources
                if not source["primary"]
            }
            if not existing_sources.issubset(incoming_sources):
                raise IngestionFailure(
                    "CONFLICT", result_key, "incoming result omits an existing source"
                )
            new_sources = incoming_sources - existing_sources
            for source in sources:
                key = (source["url"], source["normalized_url"], source["checked_at"])
                if not source["primary"] and key in new_sources:
                    self._append_result_source(plan, existing, source)
            if new_sources:
                plan.valid(
                    "result", result_key, "additional official sources are valid"
                )
            else:
                plan.skipped("result", result_key, "exact result duplicate")
            return

        result = {"id": plan.catalog.allocate("results"), **expected}
        plan.catalog.add("results", result)
        plan.statements.append(
            Statement(
                """INSERT INTO results (
                    id, model_id, reasoning_level, benchmark_version_id,
                    metric_id, run_ref, result_key, score_value, score_raw,
                    reported_at, reported_precision, evaluator_set_key,
                    primary_source_url, primary_source_normalized_url,
                    primary_source_checked_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                tuple(result.values()),
            )
        )
        for evaluator in evaluators:
            join = {
                "result_id": result["id"],
                "evaluator_organization_id": evaluator["id"],
            }
            plan.catalog.add("result_evaluators", join)
            plan.statements.append(
                Statement(
                    "INSERT INTO result_evaluators VALUES (?, ?)", tuple(join.values())
                )
            )
        for source in sources:
            if not source["primary"]:
                self._append_result_source(plan, result, source)
        plan.valid("result", result_key, "result is valid")

    @staticmethod
    def _score(metric: Record, value: object) -> str | None:
        if metric["storage_kind"] == "text":
            if value is not None:
                raise ValueErrorDetail("text metrics require score_value to be null")
            return None
        if value is None:
            raise ValueErrorDetail("numeric metrics require score_value")
        canonical = canonical_decimal(value, "score_value")
        decimal = Decimal(canonical)
        if (
            metric["storage_kind"] == "integer"
            and decimal != decimal.to_integral_value()
        ):
            raise ValueErrorDetail("integer metric rejects fractional score_value")
        if metric["minimum_value"] is not None and decimal < Decimal(
            metric["minimum_value"]
        ):
            raise ValueErrorDetail("score_value is below the metric minimum")
        if metric["maximum_value"] is not None and decimal > Decimal(
            metric["maximum_value"]
        ):
            raise ValueErrorDetail("score_value is above the metric maximum")
        return canonical

    @staticmethod
    def _result_sources(record: Record) -> list[Record]:
        raw_sources = _list(record.get("sources"), "sources", required=True)
        sources: list[Record] = []
        normalized_seen: set[str] = set()
        primary_count = 0
        for raw_source in raw_sources:
            source = _mapping(raw_source, "source")
            url, normalized_url = normalize_url(source.get("url"), "source.url")
            checked_at = normalize_checked_at(
                source.get("checked_at"), "source.checked_at"
            )
            primary = source.get("primary") is True
            if source.get("primary") not in {True, False}:
                raise ValueErrorDetail("source.primary must be a boolean")
            if normalized_url in normalized_seen:
                raise ValueErrorDetail("sources contains duplicate normalized URLs")
            normalized_seen.add(normalized_url)
            primary_count += int(primary)
            if not primary and source.get("same_run") is not True:
                raise ValueErrorDetail(
                    "each additional source requires same_run=true curator confirmation"
                )
            sources.append(
                {
                    "url": url,
                    "normalized_url": normalized_url,
                    "checked_at": checked_at,
                    "primary": primary,
                }
            )
        if primary_count != 1:
            raise ValueErrorDetail("sources must contain exactly one primary source")
        return sources

    @staticmethod
    def _append_result_source(plan: Plan, result: Record, source: Record) -> None:
        row = {
            "id": plan.catalog.allocate("result_sources"),
            "result_id": result["id"],
            "source_url": source["url"],
            "normalized_source_url": source["normalized_url"],
            "source_checked_at": source["checked_at"],
        }
        plan.catalog.add("result_sources", row)
        plan.statements.append(
            Statement(
                """INSERT INTO result_sources (
                    id, result_id, source_url, normalized_source_url,
                    source_checked_at
                ) VALUES (?, ?, ?, ?, ?)""",
                tuple(row.values()),
            )
        )
