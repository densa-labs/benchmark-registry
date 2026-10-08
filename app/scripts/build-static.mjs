// Generates the complete static site into dist/client after `vite build`.
//   node scripts/build-static.mjs --environment staging|production [--db path/to/registry.sqlite]
// Without --db, the canonical D1 database for that environment is read once:
// one SELECT per table into an in-memory SQLite snapshot, so D1 rows read per
// build equal the table sizes. All joins then run locally.
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,readdirSync,rmSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {Resvg} from '@resvg/resvg-js';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';

const {values}=parseArgs({options:{environment:{type:'string'},db:{type:'string'},out:{type:'string'}}});
const environment=values.environment;
if(!['staging','production'].includes(environment)) throw new Error('Explicit --environment staging|production is required.');
const out=resolve(values.out ?? 'dist/client');
const templatePath=join(out,'index.html');
if(!existsSync(templatePath) || !existsSync('dist/build-info.json')) throw new Error('Run the Vite client build first (npm run build:'+environment+').');
const buildInfo=JSON.parse(readFileSync('dist/build-info.json','utf8'));
if(buildInfo.staging!==(environment==='staging')) throw new Error(`The client build is for ${buildInfo.staging?'staging':'production'}, not ${environment}.`);
const template=readFileSync(templatePath,'utf8');
if(!template.includes('<div id="root"></div>')) throw new Error('dist/client/index.html is not the unrendered Vite template. Rebuild the client first.');

const TABLES=['companies','namespaces','namespace_companies','models','model_aliases','benchmarks','benchmark_aliases','benchmark_versions','metrics','evaluator_organizations','benchmark_version_evaluators','results','result_evaluators','result_sources','registry_redirects','effort_levels','reasoning_labels','configurations','benchmark_version_configurations','result_corrections','score_settings','result_score_settings','registry_revision','registry_read_changes'];
const metrics={d1Queries:0,d1RowsRead:0};

// Builds always read from a private in-memory snapshot, so retracted results
// can be filtered out without touching the canonical database.
async function snapshotFrom(schemaRows,tableRows,filter) {
  const snapshot=new DatabaseSync(':memory:');
  const schema=await schemaRows();
  for(const item of schema.filter(item=>item.type==='table')) snapshot.exec(item.sql);
  snapshot.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
  for(const name of TABLES) {
    for(const row of await tableRows(name)) snapshot.prepare(`INSERT INTO "${name}"(${Object.keys(row).map(key=>'"'+key+'"').join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`).run(...Object.values(row));
  }
  snapshot.exec('COMMIT'); // Validates the complete snapshot, including self-references.
  // The correction log keeps referencing retracted results; only this copy drops them.
  snapshot.exec('PRAGMA foreign_keys=OFF');
  for(const statement of filter) snapshot.exec(statement);
  for(const item of schema.filter(item=>item.type!=='table')) snapshot.exec(item.sql);
  return snapshot;
}

function localSnapshot(path,filter) {
  const source=new DatabaseSync(path,{readOnly:true});
  const schemaSql="SELECT type,name,sql,tbl_name FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND tbl_name IN(SELECT value FROM json_each(?))";
  return snapshotFrom(async()=>source.prepare(schemaSql).all(JSON.stringify(TABLES)),async(name)=>source.prepare(`SELECT * FROM "${name}"`).all(),filter).finally(()=>source.close());
}

async function remoteSnapshot(filter) {
  const maintenance=JSON.parse(readFileSync('wrangler.maintenance.jsonc','utf8'));
  const account=maintenance.env[environment].account_id;
  const database=maintenance.env[environment].d1_databases[0].database_id;
  // Wrangler's official credential command is captured privately, never printed or written.
  const credential=JSON.parse(execFileSync(resolve('node_modules/.bin/wrangler'),['auth','token','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  const query=async(sql,params=[])=>{
    const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,{method:'POST',headers:{Authorization:`Bearer ${credential.token}`,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
    if(!response.ok) throw new Error(`D1 snapshot query failed (${response.status}).`);
    const payload=await response.json();if(!payload.success || !payload.result?.[0]?.success) throw new Error('D1 snapshot query failed.');
    metrics.d1Queries++;metrics.d1RowsRead+=payload.result[0].meta?.rows_read??0;return payload.result[0].results;
  };
  return snapshotFrom(()=>query("SELECT type,name,sql,tbl_name FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND tbl_name IN(SELECT value FROM json_each(?))",[JSON.stringify(TABLES)]),(name)=>query(`SELECT * FROM "${name}"`),filter);
}

const snapshotAt=new Date().toISOString();
const db={prepare(sql){let params=[];return {bind(...values){params=values;return this;},async all(){return {results:sqlite.prepare(sql).all(...params),meta:{rows_read:0,rows_written:0}};},async first(){return (await this.all()).results[0]??null;},async raw(){return sqlite.prepare(sql).all(...params).map(row=>Object.values(row));}};}};

const runtimeDirectory=resolve('.wrangler/static-build');
mkdirSync(runtimeDirectory,{recursive:true});
const runtime=join(runtimeDirectory,'runtime.mjs');
await build({entryPoints:['worker/static-site.ts'],bundle:true,platform:'node',format:'esm',outfile:runtime,logLevel:'silent',
  banner:{js:"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);"},
  define:{__REGISTRY_STAGING__:JSON.stringify(buildInfo.staging),__REGISTRY_BUILD_ID__:JSON.stringify(buildInfo.id),__REGISTRY_BUILD_TIMESTAMP__:JSON.stringify(buildInfo.timestamp)}});
const site=await import(pathToFileURL(runtime).href+'?'+Date.now());
const sqlite=values.db ? await localSnapshot(resolve(values.db),site.RETRACTED_RESULT_FILTER) : await remoteSnapshot(site.RETRACTED_RESULT_FILTER);
const analytics=process.env.ANALYTICS_SCRIPT_URL ? {ANALYTICS_SCRIPT_URL:process.env.ANALYTICS_SCRIPT_URL,ANALYTICS_SITE_ID:process.env.ANALYTICS_SITE_ID} : undefined;
const result=await site.buildStaticSite({db,environment,template,analytics});
const count=(table)=>sqlite.prepare(`SELECT count(*) AS n FROM "${table}"`).get().n;
const counts={models:count('models'),benchmarks:count('benchmarks'),benchmark_versions:count('benchmark_versions'),results:count('results')};
sqlite.close();

// Generated outputs are replaced as a whole; Vite's assets and favicons stay.
for(const directory of ['data','models','benchmarks','companies','compare','badge','og','downloads']) rmSync(join(out,directory),{recursive:true,force:true});
for(const file of result.files) {
  const target=join(out,file.path);
  if(!target.startsWith(out+'/')) throw new Error(`Unsafe output path: ${file.path}`);
  mkdirSync(dirname(target),{recursive:true});writeFileSync(target,file.body);
}
// Share cards: the bundled Inter font only, never system fonts, so every machine draws the same PNG.
const fontFiles=['400Regular/Inter_400Regular.ttf','600SemiBold/Inter_600SemiBold.ttf','700Bold/Inter_700Bold.ttf'].map(file=>resolve('node_modules/@expo-google-fonts/inter',file));
for(const card of result.cards) {
  const target=join(out,card.path);
  if(!target.startsWith(out+'/')) throw new Error(`Unsafe output path: ${card.path}`);
  const png=new Resvg(card.svg,{font:{fontFiles,loadSystemFonts:false,defaultFontFamily:'Inter'}}).render().asPng();
  mkdirSync(dirname(target),{recursive:true});writeFileSync(target,png);
}
// Which build is live: answers health and "which commit is deployed" without a Worker (audit I1, I2).
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
writeFileSync(join(out,site.VERSION_FILE),JSON.stringify({commit:git('rev-parse','HEAD'),dirty:git('status','--porcelain','--untracked-files=no')!=='',commit_time:buildInfo.timestamp,built_at:new Date().toISOString(),data_snapshot_at:snapshotAt,data_generation:result.generation,environment,counts},null,2)+'\n');
const all=[];
const walk=(directory)=>{for(const entry of readdirSync(directory,{withFileTypes:true})) {const path=join(directory,entry.name);if(entry.isDirectory()) walk(path);else all.push(relative(out,path));}};
walk(out);
writeFileSync(join(out,'_headers'),site.headerRules(all,environment,result.security));
const deployed=all.filter(file=>!['_headers','_redirects'].includes(file)).length;
if(deployed>site.FILE_COUNT_BUDGET) throw new Error(`${deployed} static files exceed the ${site.FILE_COUNT_BUDGET} budget (hard limit ${site.MAX_ASSET_FILES}).`);
const largest=all.map(file=>({file,bytes:statSync(join(out,file)).size})).sort((a,b)=>b.bytes-a.bytes)[0];
if(largest.bytes>25*1024*1024) throw new Error(`${largest.file} exceeds the 25 MiB asset limit.`);
console.log(JSON.stringify({environment,generation:result.generation,...result.report,files:deployed,largestFile:largest,...(values.db?{source:'local-db'}:metrics)}));
