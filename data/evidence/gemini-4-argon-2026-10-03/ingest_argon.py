import json,os,sys,subprocess,urllib.request,hashlib,concurrent.futures
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(ROOT/'ingestor/src'))
from benchmark_registry_ingestor.database import RemoteD1Database,database_from_environment
from benchmark_registry_ingestor.engine import Ingestor
from dataclasses import asdict
cfg=json.loads((ROOT/'app/wrangler.maintenance.jsonc').read_text())
public=json.loads((ROOT/'app/wrangler.jsonc').read_text())
environment,mode=sys.argv[1:3]
assert environment in ['staging','production']
runtime={**os.environ,'WRANGLER_SEND_METRICS':'false','WRANGLER_LOG_PATH':'/private/tmp/registry-expansion-private-wrangler.log'}
c=json.loads(subprocess.check_output([str(ROOT/'app/node_modules/.bin/wrangler'),'auth','token','--json'],cwd=ROOT/'app',env=runtime,stderr=subprocess.DEVNULL))
account=cfg['env'][environment]['account_id'];dbid=cfg['env'][environment]['d1_databases'][0]['database_id']
remote=RemoteD1Database(account,dbid,c['token']);payload=json.loads((HERE/'argon-pending-batch.json').read_text())
def save(name,value): (HERE/name).write_text(json.dumps(value,indent=2)+'\n')
def api(path):
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+account+path,headers={'Authorization':'Bearer '+c['token']})
 return json.load(urllib.request.urlopen(req,timeout=60))
def publication():
 ns=public['env'][environment]['kv_namespaces'][0]['id'];prefix='/storage/kv/namespaces/'+ns+'/values/'
 pub=api(prefix+'publication');output={}
 for kind in ['previous','current']:
  if kind in pub:
   manifest=api(prefix+'manifests%2F'+pub[kind]['hash'])
   output[kind]={k:manifest[k] for k in ['generation','canonicalRevision','watermark']}
   output[kind]['objects']=len(manifest['objects'])
 return output
if mode=='snapshot':
 tables=['models','results','result_sources','result_evaluators','benchmarks','benchmark_versions','metrics','evaluator_organizations','registry_revision']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  data=dict(zip(tables,pool.map(lambda t:remote.query('SELECT * FROM '+t),tables)))
 counts=remote.query('SELECT m.registry_no,count(r.id) AS results FROM models m LEFT JOIN results r ON r.model_id=m.id GROUP BY m.id ORDER BY m.registry_no')
 data['model_result_counts']={x['registry_no']:x['results'] for x in counts}
 save(environment+'-argon-before.json',data)
 if environment=='production':
  save('argon-before-counts.json',{'results':len(data['results']),'model_result_counts':data['model_result_counts']})
  save('argon-result-identities-before.json',data)
 save(environment+'-argon-publication-before.json',publication())
 print(json.dumps({'environment':environment,'results':len(data['results']),'argon_results':{k:data['model_result_counts'].get(k,0) for k in ['30011']},'snapshot':'SAVED'}))
elif mode=='dry-run':
 outcomes=Ingestor(remote).run('batch',payload,commit=False)
 report={'environment':environment,'mode':mode,'outcomes':[x.as_dict() for x in outcomes]}
 save(environment+'-argon-dry-run.json',report)
 assert all(x.status in ('VALID','SKIPPED') for x in outcomes),report
 print(json.dumps({'environment':environment,'records_valid':len(outcomes)}))
 # Copy identical validated input; no mutation of candidate spelling.
 save('argon-validated-batch.json',payload)
elif mode=='commit':
 assert (HERE/'staging-argon-dry-run.json').exists()
 if environment=='production':assert json.loads((HERE/'staging-argon-public-verification.json').read_text())['status']=='PASS'
 assert json.loads((HERE/(environment+'-argon-dry-run.json')).read_text())['outcomes']
 tokenenv={**runtime,'CLOUDFLARE_ACCOUNT_ID':account,'CLOUDFLARE_D1_DATABASE_ID':dbid,'CLOUDFLARE_API_TOKEN':c['token'],'REGISTRY_DISPOSABLE_D1_DATABASE_ID':'cc29cd46-a842-44a7-9f75-16d12fab1add','PYTHONPATH':str(ROOT/'ingestor/.venv/lib/python3.12/site-packages')+':'+str(ROOT/'ingestor/src')}
 py=sys.executable
 probe=subprocess.run([py,'-m','pytest','ingestor/tests/test_ingestor.py::test_disposable_remote_d1_batch_rolls_back_atomically','-q'],cwd=ROOT,env=tokenenv,text=True,capture_output=True)
 assert probe.returncode==0 and '1 passed' in probe.stdout,probe.stdout+probe.stderr
 save(environment+'-argon-atomicity.json',{'status':'PASS','test':'test_disposable_remote_d1_batch_rolls_back_atomically','passed':1,'disposable_database_id':tokenenv['REGISTRY_DISPOSABLE_D1_DATABASE_ID']})
 os.environ.update({k:tokenenv[k] for k in ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_D1_DATABASE_ID','CLOUDFLARE_API_TOKEN']});os.environ['REGISTRY_REMOTE_ATOMICITY_VERIFIED']='1'
 database=database_from_environment('remote',commit=True)
 def publish():
  reportpath=HERE/(environment+'-argon-materialization-after.json')
  result=subprocess.run(['/usr/local/bin/node','scripts/materialize.mjs','--environment',environment,'--output',str(reportpath)],cwd=ROOT/'app',env=runtime,text=True,capture_output=True)
  if result.returncode:raise RuntimeError('Incremental materialization failed: '+result.stderr[-2500:])
  assert json.loads(reportpath.read_text())['status']=='PUBLISHED'
 outcomes=Ingestor(database,publish).run('batch',payload,commit=True)
 save(environment+'-argon-commit.json',{'environment':environment,'mode':mode,'outcomes':[x.as_dict() for x in outcomes]})
 save(environment+'-argon-publication-after.json',publication())
 print(json.dumps({'environment':environment,'records_committed':len(outcomes),'incremental_materialization':'PUBLISHED'}))
elif mode=='noop':
 output=HERE/(environment+'-argon-materialization-noop.json')
 result=subprocess.run(['/usr/local/bin/node','scripts/materialize.mjs','--environment',environment,'--output',str(output)],cwd=ROOT/'app',env=runtime,text=True,capture_output=True)
 assert result.returncode==0,result.stderr
 report=json.loads(output.read_text());assert report['status']=='NO_CHANGE' and report['kvWrites']==0 and report['d1RowsWritten']==0 and report['objectsRebuilt']==0,report
 print(json.dumps(report))
else: raise AssertionError(mode)
