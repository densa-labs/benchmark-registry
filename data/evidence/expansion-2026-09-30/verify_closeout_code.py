import json,sys,concurrent.futures
from pathlib import Path
R=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(R/'app/scripts'))
from live_http import LiveClient
env=sys.argv[1];assert env in ['staging','production']
client=LiveClient(('staging.' if env=='staging' else '')+'benchmarkregistry.org','/private/tmp/p119-tools/cloudflared')
paths=['/','/api/home-panels','/api/stats','/compare','/compare?models=160001,160002&reasoning=effort%253D0.99,effort%253D0.99','/compare?models=160001,160002&benchmarks=shared&q=CharXiv','/models/160002','/sitemap.xml']
def check(path):
 status,headers,body=client.request(path)
 assert status==200,(path,status)
 assert headers.get('x-registry-d1-rows')=='0' and headers.get('x-registry-d1-queries')=='0',(path,headers)
 if path=='/':assert 'Explore Benchmarks' in body and 'Latest Additions' in body
 if path=='/api/home-panels':
  data=json.loads(body);assert len(data['explore_benchmarks'])==len(data['latest_additions'])==5
  assert any(x['model']['registry_no']=='160002' for x in data['latest_additions'])
 if path=='/api/stats':assert json.loads(body)['data']['benchmark_results']==(927 if env=='staging' else 926)
 if path.startswith('/compare'):
  assert 'Compare models' in body
  if '?' in path:assert 'noindex' in headers.get('x-robots-tag','') or 'name="robots" content="noindex' in body
 if path=='/sitemap.xml':assert '<loc>https://benchmarkregistry.org/compare</loc>' in body
 if env=='staging':assert headers.get('x-robots-tag')=='noindex, nofollow, noarchive'
 return {'path':path,'status':status,'generation':headers.get('x-registry-revision'),'d1_rows':headers.get('x-registry-d1-rows'),'d1_queries':headers.get('x-registry-d1-queries')}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,paths))
assert len({r['generation'] for r in rows})==1
status,_,_=client.request('/api/home-panels?sort=score');assert status==400
report={'environment':env,'status':'PASS','responses':rows,'home_panels_unknown_parameter_status':status,'public_d1_reads':0}
(R/'data/evidence/expansion-2026-09-30'/f'{env}-closeout-code-public-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'environment':env,'status':'PASS','responses':len(rows),'public_d1_reads':0}))
