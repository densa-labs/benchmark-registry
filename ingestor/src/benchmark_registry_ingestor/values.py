"""Canonical value validation shared by ingestion operations."""

from __future__ import annotations

import re
import unicodedata
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation
from urllib.parse import SplitResult, urlsplit, urlunsplit


class ValueErrorDetail(ValueError):
    """A curated input value violates the frozen data contract."""


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
VERSION_SLUG_RE = re.compile(r"^[a-z0-9._-]+$")
YEAR_RE = re.compile(r"^[0-9]{4}$")


def require_string(value: object, field: str, *, allow_empty: bool = False) -> str:
    if not isinstance(value, str) or (not allow_empty and not value):
        raise ValueErrorDetail(f"{field} must be a non-empty string")
    if "\x00" in value:
        raise ValueErrorDetail(f"{field} may not contain NUL")
    return value


def normalize_name(value: object, field: str) -> tuple[str, str]:
    name = require_string(value, field)
    return name, unicodedata.normalize("NFKC", name).casefold()


def require_slug(value: object, field: str = "slug") -> str:
    slug = require_string(value, field)
    if not SLUG_RE.fullmatch(slug):
        raise ValueErrorDetail(f"{field} must be lowercase ASCII kebab-case")
    return slug


def require_key(value: object, field: str) -> str:
    return require_slug(value, field)


def require_version_slug(value: object) -> str:
    slug = require_string(value, "version_slug")
    if not VERSION_SLUG_RE.fullmatch(slug):
        raise ValueErrorDetail(
            "version_slug must contain only lowercase ASCII letters, digits, '.', '_', or '-'"
        )
    return slug


def normalize_url(value: object, field: str) -> tuple[str, str]:
    exact = require_string(value, field)
    try:
        parsed = urlsplit(exact)
        port = parsed.port
    except ValueError as exc:
        raise ValueErrorDetail(f"{field} is not a valid URL: {exc}") from exc
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise ValueErrorDetail(f"{field} must be an absolute HTTP(S) URL")

    host = parsed.hostname.casefold()
    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    userinfo = ""
    if parsed.username is not None:
        userinfo = parsed.username
        if parsed.password is not None:
            userinfo += f":{parsed.password}"
        userinfo += "@"
    default_port = (parsed.scheme.lower(), port) in {("http", 80), ("https", 443)}
    netloc = f"{userinfo}{host}"
    if port is not None and not default_port:
        netloc += f":{port}"
    normalized = urlunsplit(
        SplitResult(parsed.scheme.lower(), netloc, parsed.path, parsed.query, "")
    )
    return exact, normalized


def normalize_temporal(value: object, precision: object, field: str) -> tuple[str, str]:
    text = require_string(value, field)
    precision_text = require_string(precision, f"{field}_precision")
    if precision_text == "year":
        if not YEAR_RE.fullmatch(text):
            raise ValueErrorDetail(f"{field} must be YYYY for year precision")
        return text, precision_text
    if precision_text == "date":
        try:
            parsed = date.fromisoformat(text)
        except ValueError as exc:
            raise ValueErrorDetail(
                f"{field} must be an ISO 8601 calendar date"
            ) from exc
        if text != parsed.isoformat():
            raise ValueErrorDetail(f"{field} must use canonical ISO 8601 date form")
        return text, precision_text
    if precision_text == "timestamp":
        try:
            parsed_timestamp = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueErrorDetail(f"{field} must be an ISO 8601 timestamp") from exc
        if parsed_timestamp.tzinfo is None:
            raise ValueErrorDetail(f"{field} timestamp must include a UTC offset")
        normalized = parsed_timestamp.astimezone(UTC).isoformat().replace("+00:00", "Z")
        return normalized, precision_text
    raise ValueErrorDetail(f"{field}_precision is invalid")


def normalize_checked_at(value: object, field: str = "source_checked_at") -> str:
    return normalize_temporal(value, "timestamp", field)[0]


def canonical_decimal(value: object, field: str) -> str:
    if isinstance(value, bool) or not isinstance(value, (str, int, Decimal)):
        raise ValueErrorDetail(f"{field} must be a decimal string or integer")
    try:
        number = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueErrorDetail(f"{field} is not a decimal") from exc
    if not number.is_finite():
        raise ValueErrorDetail(f"{field} must be finite")
    if number == 0:
        return "0"
    rendered = format(number, "f")
    if "." in rendered:
        rendered = rendered.rstrip("0").rstrip(".")
    if rendered.startswith("."):
        rendered = f"0{rendered}"
    if rendered.startswith("-."):
        rendered = rendered.replace("-.", "-0.", 1)
    return rendered


def temporal_order_key(value: str) -> tuple[int, ...]:
    """Return components suitable for precision-aware comparisons."""
    if len(value) == 10:
        parsed = date.fromisoformat(value)
        return parsed.year, parsed.month, parsed.day
    parsed_timestamp = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        UTC
    )
    return (
        parsed_timestamp.year,
        parsed_timestamp.month,
        parsed_timestamp.day,
        parsed_timestamp.hour,
        parsed_timestamp.minute,
        parsed_timestamp.second,
        parsed_timestamp.microsecond,
    )


def compare_temporal(
    left_value: str,
    left_precision: str,
    right_value: str,
    right_precision: str,
) -> int:
    left = temporal_order_key(left_value)
    right = temporal_order_key(right_value)
    if "year" in {left_precision, right_precision}:
        left = left[:1]
        right = right[:1]
    elif "date" in {left_precision, right_precision}:
        left = left[:3]
        right = right[:3]
    return (left > right) - (left < right)
