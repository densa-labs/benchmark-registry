import unittest
from crawl_graph import audit_graph, internal_links, discovery_state, result_link_errors


class CrawlGraphTests(unittest.TestCase):
    def test_sitemap_canonical_and_self_links_do_not_rescue_orphans(self):
        report = audit_graph({'/': '<link rel="canonical" href="/models/10001"><a href="/sitemap.xml">Sitemap</a>',
                              '/models/10001': '<a href="/models/10001">Model</a>'}, ['/', '/models/10001'])
        self.assertIn('/models/10001', report['orphaned'])
        self.assertIn('/models/10001', report['unreachable'])

    def test_pagination_connects_entities_and_exact_results(self):
        exact = '/benchmarks/example/4-0?view=history&result=' + 'a' * 64
        documents = {'/': '<a href="/models">Models</a>',
                     '/models': '<a href="/models?page=2">Next</a><a href="/">Registry</a>',
                     '/models?page=2': '<a href="/models/10051">Model 51</a>',
                     '/models/10051': f'<a href="{exact.replace("&", "&amp;")}">72%</a>',
                     exact: '<a href="/models/10051">Model 51</a>'}
        report = audit_graph(documents, ['/', '/models', '/models/10051', exact])
        self.assertEqual(report['orphaned'], [])
        self.assertEqual(report['unreachable'], [])

    def test_disconnected_cycle_has_inbound_but_is_unreachable(self):
        report = audit_graph({'/': '', '/a': '<a href="/b">B</a>', '/b': '<a href="/a">A</a>'}, ['/', '/a', '/b'])
        self.assertEqual(report['unreachable'], ['/a', '/b'])

    def test_result_link_integrity_checks_keys_and_version_scope_beyond_http_status(self):
        base = '/benchmarks/example/4-0'
        exact = base + '?view=history&result=' + 'a' * 64
        bad = [base + '?result=invalid', base + '?result=' + 'b' * 64,
               '/benchmarks/example/1.0?result=' + 'a' * 64,
               exact + '&result=' + 'a' * 64]
        good = exact + '&sort=model&order=asc'
        self.assertEqual(result_link_errors(bad + [exact, good], [exact]), sorted(bad))

    def test_real_anchors_only_and_noncanonical_origins(self):
        links, invalid = internal_links('/', '<button onclick="location=\'/model\'">Model</button>'
                                       '<a href="https://www.benchmarkregistry.org/models">Models</a>'
                                       '<a href="https://staging.benchmarkregistry.org/models">Models</a>'
                                       '<a href="/models"><span>Models</span></a><a href="#main">Skip</a>')
        self.assertEqual(links, {'/models'})
        self.assertEqual(len(invalid), 2)
        self.assertTrue(discovery_state('/models?page=2'))
        self.assertFalse(discovery_state('/models?page=2&q=search'))


if __name__ == '__main__':
    unittest.main()
