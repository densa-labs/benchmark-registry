"""P11.7 initial-HTML crawl/link audit, including P11.6 indexing regression checks.

Usage: python3 app/scripts/verify-links-live.py HOST OUTPUT_DIR [CLOUDFLARED]
Uses the existing Access session on staging; does not change crawler protection.
"""
import concurrent.futures
import json
import runpy
from pathlib import Path
from crawl_graph import audit_graph, internal_links, discovery_state, result_link_errors

seo = runpy.run_path(str(Path(__file__).with_name('verify-seo-live.py')))
output = seo['OUTPUT']
request = seo['request']
expected = seo['expected']
ambiguous = set(seo['ambiguous'])
documents = {row['path']: (output / f'document-{index:04}.html').read_text()
             for index, row in enumerate(seo['documents'])}

# Crawl starts at the homepage. The sitemap is used only to detect missing pages.
# Load pagination discovered through real anchors; no sitemap edge is counted.
while True:
    more = set()
    for path, html in documents.items():
        links, _ = internal_links(path, html)
        more.update(target for target in links if discovery_state(target) and target not in documents)
    if not more:
        break

    def fetch_document(path):
        status, headers, html = request(path)
        assert status == 200, (path, status)
        seo['protection'](headers)
        doc = seo['Document'](html)
        assert doc.robots == ['noindex, follow'], path
        assert doc.canonicals == [seo['ORIGIN'] + path.split('?')[0]], path
        return path, html

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        documents.update(pool.map(fetch_document, sorted(more)))

print(f'PASS pagination/history discovery: {len(documents)} initial documents captured', flush=True)
report = audit_graph(documents, expected)
all_links = set()
for path, html in documents.items():
    links, _ = internal_links(path, html)
    all_links.update(links)
assert not all_links & ambiguous, sorted(all_links & ambiguous)
report['promoted_ambiguous_results'] = 0
report['invalid_result_links'] = result_link_errors(all_links, expected)
report['documents_including_pagination'] = len(documents)
report['internal_link_targets'] = len(all_links)

print(f'Checking {len(all_links)} distinct internal href targets (including UI controls)', flush=True)

# All anchors are checked, including nonindexable UI controls. No redirect following.
def integrity(path):
    if path in documents:
        return path, 200
    status, _, _ = request(path, method='HEAD')
    return path, status

# Checkpoints allow resuming a quota/interruption failure without repeating the
# verified table-control combinations. Stop on server failures instead of
# continuing to spend the account's remaining database budget.
(output / 'graph-documents.json').write_text(json.dumps(documents))
statuses = {path: 200 for path in all_links if path in documents}
aborted = False
pool = concurrent.futures.ThreadPoolExecutor(max_workers=8)
try:
    for count, (path, status) in enumerate(pool.map(integrity, sorted(all_links - statuses.keys())), 1):
        statuses[path] = status
        if count % 100 == 0 or status >= 500:
            (output / 'integrity-status.json').write_text(json.dumps(statuses))
        if count % 1000 == 0:
            print(f'Checked {len(statuses)}/{len(all_links)} internal href targets', flush=True)
        if status >= 500:
            aborted = True
            print(f'Stopping live audit after HTTP {status}: {path}', flush=True)
            break
except BaseException:
    aborted = True
    raise
finally:
    pool.shutdown(wait=True, cancel_futures=aborted)
(output / 'integrity-status.json').write_text(json.dumps(statuses))
report['not_checked'] = sorted(all_links - statuses.keys())
report['broken_links'] = sorted(path for path, status in statuses.items() if status >= 400)
report['redirecting_links'] = sorted(path for path, status in statuses.items() if 300 <= status < 400)
report['non_200_links'] = {path: status for path, status in statuses.items() if status != 200}
report['host'] = seo['HOST']
(output / 'graph-report.json').write_text(json.dumps(report, indent=2))
(output / 'graph-documents.json').write_text(json.dumps(documents))
print('P11.7 graph:', json.dumps({k: len(v) if isinstance(v, (list, dict)) else v for k, v in report.items() if k != 'inbound'}, sort_keys=True), flush=True)
assert not any(report[key] for key in ('orphaned', 'unreachable', 'invalid_origins', 'invalid_result_links', 'non_200_links', 'not_checked'))
print('PASS: every indexable URL reachable from homepage; zero orphans, broken links, redirect hops, or promoted ambiguous results.', flush=True)
