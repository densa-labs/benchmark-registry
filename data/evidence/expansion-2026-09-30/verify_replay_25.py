"""Run the controlled ingestor's commit planner with all mutations prohibited."""
import json
import os
import subprocess
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "ingestor/src"))
from benchmark_registry_ingestor.database import RemoteD1Database
from benchmark_registry_ingestor.engine import Ingestor

environment = sys.argv[1]
assert environment in ("staging", "production")
config = json.loads((ROOT / "app/wrangler.maintenance.jsonc").read_text())["env"][environment]
runtime = {**os.environ, "WRANGLER_SEND_METRICS": "false",
           "WRANGLER_LOG_PATH": "/private/tmp/registry-expansion-private-wrangler.log"}
credential = json.loads(subprocess.check_output(
    [str(ROOT / "app/node_modules/.bin/wrangler"), "auth", "token", "--json"],
    cwd=ROOT / "app", env=runtime, stderr=subprocess.DEVNULL))
remote = RemoteD1Database(config["account_id"], config["d1_databases"][0]["database_id"], credential["token"])


class NoWriteDatabase:
    writes = 0

    def query(self, sql, params=()):
        return remote.query(sql, params)

    def execute_batch(self, statements):
        self.writes += len(statements)
        raise AssertionError("Replay unexpectedly planned canonical mutations; nothing written")


before = remote.query("SELECT * FROM registry_revision")
payload = json.loads((HERE / "cohort-25-pending-batch.json").read_text())
db = NoWriteDatabase()
callbacks = []
outcomes = Ingestor(db, lambda: callbacks.append("unexpected publication")).run("batch", payload, commit=True)
assert all(x.status == "SKIPPED" for x in outcomes)
assert not callbacks and db.writes == 0
after = remote.query("SELECT * FROM registry_revision")
assert before == after
counts = remote.query("SELECT (SELECT count(*) FROM results) AS results, (SELECT count(*) FROM benchmarks) AS benchmarks, (SELECT count(*) FROM benchmark_versions) AS versions")
report = {"environment": environment, "status": "PASS", "statuses": dict(Counter(x.status for x in outcomes)),
          "canonical_mutations": 0, "materialization_callbacks": 0,
          "canonical_revision_unchanged": True, "counts": counts[0]}
(HERE / (environment + "-cohort-25-replay.json")).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
