"""Approved local SQLite and remote Cloudflare D1 write adapters."""

from __future__ import annotations

import json
import os
import sqlite3
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol


class DatabaseFailure(RuntimeError):
    """A database request failed definitively."""


class AmbiguousWriteFailure(DatabaseFailure):
    """A remote mutation may have committed despite a transport failure."""


@dataclass(frozen=True)
class Statement:
    sql: str
    params: tuple[object, ...] = ()


class Database(Protocol):
    def query(self, sql: str, params: tuple[object, ...] = ()) -> list[dict[str, Any]]:
        """Return mapping rows for a read query."""

    def execute_batch(self, statements: list[Statement]) -> None:
        """Execute all mutations atomically."""


class LocalDatabase:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        if not self.path.is_file():
            raise DatabaseFailure(
                f"REGISTRY_LOCAL_DB_PATH does not identify an existing file: {self.path}"
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def query(self, sql: str, params: tuple[object, ...] = ()) -> list[dict[str, Any]]:
        with self._connect() as connection:
            return [dict(row) for row in connection.execute(sql, params).fetchall()]

    def execute_batch(self, statements: list[Statement]) -> None:
        if not statements:
            return
        connection = self._connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            for statement in statements:
                connection.execute(statement.sql, statement.params)
            connection.commit()
        except sqlite3.DatabaseError as exc:
            connection.rollback()
            raise DatabaseFailure(str(exc)) from exc
        finally:
            connection.close()


class RemoteD1Database:
    """Narrow adapter over Cloudflare's documented D1 HTTP query endpoint."""

    def __init__(
        self,
        account_id: str,
        database_id: str,
        api_token: str,
        *,
        base_url: str = "https://api.cloudflare.com/client/v4",
        timeout: float = 30,
    ):
        self.url = (
            f"{base_url.rstrip('/')}/accounts/{account_id}/d1/database/"
            f"{database_id}/query"
        )
        self.api_token = api_token
        self.timeout = timeout

    def _request(
        self, body: dict[str, object], *, mutation: bool
    ) -> list[dict[str, Any]]:
        request = urllib.request.Request(
            self.url,
            data=json.dumps(body, separators=(",", ":")).encode(),
            headers={
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                payload = json.loads(response.read())
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            if mutation and exc.code >= 500:
                raise AmbiguousWriteFailure(
                    f"remote D1 returned HTTP {exc.code}; commit state is unknown"
                ) from exc
            raise DatabaseFailure(
                f"remote D1 returned HTTP {exc.code}: {detail}"
            ) from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            error_type = AmbiguousWriteFailure if mutation else DatabaseFailure
            raise error_type(f"remote D1 transport failure: {exc}") from exc
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            error_type = AmbiguousWriteFailure if mutation else DatabaseFailure
            raise error_type("remote D1 returned an invalid JSON response") from exc

        if not payload.get("success"):
            errors = payload.get("errors") or []
            message = "; ".join(str(item.get("message", item)) for item in errors)
            raise DatabaseFailure(message or "remote D1 request failed")
        results = payload.get("result") or []
        if any(not item.get("success", False) for item in results):
            raise DatabaseFailure("one or more remote D1 statements failed")
        return results

    def query(self, sql: str, params: tuple[object, ...] = ()) -> list[dict[str, Any]]:
        results = self._request(
            {"sql": sql, "params": self._params(params)}, mutation=False
        )
        if not results:
            return []
        rows = results[0].get("results") or []
        return [dict(row) for row in rows]

    def execute_batch(self, statements: list[Statement]) -> None:
        if not statements:
            return
        self._request(
            {
                "batch": [
                    {"sql": statement.sql, "params": self._params(statement.params)}
                    for statement in statements
                ]
            },
            mutation=True,
        )

    @staticmethod
    def _params(params: tuple[object, ...]) -> list[str | None]:
        """Match the D1 HTTP API's string-or-null parameter representation."""
        return [None if value is None else str(value) for value in params]


def database_from_environment(target: str, *, commit: bool) -> Database:
    if target == "local":
        path = os.environ.get("REGISTRY_LOCAL_DB_PATH")
        if not path:
            raise DatabaseFailure("REGISTRY_LOCAL_DB_PATH is required for local mode")
        return LocalDatabase(path)
    if target != "remote":
        raise DatabaseFailure(f"unknown database target: {target}")

    values = {
        "CLOUDFLARE_ACCOUNT_ID": os.environ.get("CLOUDFLARE_ACCOUNT_ID"),
        "CLOUDFLARE_D1_DATABASE_ID": os.environ.get("CLOUDFLARE_D1_DATABASE_ID"),
        "CLOUDFLARE_API_TOKEN": os.environ.get("CLOUDFLARE_API_TOKEN"),
    }
    missing = [name for name, value in values.items() if not value]
    if missing:
        raise DatabaseFailure(f"remote mode requires {', '.join(missing)}")
    if commit and os.environ.get("REGISTRY_REMOTE_ATOMICITY_VERIFIED") != "1":
        raise DatabaseFailure(
            "remote commit is disabled until the disposable D1 atomicity probe passes "
            "and REGISTRY_REMOTE_ATOMICITY_VERIFIED=1 is set"
        )
    return RemoteD1Database(
        values["CLOUDFLARE_ACCOUNT_ID"] or "",
        values["CLOUDFLARE_D1_DATABASE_ID"] or "",
        values["CLOUDFLARE_API_TOKEN"] or "",
    )
