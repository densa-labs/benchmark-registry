// Read-only deployed settings check. Credentials remain in memory and are never output.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

const {values}=parseArgs({options:{environment:{type:'string'},output:{type:'string'},version:{type:'string'}}});
assert.ok(['staging','production'].includes(values.environment));assert.ok(values.output);
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
const credential=JSON.parse(execFileSync('./node_modules/.bin/wrangler',['auth','token','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}}));
const account=config.env.production.account_id;
const script=`benchmark-registry-${values.environment}`;
async function read(endpoint) {
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}/${endpoint}`,{headers:{Authorization:`Bearer ${credential.token}`}});
  assert.equal(response.status,200,`Settings read failed: ${endpoint}`);
  const body=await response.json();assert.equal(body.success,true);return body.result;
}
const settings=await read('script-settings');
const bindings=await read('settings');
// Cloudflare normalizes no persistence + no destinations to null observability.
assert.equal(settings.observability??null,null);
assert.equal(settings.logpush,false);
assert.equal(settings.tail_consumers?.length??0,0);
const d1=bindings.bindings.filter(binding=>binding.type==='d1');
assert.equal(d1.length,1);
assert.equal(d1[0].name,'DB');
assert.equal(d1[0].id,config.env[values.environment].d1_databases[0].database_id);
assert.ok(bindings.bindings.some(binding=>binding.name==='READ_STORE' && binding.type==='kv_namespace'));
const evidence={verifiedAt:new Date().toISOString(),version:values.version,observability:settings.observability??null,logpush:settings.logpush,tail_consumers:settings.tail_consumers??null,publicD1Binding:true,sourceControls:config.env[values.environment].observability,note:'Cloudflare normalizes disabled persistence and empty destinations to null; dashboard stored-event inspection is recorded separately.'};
writeFileSync(values.output,JSON.stringify(evidence,null,2)+'\n');
console.log(`PASS: ${script} deployed persistence/export controls and the isolated Coverage/Health D1 binding`);
