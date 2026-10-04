"""Read-only live audit transport. Existing Access login is used on staging."""
import re
import subprocess
import tempfile
from pathlib import Path


class LiveClient:
    def __init__(self, host, cloudflared='cloudflared'):
        assert host in ('benchmarkregistry.org', 'staging.benchmarkregistry.org')
        self.host = host
        self.staging = host.startswith('staging.')
        self.cloudflared = cloudflared

    def request(self, path, method='GET', host=None, protocol='https', authenticate=True):
        host = host or self.host
        url = f'{protocol}://{host}{path}'
        command = [self.cloudflared, 'access', 'curl', url] if self.staging and host == self.host and authenticate else ['curl', url]
        with tempfile.NamedTemporaryFile() as headers_file:
            args = ['--silent', '--show-error', '--compressed', '--max-time', '30', '--dump-header', headers_file.name]
            if method == 'HEAD':
                args.append('--head')
            result = subprocess.run(command + args, text=True, capture_output=True, timeout=45, check=False)
            assert result.returncode == 0, f'Request failed: {path}'
            header_text = Path(headers_file.name).read_text()
            status = int(re.findall(r'HTTP/[\d.]+ (\d+)', header_text)[-1])
            headers = {}
            for line in header_text.splitlines():
                if ':' in line:
                    key, value = line.split(':', 1)
                    headers[key.lower()] = value.strip()
            return status, headers, result.stdout
