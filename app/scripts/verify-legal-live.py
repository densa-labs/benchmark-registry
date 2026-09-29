"""Fixed P11.11 HTTP sample, never a crawl; at most 15 requests per environment."""
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from live_http import LiveClient


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--cloudflared', default='cloudflared')
    args = parser.parse_args()
    client = LiveClient(args.host, args.cloudflared)
    checks = []
    pages = {'legal': 'Legal', 'privacy': 'Privacy Policy', 'terms': 'Terms'}
    for kind, title in pages.items():
        path = '/' + kind
        status, headers, html = client.request(path)
        assert status == 200, path
        assert headers['x-registry-d1-queries'] == headers['x-registry-d1-rows'] == headers['x-registry-read-store-reads'] == '0'
        assert len(re.findall(r'<h1\b', html)) == 1 and re.search(r'<h1\b[^>]*>' + title + '</h1>', html)
        assert '<title>' + ('STAGING | Benchmark Registry' if client.staging else title + ' | Benchmark Registry') + '</title>' in html
        assert f'<meta property="og:title" content="{title} | Benchmark Registry">' in html
        assert f'rel="canonical" href="https://benchmarkregistry.org/{kind}"' in html
        assert ('name="robots" content="noindex' in html) == client.staging
        assert ('staging-banner' in html) == client.staging
        assert 'href="/legal">Legal</a>' in html and 'support@benchmarkregistry.org' in html
        assert f'"loaded":{{"kind":"{kind}"}}' in html
        if kind == 'legal':
            assert 'href="/privacy">Privacy Policy</a>' in html and 'href="/terms">Terms</a>' in html
            assert re.search(r'href="mailto:support@benchmarkregistry.org"[^>]*>Support<svg[^>]*aria-hidden="true"', html)
        else:
            assert '<time dateTime="2026-09-28">September 28, 2026</time>' in html
        if client.staging:
            assert headers['x-robots-tag'] == 'noindex, nofollow, noarchive'
        checks.append({'path': path, 'status': status, 'd1_queries': 0, 'd1_rows': 0, 'read_store_reads': 0, 'set_cookie_present': 'set-cookie' in headers, 'initial_html': True, 'metadata': True})
        status, headers, _ = client.request(path + '/arbitrary')
        assert status == 404 and headers['x-registry-read-store-reads'] == '0'
        checks.append({'path': path + '/arbitrary', 'status': status, 'read_store_reads': 0})
    for path in ['/models/10005', '/api/models', '/api/search?q=controlled']:
        status, headers, _ = client.request(path)
        assert status == 200 and headers['x-registry-d1-queries'] == headers['x-registry-d1-rows'] == '0'
        checks.append({'path': path, 'status': status, 'd1_queries': 0, 'd1_rows': 0, 'cache': headers.get('x-registry-cache')})
    status, _, xml = client.request('/sitemap.xml')
    locations = re.findall(r'<loc>(.*?)</loc>', xml)
    assert status == 200 and len(locations) == len(set(locations)) == 808
    assert all(url.startswith('https://benchmarkregistry.org/') for url in locations)
    for kind in pages:
        assert locations.count('https://benchmarkregistry.org/' + kind) == 1
    checks.append({'path': '/sitemap.xml', 'status': status, 'count': len(locations), 'legal_routes_once': True})
    status, _, body = client.request('/robots.txt')
    assert status == 200 and ('Disallow: /' in body) == client.staging
    checks.append({'path': '/robots.txt', 'status': status, 'staging_disallow': client.staging})
    status, _, body = client.request('/privacy', method='HEAD')
    assert status == 200  # curl --head returns headers, not an entity body.
    status, headers, _ = client.request('/legal/')
    assert status == 308 and headers['location'] == f'https://{args.host}/legal'
    if client.staging:
        status, _, _ = client.request('/legal', authenticate=False)
        assert status in {302, 303, 401, 403}
        checks.append({'path': '/legal', 'unauthenticated_status': status})
    Path(args.output).write_text(json.dumps({'host': args.host, 'verified_at': datetime.now(timezone.utc).isoformat(), 'result': 'PASS', 'checks': checks}, indent=2) + '\n')
    print(f'PASS: bounded {args.host} legal, metadata, sitemap, Access and zero-D1 checks')


if __name__ == '__main__':
    main()
