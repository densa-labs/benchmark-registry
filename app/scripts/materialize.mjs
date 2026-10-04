import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
const {values}=parseArgs({options:{environment:{type:'string'},bootstrap:{type:'boolean'},status:{type:'boolean'},rollback:{type:'boolean'},'gc-plan':{type:'boolean'},output:{type:'string'}}});
const environment=values.environment;
if(!['staging','production'].includes(environment)) throw new Error('Explicit --environment staging|production is required.');
const maintenance=JSON.parse(readFileSync(new URL('../wrangler.maintenance.jsonc',import.meta.url),'utf8'));
const account=maintenance.env[environment].account_id;
// The site no longer reads KV; it is kept current only so the previous Worker version stays a valid rollback.
const namespace=maintenance.env[environment].kv_namespaces[0].id;
const database=maintenance.env[environment].d1_databases[0].database_id;
// Wrangler's official credential command is captured privately, never printed or written.
const credential=JSON.parse(execFileSync(resolve('node_modules/.bin/wrangler'),['auth','token','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const apiRoot=`https://api.cloudflare.com/client/v4/accounts/${account}`;
async function api(path,options={}) {
  const response=await fetch(apiRoot+path,{...options,headers:{Authorization:`Bearer ${credential.token}`,...options.headers}});
  if(!response.ok) throw new Error(`Cloudflare maintenance API failed (${response.status}) for ${path.split('?')[0]}`);
  return response;
}
const metrics={d1Queries:0,d1RowsRead:0,d1RowsWritten:0,kvReads:0,kvWrites:0};
const db={prepare(sql){let params=[];return {bind(...values){params=values;return this;},async all(){
  const response=await api(`/d1/database/${database}/query`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
  const payload=await response.json();if(!payload.success || !payload.result?.[0]?.success) throw new Error('Canonical D1 maintenance query failed.');
  const result=payload.result[0];metrics.d1Queries++;metrics.d1RowsRead+=result.meta?.rows_read??0;metrics.d1RowsWritten+=result.meta?.rows_written??0;return result;
},async first(){return (await this.all()).results[0] ?? null;}};}};
const store={async get(key){metrics.kvReads++;const response=await fetch(`${apiRoot}/storage/kv/namespaces/${namespace}/values/${encodeURIComponent(key)}`,{headers:{Authorization:`Bearer ${credential.token}`}});if(response.status===404) return null;if(!response.ok) throw new Error(`KV read failed (${response.status}).`);return response.text();},async put(entries){
  const response=await api(`/storage/kv/namespaces/${namespace}/bulk`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(entries)});
  const payload=await response.json();if(!payload.success) throw new Error('KV materialization write failed.');metrics.kvWrites+=entries.length;
}};
mkdirSync('.wrangler/materializations',{recursive:true});
const runtime=resolve('.wrangler/materializations/runtime.mjs');
await build({entryPoints:['worker/maintenance-entry.ts'],bundle:true,platform:'node',format:'esm',outfile:runtime,logLevel:'silent'});
const producer=await import(pathToFileURL(runtime).href+'?'+Date.now());
const publication=await producer.readPublication(store,environment);
const previous=publication?await producer.readManifest(store,publication.current.hash,environment):undefined;
const state=await producer.canonicalState(db);
let evidence;
if(values.status) evidence={environment,canonicalRevision:state.revision,publishedRevision:previous?.canonicalRevision??null,pending:producer.needsMaterialization(previous,state),...metrics};
else if(values['gc-plan']) {
  const protectedKeys=await producer.protectedPublicationKeys(store,environment);
  const entries=[];let cursor;
  do {const result=await (await api(`/storage/kv/namespaces/${namespace}/keys?limit=1000${cursor?'&cursor='+encodeURIComponent(cursor):''}`)).json();if(!result.success) throw new Error('KV inventory read failed.');entries.push(...result.result.map(key=>({key:key.name,createdAt:key.metadata?.createdAt})));cursor=result.result_info?.cursor;} while(cursor);
  evidence={environment,protectedKeys:protectedKeys.size,candidates:producer.garbageCandidates(entries,protectedKeys),policy:'Plan only; protect current, previous and last-good; retain unreferenced objects for 14 days.'};
} else {
  if(!publication && !values.bootstrap) throw new Error('No published generation. Initial materialization requires explicit --bootstrap.');
  if(values.bootstrap && publication) throw new Error('Bootstrap already completed. Use incremental materialization or --status.');
  if(!values.rollback && !producer.needsMaterialization(previous,state)) evidence={environment,status:'NO_CHANGE',objectsRebuilt:0,...metrics};
  else {
    const owner=crypto.randomUUID();
    const lease=await db.prepare("UPDATE registry_materialization_lease SET owner=?,expires_at=unixepoch()+1800 WHERE id=1 AND (owner IS NULL OR expires_at<unixepoch()) RETURNING owner").bind(owner).first();
    if(!lease) throw new Error('Another producer holds the publication lease. Retry after it completes.');
    try {
      let canonical=db,snapshot;
      // Projection upgrades rebuild all objects; reuse the existing verified local snapshot path.
      if(values.bootstrap || previous?.projectionVersion!==producer.projectionVersion) {
        console.log(JSON.stringify({environment,phase:'canonical_snapshot'}));
        snapshot=new DatabaseSync(':memory:');
        const names=['companies','namespaces','namespace_companies','models','model_aliases','benchmarks','benchmark_aliases','benchmark_versions','metrics','evaluator_organizations','benchmark_version_evaluators','results','result_evaluators','result_sources','registry_redirects','registry_revision','registry_read_changes'];
        const schema=(await db.prepare("SELECT type,name,sql,tbl_name FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND tbl_name IN(SELECT value FROM json_each(?))").bind(JSON.stringify(names)).all()).results;
        for(const item of schema.filter(item=>item.type==='table')) snapshot.exec(item.sql);
        snapshot.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
        for(const name of names) {
          const rows=(await db.prepare(`SELECT * FROM "${name}"`).all()).results;
          for(const row of rows) snapshot.prepare(`INSERT INTO "${name}"(${Object.keys(row).map(key=>'"'+key+'"').join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`).run(...Object.values(row));
        }
        snapshot.exec('COMMIT'); // Validate the complete snapshot, including self-references.
        for(const item of schema.filter(item=>item.type!=='table')) snapshot.exec(item.sql);
        canonical={prepare(sql){let params=[];return {bind(...values){params=values;return this;},async all(){return {results:snapshot.prepare(sql).all(...params),meta:{rows_read:0,rows_written:0}};},async first(){return (await this.all()).results[0]??null;}};}};
      }
      console.log(JSON.stringify({environment,phase:values.rollback?'rollback':'build_affected_objects'}));
      let candidate;
      if(values.rollback) {
        if(!publication?.previous) throw new Error('No previous generation is retained.');
        candidate=producer.rollbackBuild(await producer.readManifest(store,publication.previous.hash,environment));
        candidate.manifestHash=await producer.digest(JSON.stringify(candidate.manifest));
      } else candidate=await producer.buildGeneration(canonical,environment,previous,async(key)=>{
        const hash=previous.objects[key],value=await store.get('objects/'+hash);
        if(!value || await producer.digest(value)!==hash) throw new Error('Prior immutable projection is unavailable; previous publication remains live.');
        const object=JSON.parse(value);producer.validateObject(object,key,environment);return object;
      });
      const shadow=snapshot && candidate ? await producer.shadowGeneration(canonical,candidate) : undefined;
      snapshot?.close();
      if(!candidate) evidence={environment,status:'NO_CHANGE',objectsRebuilt:0,...metrics};
      else {
        writeFileSync(`.wrangler/materializations/${environment}-candidate.json`,JSON.stringify({manifest:candidate.manifest,hash:candidate.manifestHash,rebuilt:candidate.rebuilt,objects:[...candidate.objects]},null,2)+'\n');
        const alive=await db.prepare('SELECT owner FROM registry_materialization_lease WHERE id=1 AND owner=? AND expires_at>unixepoch()').bind(owner).first();
        if(!alive) throw new Error('Publication lease expired; candidate remains unpublished.');
        console.log(JSON.stringify({environment,phase:'verify_and_publish',objects:candidate.rebuilt.length}));
        const retryVerification=async(attempt)=>{
          if(attempt>4) return false;
          console.log(JSON.stringify({environment,phase:'await_kv_verification',attempt}));
          await new Promise(done=>setTimeout(done,30_000));return true;
        };
        evidence={environment,status:'PUBLISHED',shadow,...await producer.publishGeneration(store,candidate,db,publication,state.revision,retryVerification),...metrics};
      }
    } finally {await db.prepare('UPDATE registry_materialization_lease SET owner=NULL,expires_at=0 WHERE id=1 AND owner=?').bind(owner).all();}
  }
}
Object.assign(evidence,metrics);
writeFileSync(`.wrangler/materializations/${environment}-last-run.json`,JSON.stringify(evidence,null,2)+'\n');
if(values.output) writeFileSync(values.output,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
