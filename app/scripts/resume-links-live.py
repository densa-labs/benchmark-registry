"""Resume P11.7 after an external quota failure, using recorded verified hrefs.

Usage: python3 app/scripts/resume-links-live.py HOST OUTPUT_DIR [CLOUDFLARED]
Revalidates the canonical HTML and inventory; retries failed/unverified controls.
Does not alter billing, crawler protection, data, or application code.
"""
import concurrent.futures
import html as html_lib
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree
from crawl_graph import audit_graph, internal_links, result_link_errors
from live_http import LiveClient

host, directory = sys.argv[1:3]
client = LiveClient(host, sys.argv[3] if len(sys.argv) > 3 else 'cloudflared')
output = Path(directory)
old_report = json.loads((output / 'graph-report.json').read_text())
documents = json.loads((output / 'graph-documents.json').read_text())
inventory = {row['path'] for row in json.loads((output / 'report.json').read_text())['documents']}
origin = 'https://benchmarkregistry.org'
old_links = set()
for path, html in documents.items():
    old_links.update(internal_links(path, html)[0])

# Preserve the original failure evidence before updating the completion report.
backup = output / 'graph-report-before-resume.json'
if not backup.exists():
    backup.write_text(json.dumps(old_report, indent=2))
status, _, sitemap = client.request('/sitemap.xml')
assert status == 200, ('Quota/server recovery required before resuming', status)
current = {node.text.removeprefix(origin) for node in ElementTree.fromstring(sitemap).findall('{*}url/{*}loc')}
assert current == inventory, 'Inventory changed; a fresh full audit is required.'


def canonical_document(path):
    status, headers, html = client.request(path)
    assert status == 200, (path, status)
    canonical = [html_lib.unescape(value) for value in re.findall(r'<link rel="canonical" href="([^"]*)">', html)]
    assert canonical == [origin + path], (path, canonical)
    robots = re.findall(r'<meta name="robots" content="([^"]*)">', html)
    assert robots == (['noindex, follow'] if client.staging else []), path
    if client.staging:
        assert headers.get('x-robots-tag') == 'noindex, nofollow, noarchive', path
    else:
        assert 'x-robots-tag' not in headers, path
    assert '<h1>' in html and '<main' in html, path
    return path, html


# Bounded in-flight requests; abort immediately if recovery is incomplete.
pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
try:
    for path, html in pool.map(canonical_document, sorted(inventory)):
        documents[path] = html
finally:
    pool.shutdown(wait=True, cancel_futures=True)
print(f'PASS recovery: all {len(inventory)} canonical documents return indexable 200 again', flush=True)

all_links = set()
for path, html in documents.items():
    all_links.update(internal_links(path, html)[0])
assert all_links == old_links, 'Link graph changed; a fresh full audit is required.'
report = audit_graph(documents, inventory)
report['invalid_result_links'] = result_link_errors(all_links, inventory)
assert not any(report[key] for key in ('orphaned', 'unreachable', 'invalid_origins', 'invalid_result_links'))
remaining = set(old_report['non_200_links']) | set(old_report.get('not_checked', []))
statuses = {path: 200 for path in all_links - remaining}
if (output / 'integrity-status.json').exists():
    statuses.update(json.loads((output / 'integrity-status.json').read_text()))
remaining = {path for path in all_links if statuses.get(path) != 200}
# The freshly revalidated canonical pages supersede their earlier status.
statuses.update({path: 200 for path in inventory})
remaining -= inventory
print(f'Rechecking {len(remaining)} failed/unverified hrefs; retaining verified unchanged controls', flush=True)
for count, path in enumerate(sorted(remaining), 1):
    status, _, _ = client.request(path, method='HEAD')
    statuses[path] = status
    (output / 'integrity-status.json').write_text(json.dumps(statuses))
    assert status == 200, (path, status, 'Resume stopped; unresolved external/server failure')
    if count % 100 == 0:
        print(f'Rechecked {count}/{len(remaining)} hrefs', flush=True)
report.update({
    'host': host, 'documents_including_pagination': len(documents),
    'internal_link_targets': len(all_links), 'promoted_ambiguous_results': 0,
    'broken_links': [], 'redirecting_links': [], 'non_200_links': {}, 'not_checked': [],
    'canonical_documents_revalidated': len(inventory), 'resumed_href_targets': len(remaining),
})
(output / 'graph-report.json').write_text(json.dumps(report, indent=2))
(output / 'graph-documents.json').write_text(json.dumps(documents))
print('PASS P11.7 resumed live audit:', json.dumps({k: v for k, v in report.items() if k != 'inbound'}, sort_keys=True), flush=True)
