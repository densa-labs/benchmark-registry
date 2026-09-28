"""Ordinary anchor graph audit. Sitemap/canonical tags are inventory, never edges."""
import re
from collections import defaultdict, deque
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, parse_qsl

ORIGIN = 'https://benchmarkregistry.org'


class Anchors(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.anchor = None
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'a':
            self.anchor = {'href': attrs.get('href', ''), 'label': ''}
        if tag == 'img' and self.anchor:
            self.anchor['label'] += attrs.get('alt', '')

    def handle_data(self, data):
        if self.anchor:
            self.anchor['label'] += data

    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor:
            self.links.append(self.anchor)
            self.anchor = None


def internal_links(path, html):
    links, invalid = set(), set()
    for anchor in Anchors(html).links:
        href = anchor['href']
        if not anchor['label'].strip() or href.startswith('#'):
            continue
        url = urlsplit(urljoin(ORIGIN + path, href))
        if url.hostname in ('www.benchmarkregistry.org', 'staging.benchmarkregistry.org') or (url.hostname or '').endswith('.workers.dev'):
            invalid.add(href)
        if url.hostname != 'benchmarkregistry.org':
            continue
        if url.scheme != 'https':
            invalid.add(href)
        links.add(url.path + ('?' + url.query if url.query else ''))
    return links, invalid


def discovery_state(path):
    # Follow ordinary pagination and retained-history navigation, avoiding the
    # combinatorial space of search, sort, and company filters. They are still
    # checked for HTTP integrity by the live audit.
    pairs = parse_qsl(urlsplit(path).query, keep_blank_values=True)
    params = dict(pairs)
    return bool(pairs) and len(params) == len(pairs) and set(params) <= {'page', 'limit', 'view'}


def audit_graph(documents, inventory, entries=('/',)):
    inventory = set(inventory)
    edges, inbound, invalid = {}, defaultdict(set), set()
    for path, html in documents.items():
        links, bad = internal_links(path, html)
        invalid.update(bad)
        edges[path] = links
        for target in links & inventory:
            if target != path:  # self-links never rescue an orphan
                inbound[target].add(path)
    reachable = set()
    pending = deque(entries)
    while pending:
        path = pending.popleft()
        if path in reachable:
            continue
        reachable.add(path)
        pending.extend(target for target in edges.get(path, ()) if target in documents and target not in reachable)
    return {
        'indexable_urls': len(inventory),
        'orphaned': sorted(path for path in inventory if not inbound[path]),
        'unreachable': sorted(inventory - reachable),
        'invalid_origins': sorted(invalid),
        'inbound': {path: len(inbound[path]) for path in sorted(inventory)},
    }


def result_link_errors(links, inventory):
    """Selected UI controls may retain a key, but it must belong to an approved
    model/version context; HTTP 200 alone cannot detect P11.6's malformed states.
    """
    inventory = set(inventory)
    invalid = []
    for path in sorted(links):
        url = urlsplit(path)
        keys = [value for key, value in parse_qsl(url.query, keep_blank_values=True) if key == 'result']
        if not keys:
            continue
        if (len(keys) != 1 or not re.fullmatch(r'[a-f0-9]{64}', keys[0])
                or f'{url.path}?view=history&result={keys[0]}' not in inventory):
            invalid.append(path)
    return invalid
