"""Fixed P11.9 sample, never a crawl. Maximum 44 requests per run.

Every normal public request, cold or warm, must read zero D1 rows.
Cloudflare Access stays enabled. The staging transport uses its existing login.
"""
import argparse
import json
import re
import time
from pathlib import Path

from live_http import LiveClient

EXACT = "/benchmarks/automationbench/1-0-6?view=history&result=4b14afd90fb1cc979b76f2f3a99a5f1e5610e93a84bd6f19559467343de5481b"
PATHS = ["/", "/models", "/models/10005", "/benchmarks", "/benchmarks/gpqa", "/benchmarks/gpqa/diamond", "/companies", "/companies/openai", EXACT, "/api/models", "/api/search?q=gpt", "/models?page=2", "/benchmarks/gpqa/diamond?sort=model&order=desc"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", required=True, choices=["staging.benchmarkregistry.org", "benchmarkregistry.org"])
    parser.add_argument("--cloudflared", default="cloudflared")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    client = LiveClient(args.host, args.cloudflared)
    evidence = []
    for path in PATHS:
        samples = []
        for attempt in range(3):
            start = time.monotonic()
            status, headers, body = client.request(path)
            assert status == 200, (path, status)
            assert headers.get("x-registry-cache") in {"hit", "miss", "bypass"}, (path, headers.get("x-registry-cache"))
            assert "stale" not in headers.get("x-registry-cache", "")
            if client.staging:
                assert headers.get("x-robots-tag") == "noindex, nofollow, noarchive"
                if not path.startswith("/api"):
                    assert "STAGING | Benchmark Registry" in body and "staging-banner" in body
            elif not path.startswith("/api"):
                assert "staging-banner" not in body and "STAGING |" not in body
            if not path.startswith("/api"):
                assert 'id="registry-initial-document"' in body and "<h1" in body
                canonical = re.search(r'<link rel="canonical" href="([^"]+)"', body)
                assert canonical
                expected = "https://benchmarkregistry.org" + (path if path == EXACT else path.split("?")[0])
                assert canonical.group(1).replace("&amp;", "&") == expected, (path, canonical.group(1))
                if not client.staging:
                    controlled = "?" in path and path != EXACT
                    assert ('<meta name="robots" content="noindex' in body) == controlled, path
            samples.append({"status":status,"cache":headers.get("x-registry-cache"),"d1_queries":int(headers["x-registry-d1-queries"]),"d1_rows":int(headers["x-registry-d1-rows"]),"server_timing":headers.get("server-timing"),"duration_ms":round((time.monotonic()-start)*1000,2),"bytes":len(body.encode()),"revision":headers.get("x-registry-revision")})
            samples[-1]["read_store_reads"] = int(headers["x-registry-read-store-reads"])
            assert samples[-1]["d1_queries"] == 0 and samples[-1]["d1_rows"] == 0, path
            if attempt >= 1 and samples[-1]["cache"] == "hit":
                break
        # Cache API is per edge location; separate transports can reach a different location.
        if "q=" not in path:
            assert samples[-1]["cache"] == "hit", path
        assert samples[-1]["d1_queries"] == 0 and samples[-1]["d1_rows"] == 0, path
        evidence.append({"path":path,"samples":samples})
    for path, expected_status in [("/models/99999",404),("/api/models?sort=score",400),("/api/models/99999",404)]:
        status, headers, _ = client.request(path)
        assert status == expected_status and headers.get("cache-control") == "no-store", (path,status)
        evidence.append({"path":path,"status":status,"cache_control":headers.get("cache-control")})
    status, headers, body = client.request("/robots.txt")
    assert status == 200
    assert ("Disallow: /" in body) == client.staging
    evidence.append({"path":"/robots.txt","status":status,"body":body.strip()})
    status, headers, body = client.request("/api/revision")
    assert status == 200 and int(headers["x-registry-d1-rows"]) == 0
    assert json.loads(body)["revision"] == evidence[0]["samples"][0]["revision"]
    evidence.append({"path":"/api/revision","status":status,"d1_rows":0})
    if client.staging:
        status, _, _ = client.request("/api/models", authenticate=False)
        assert status in {302,303,401,403}, status
        evidence.append({"path":"/api/models","unauthenticated_status":status})
    Path(args.output).write_text(json.dumps({"host":args.host,"requests":sum(len(check.get("samples",[None])) for check in evidence),"checks":evidence},indent=2)+"\n")
    print(f"PASS: bounded {args.host} cold/warm, status, SEO, environment and robots verification")


if __name__ == "__main__":
    main()
