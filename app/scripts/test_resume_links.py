import json
import runpy
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from live_http import LiveClient

ORIGIN = 'https://benchmarkregistry.org'
MODEL = '/models/10001'
FAILED = MODEL + '?sort=benchmark&order=asc'
VERIFIED = MODEL + '?view=history'


def document(path):
    return (f'<link rel="canonical" href="{ORIGIN}{path}"><main><h1>Registry</h1>'
            f'<a href="/">Registry</a><a href="{MODEL}">Model</a>'
            f'<a href="{FAILED.replace("&", "&amp;")}">Sort</a>'
            f'<a href="{VERIFIED}">History</a></main>')


class FakeClient:
    staging = False

    def __init__(self, recover=True):
        self.calls = []
        self.recover = recover

    def request(self, path, method='GET'):
        self.calls.append((path, method))
        if path == '/sitemap.xml':
            return (200, {}, f'<urlset><url><loc>{ORIGIN}/</loc></url><url><loc>{ORIGIN}{MODEL}</loc></url></urlset>') if self.recover else (500, {}, 'quota exceeded')
        if method == 'HEAD':
            return 200, {}, ''
        return 200, {}, document(path)


class ResumeAuditTests(unittest.TestCase):
    def prepare(self, directory):
        directory = Path(directory)
        documents = {path: document(path) for path in ['/', MODEL]}
        (directory / 'graph-documents.json').write_text(json.dumps(documents))
        (directory / 'report.json').write_text(json.dumps({'documents': [{'path': path} for path in documents]}))
        report = {'non_200_links': {FAILED: 500}, 'not_checked': [], 'broken_links': [FAILED]}
        (directory / 'graph-report.json').write_text(json.dumps(report))
        return directory

    def run_audit(self, directory, client):
        with patch('live_http.LiveClient', return_value=client), patch.object(sys, 'argv', ['resume-links-live.py', 'benchmarkregistry.org', str(directory)]):
            runpy.run_path(str(Path(__file__).with_name('resume-links-live.py')))

    def test_revalidates_canonicals_and_retries_failed_hrefs_without_repeating_verified_controls(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = self.prepare(directory)
            client = FakeClient()
            self.run_audit(directory, client)
            self.assertIn((FAILED, 'HEAD'), client.calls)
            self.assertNotIn((VERIFIED, 'HEAD'), client.calls)
            for path in ['/', MODEL]:
                self.assertIn((path, 'GET'), client.calls)
            result = json.loads((directory / 'graph-report.json').read_text())
            self.assertEqual(result['non_200_links'], {})
            self.assertEqual(result['orphaned'], [])
            self.assertEqual(result['resumed_href_targets'], 1)
            self.assertEqual(json.loads((directory / 'graph-report-before-resume.json').read_text())['broken_links'], [FAILED])

    def test_stops_on_unrecovered_quota_and_never_claims_a_success(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = self.prepare(directory)
            client = FakeClient(recover=False)
            with self.assertRaises(AssertionError):
                self.run_audit(directory, client)
            self.assertEqual(client.calls, [('/sitemap.xml', 'GET')])
            self.assertEqual(json.loads((directory / 'graph-report.json').read_text())['broken_links'], [FAILED])

    def test_transport_rejects_unapproved_primary_hosts(self):
        with self.assertRaises(AssertionError):
            LiveClient('unapproved.example')


if __name__ == '__main__':
    unittest.main()
