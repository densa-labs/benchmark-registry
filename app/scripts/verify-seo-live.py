"""P11.6 raw-response audit. No writes, crawler bypasses, or credential output.

Usage: python3 scripts/verify-seo-live.py HOST OUTPUT_DIR [CLOUDFLARED_BIN]
Staging uses the caller's existing Cloudflare Access login through cloudflared.
"""
import concurrent.futures
import json
import re
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree
from live_http import LiveClient

HOST = sys.argv[1]
assert HOST in ('benchmarkregistry.org', 'staging.benchmarkregistry.org')
STAGING = HOST.startswith('staging.')
OUTPUT = Path(sys.argv[2])
OUTPUT.mkdir(parents=True, exist_ok=True)
ORIGIN = 'https://benchmarkregistry.org'
CLOUDFLARED = sys.argv[3] if len(sys.argv) > 3 else 'cloudflared'


client = LiveClient(HOST, CLOUDFLARED)
request = client.request

def protection(headers, api=False):
    if STAGING:
        assert headers.get('x-robots-tag') == 'noindex, nofollow, noarchive'
    elif api:
        assert headers.get('x-robots-tag') == 'noindex, follow'
    else:
        assert 'x-robots-tag' not in headers


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.canonicals = []
        self.robots = []
        self.titles = []
        self.in_title = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots.append(attrs.get('content'))
        if tag == 'title':
            self.in_title = True
            self.titles.append('')

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.titles[-1] += data


def api(path):
    status, headers, body = request(path)
    assert status == 200, path
    protection(headers, api=True)
    return json.loads(body)


def list_api(path):
    first = api(path + '?limit=500')
    rows = first['data']
    for page in range(2, first['page']['total_pages'] + 1):
        rows += api(path + f'?limit=500&page={page}')['data']
    return rows


status, headers, robots = request('/robots.txt')
assert status == 200
assert 'text/plain' in headers['content-type']
protection(headers)
assert robots == ('User-agent: *\nDisallow: /\n' if STAGING else 'User-agent: *\nAllow: /\n\nSitemap: https://benchmarkregistry.org/sitemap.xml\n')
(OUTPUT / 'robots.txt').write_text(robots)
status, headers, sitemap = request('/sitemap.xml')
assert status == 200
assert 'application/xml' in headers['content-type']
protection(headers)
root = ElementTree.fromstring(sitemap)
urls = [node.text for node in root.findall('{*}url/{*}loc')]
assert len(urls) == len(set(urls))
assert not root.findall('{*}url/{*}lastmod')
assert all(url.startswith(ORIGIN + '/') for url in urls)
(OUTPUT / 'sitemap.xml').write_text(sitemap)
print('PASS robots and sitemap syntax/protection', flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    models, families, companies = list(pool.map(list_api, ['/api/models', '/api/benchmarks', '/api/companies']))


def model_path(model):
    path = '/models/' + model['registry_no']
    status, _, _ = request(path, 'HEAD')
    assert status in (200, 308), path
    return path if status == 200 else None


expected = {'/', '/models', '/benchmarks', '/companies'}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    expected.update(path for path in pool.map(model_path, models) if path)
expected.update('/companies/' + row['slug'] for row in companies)
versions = []
for family in families:
    path = '/benchmarks/' + family['benchmark']['slug']
    expected.add(path)
    detail = api('/api' + path)['data']
    versions += [path + '/' + version['version_slug'] for version in detail['versions']]
expected.update(versions)


def result_inventory(path):
    first = api('/api' + path + '?view=history&limit=500')['data']
    rows = first['results']
    for page in range(2, first['result_page']['total_pages'] + 1):
        rows += api('/api' + path + f'?view=history&limit=500&page={page}')['data']['results']
    groups = defaultdict(list)
    for row in rows:
        groups[row['model']['registry_no']].append(row)
    unique = [path + '?view=history&result=' + group[0]['result_key']
              for number, group in groups.items() if len(group) == 1 and '/models/' + number in expected]
    ambiguous = [path + '?view=history&result=' + row['result_key']
                 for group in groups.values() if len(group) > 1 for row in group]
    return unique, ambiguous


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    inventories = list(pool.map(result_inventory, versions))
exact = [url for unique, _ in inventories for url in unique]
ambiguous = [url for _, variants in inventories for url in variants]
expected.update(exact)
actual = {url.removeprefix(ORIGIN) for url in urls}
assert actual == expected, {'missing': sorted(expected - actual), 'extra': sorted(actual - expected)}
print('PASS complete sitemap inventory matches live read API and retained-result ambiguity rules', flush=True)


def crawl(item):
    index, url = item
    path = url.removeprefix(ORIGIN)
    status, headers, html = request(path)
    assert status == 200, (path, status)
    protection(headers)
    document = Document(html)
    assert document.canonicals == [url], (path, document.canonicals)
    assert len(document.titles) == 1, path
    assert document.robots == (['noindex, follow'] if STAGING else []), path
    assert '<div id="root">' in html and '<main' in html and '<h1>' in html, path
    assert 'staging.benchmarkregistry.org' not in html, path
    if '?view=history&result=' in path:
        assert 'class="data-table"' in html and 'Source' in html and path.split('result=')[1] in html, path
    (OUTPUT / f'document-{index:04}.html').write_text(html)
    return {'path': path, 'status': status, 'canonical': document.canonicals[0], 'title': document.titles[0]}


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    documents = list(pool.map(crawl, enumerate(urls)))
print(f'PASS all {len(documents)} sitemap documents: raw 200, canonical, initial identity content, indexing policy', flush=True)

for path in ['/models/999999999', '/benchmarks/p116-missing', '/benchmarks/deep-swe/p116-missing', '/companies/p116-missing', '/p116-no-such-route']:
    for method in ['GET', 'HEAD']:
        status, headers, html = request(path, method)
        assert status == 404, (path, method, status)
        protection(headers)
        if method == 'GET':
            document = Document(html)
            assert document.canonicals == [] and document.robots == ['noindex, follow']

for path in ambiguous + ['/benchmarks/deep-swe/1.1?result=invalid', '/benchmarks/deep-swe/1.1?view=history&result=' + 'f' * 64,
                         '/models?sort=name&order=asc', '/models?page=2', '/models?company=anthropic', '/models?q=Claude']:
    status, headers, html = request(path)
    assert status == 200, path
    protection(headers)
    document = Document(html)
    assert document.robots == ['noindex, follow'], path
    assert document.canonicals == [ORIGIN + path.split('?')[0]], path
print(f'PASS missing entities, query controls, and all {len(ambiguous)} ambiguous result states', flush=True)

if STAGING:
    for path in ['/', '/api/models', '/robots.txt', '/sitemap.xml']:
        status, headers, _ = request(path, authenticate=False)
        assert status == 302 and '.cloudflareaccess.com/' in headers.get('location', ''), path
else:
    for protocol, host, allowed in [('https', 'www.benchmarkregistry.org', (308,)), ('http', HOST, (301, 308))]:
        path = '/benchmarks/deep-swe/1.1?view=history&result=' + 'a' * 64
        status, headers, _ = request(path, host=host, protocol=protocol)
        assert status in allowed and headers['location'] == ORIGIN + path
    status, headers, _ = request('/api/search?q=Claude')
    assert status == 200
    protection(headers, api=True)

counts = Counter()
for path in actual:
    pieces = path.split('?')[0].strip('/').split('/')
    category = 'homepage' if path == '/' else 'indexes' if len(pieces) == 1 else 'exact_results' if '?' in path else 'models' if pieces[0] == 'models' else 'companies' if pieces[0] == 'companies' else 'benchmark_versions' if len(pieces) == 3 else 'benchmark_families'
    counts[category] += 1
report = {'host': HOST, 'counts': dict(counts), 'total': len(urls), 'ambiguous_result_states': len(ambiguous), 'all_sitemap_documents_verified': True, 'documents': documents}
(OUTPUT / 'report.json').write_text(json.dumps(report, indent=2))
print('PASS live P11.6 verification:', json.dumps({**counts, 'total': len(urls)}, sort_keys=True), flush=True)
