"""Read-only verification of the immutable reviewed twenty-fifth ingestion cohort."""
import concurrent.futures
import hashlib
import html
import json
import sys
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "app/scripts"))
from live_http import LiveClient

environment = sys.argv[1]
assert environment in ("staging", "production")
host = ("staging." if environment == "staging" else "") + "benchmarkregistry.org"
client = LiveClient(host, "/private/tmp/p119-tools/cloudflared")
batch = json.loads((HERE / "cohort-25-pending-batch.json").read_text())["records"]
candidates = [x["record"] for x in batch if x["operation"] == "result"]
before = json.loads((HERE / (environment + "-before.json")).read_text())
snapshot = json.loads((HERE / (environment + "-cohort-25-before.json")).read_text())
counts = {"model_result_counts": snapshot["model_result_counts"], "results": len(snapshot["results"])}
for row in before["models"]:
    row["result_count"] = counts["model_result_counts"].get(row["registry_no"], 0)
before["results"] = [None] * counts["results"]
models = {x["registry_no"]: x for x in before["models"]}
generations = set()


def request(path):
    status, headers, body = client.request(path)
    assert status == 200, (path, status)
    assert headers.get("x-registry-revision"), path
    assert headers.get("x-registry-d1-rows") == "0", (path, "public D1 rows")
    generations.add(headers["x-registry-revision"])
    if environment == "staging":
        assert headers.get("x-robots-tag") == "noindex, nofollow, noarchive"
    return headers, body


def api(path):
    return json.loads(request("/api" + path)[1])


def results(path):
    first = api(path + "?view=history&limit=500")["data"]
    rows = first["results"]
    for page in range(2, first["result_page"]["total_pages"] + 1):
        rows += api(path + f"?view=history&limit=500&page={page}")["data"]["results"]
    assert len(rows) == first["result_page"]["total_items"], path
    return rows


def result_key(record):
    # All records in this cohort were reviewed as one fallback-identifiable run.
    assert record["source_has_single_run"]
    url = next(x["url"] for x in record["sources"] if x["primary"])
    run = "source:" + url + "#" + record["reported_at"]
    components = ["v1", record["model_registry_no"], record["reasoning_level"],
                  record["benchmark_slug"], record["benchmark_version"],
                  record["metric_key"], run]
    return hashlib.sha256("\0".join(components).encode()).hexdigest()


by_model = defaultdict(list)
for record in candidates:
    by_model[record["model_registry_no"]].append(record)


for number in ["160001", "160002"]:
    by_model.setdefault(number, [])


def verify_model(item):
    number, records = item
    path = "/models/" + number
    rows = results(path)
    expected_count = models[number]["result_count"] + len(records)
    assert len(rows) == expected_count, (number, len(rows), expected_count)
    document = html.unescape(request(path + "?view=history&limit=500")[1])
    assert models[number]["canonical_name"] in document
    indexed = {x["result_key"]: x for x in rows}
    for record in records:
        key = result_key(record)
        assert key in indexed, (number, key)
        row = indexed[key]
        assert Decimal(row["score"]["value"]) == Decimal(record["score_value"])
        assert row["score"]["raw"] == record["score_raw"]
        assert row["benchmark"]["slug"] == record["benchmark_slug"]
        assert row["benchmark_version"] == record["benchmark_version"]
        assert row["reasoning_level"] == (record["reasoning_level"] or None)
        assert row["metric"]["key"] == record["metric_key"]
        assert row["primary_source_url"] == record["sources"][0]["url"]
        assert row["primary_source_url"] in document, (number, "source link")
        assert row["score"]["display"] in document, (number, "score formatting")
    # Default 50-row pagination remains coherent after additions.
    first = api(path + "?view=history")["data"]
    assert first["result_page"]["limit"] == 50
    assert first["result_page"]["total_items"] == expected_count
    if expected_count > 50:
        second = api(path + "?view=history&page=2")["data"]
        assert len(first["results"]) + len(second["results"]) == expected_count
        assert not ({x["result_key"] for x in first["results"]} &
                    {x["result_key"] for x in second["results"]})
    return {"registry_no": number, "before": models[number]["result_count"],
            "added": len(records), "after": len(rows), "checks": "PASS"}, rows


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    checked = list(pool.map(verify_model, sorted(by_model.items())))
model_rows = [x[0] for x in checked]
added_keys = {result_key(record) for record in candidates}
all_rows = [row for _, rows in checked for row in rows if row["result_key"] in added_keys]
version_paths = sorted({"/benchmarks/" + x["benchmark"]["slug"] + "/" +
                        x["benchmark_version_slug"] for x in all_rows})
exact_checks = []
for path in version_paths:
    rows = results(path)
    relevant = [x for x in all_rows if path == "/benchmarks/" + x["benchmark"]["slug"] +
                "/" + x["benchmark_version_slug"]]
    assert {x["result_key"] for x in relevant} <= {x["result_key"] for x in rows}
    document = html.unescape(request(path + "?view=history&limit=500")[1])
    assert relevant[0]["benchmark"]["name"] in document
    group_counts = Counter(x["model"]["registry_no"] for x in rows)
    for row in relevant:
        eligible = group_counts[row["model"]["registry_no"]] == 1
        assert bool(row["exact_result_href"]) == eligible, row["result_key"]
        exact_path = path + "?view=history&result=" + row["result_key"]
        exact_document = html.unescape(request(exact_path)[1])
        if eligible:
            assert 'rel="canonical" href="https://benchmarkregistry.org' + exact_path + '"' in exact_document
        else:
            assert 'content="noindex, follow"' in exact_document or environment == "staging"
        exact_checks.append({"result_key": row["result_key"], "eligible": eligible})

companies = sorted({models[number]["company_slug"] for number in by_model})
for company in companies:
    rows = results("/companies/" + company)
    expected = {result_key(record) for record in candidates
                if models[record["model_registry_no"]]["company_slug"] == company}
    assert expected <= {x["result_key"] for x in rows}
    request("/companies/" + company)


search_checks = []
for query, slug in [("CharXiv", "charxiv")]:
    response = api("/search?q=" + quote(query))["data"]
    assert any(x["entity_type"] == "benchmark" and x["href"] == "/benchmarks/" + slug
               for x in response), query
    search_checks.append({"query": query, "benchmark_slug": slug, "status": "PASS"})
    family_document = html.unescape(request("/benchmarks/" + slug)[1])
    assert 'rel="canonical" href="https://benchmarkregistry.org/benchmarks/' + slug + '"' in family_document

stats = api("/stats")["data"]
assert stats["benchmark_results"] == len(before["results"]) + len(candidates), stats
headers, sitemap = request("/sitemap.xml")
urls = [x.text for x in ElementTree.fromstring(sitemap).findall("{*}url/{*}loc")]
assert len(urls) == len(set(urls))
for path in version_paths:
    assert "https://benchmarkregistry.org" + path in urls
for row in all_rows:
    path = row["exact_result_href"]
    if path:
        assert "https://benchmarkregistry.org" + path in urls
    else:
        ambiguous = "/benchmarks/" + row["benchmark"]["slug"] + "/" + row["benchmark_version_slug"] + "?view=history&result=" + row["result_key"]
        assert "https://benchmarkregistry.org" + ambiguous not in urls
assert len(generations) == 1, generations
report = {"environment": environment, "status": "PASS", "new_results_verified": len(candidates),
          "models": model_rows, "benchmark_versions_verified": len(version_paths),
          "companies_verified": companies, "exact_results": exact_checks,
          "stats": stats, "sitemap_count": len(urls), "published_generations": sorted(generations),
          "search_checks": search_checks}
(HERE / (environment + "-cohort-25-public-verification.json")).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({key: report[key] for key in ["environment", "status", "new_results_verified", "benchmark_versions_verified", "sitemap_count", "published_generations"]}))
