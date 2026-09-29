// Fixed new legal surfaces only. Uses the existing project browser-test harness.
/* global window, document, innerWidth, indexedDB, caches, getComputedStyle */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright-core';

const {values}=parseArgs({options:{host:{type:'string'},output:{type:'string'},cloudflared:{type:'string'}}});
assert.ok(['staging.benchmarkregistry.org','benchmarkregistry.org'].includes(values.host));
assert.ok(values.output);
const origin=`https://${values.host}`, staging=values.host.startsWith('staging.');
const extraHTTPHeaders=staging?{'CF-Access-Jwt-Assertion':execFileSync(values.cloudflared??'cloudflared',['access','token',`--app=${origin}`],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}:{};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const axeSource=readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
const evidence={host:values.host,verifiedAt:new Date().toISOString(),routes:[],interactions:[],storage:null,externalRequests:[],consoleDiagnostics:[],limits:['Automated Chrome and axe; no physical screen reader.','320px plus 200% text resize tests reflow, not native browser zoom.','Mailto semantics checked without sending email.']};
const errors=[],external=new Set(),diagnostics=[];let challengePlatformRequest=false;
try {
  const context=await browser.newContext({viewport:{width:1440,height:900},extraHTTPHeaders});
  const page=await context.newPage();page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/cdn-cgi/challenge-platform/')) challengePlatformRequest=true;if(new URL(r.url()).origin!==origin) external.add(new URL(r.url()).origin);});
  page.on('console',m=>{if(m.text().includes('[registry]') || m.text().includes('[Benchmark Registry]')) diagnostics.push(m.type());});
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    for(const theme of ['light','dark']) {
      await page.emulateMedia({colorScheme:theme});
      for(const kind of ['legal','privacy','terms']) {
        const response=await page.goto(`${origin}/${kind}`);assert.equal(response.status(),200);
        await page.locator('main h1').waitFor();
        assert.equal(await page.locator('main h1').count(),1);
        assert.equal(await page.locator('.primary-nav [aria-current]').count(),0);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        await page.addScriptTag({content:axeSource});
        const result=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),passes:r.passes.length};});
        evidence.routes.push({kind,width,theme,...result});assert.deepEqual(result.violations,[]);
      }
    }
  }
  await page.goto(origin+'/models/10005');
  await page.locator('.site-footer__links a').focus();await page.keyboard.press('Enter');
  await page.waitForURL('**/legal');await page.getByRole('heading',{level:1,name:'Legal',exact:true}).waitFor();
  assert.equal(await page.locator('main h1').evaluate(el=>el===document.activeElement),true);
  const support=page.getByRole('link',{name:'Support',exact:true});
  assert.equal(await support.getAttribute('href'),'mailto:support@benchmarkregistry.org');
  assert.equal(await support.getAttribute('target'),null);
  assert.equal(await support.locator('svg').getAttribute('aria-hidden'),'true');
  await support.focus();assert.equal(await support.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),true);
  await page.getByRole('link',{name:'Privacy Policy',exact:true}).focus();await page.keyboard.press('Enter');
  await page.waitForURL('**/privacy');await page.getByRole('heading',{level:1,name:'Privacy Policy',exact:true}).waitFor();
  assert.equal(await page.locator('main h1').evaluate(el=>el===document.activeElement),true);
  await page.goBack();await page.getByRole('heading',{level:1,name:'Legal',exact:true}).waitFor();
  await page.getByRole('link',{name:'Terms',exact:true}).focus();await page.keyboard.press('Enter');
  await page.waitForURL('**/terms');await page.getByRole('heading',{level:1,name:'Terms',exact:true}).waitFor();
  assert.equal(await page.locator('main h1').evaluate(el=>el===document.activeElement),true);
  evidence.interactions.push('Footer Legal, Privacy and Terms keyboard navigation focus the new H1; Support has the exact accessible name, decorative SVG, mailto and visible focus; back navigation works.');
  await page.locator('label[for=theme-dark]').click();await page.reload();assert.equal(await page.locator('#theme-dark').isChecked(),true);
  evidence.storage=await page.evaluate(async()=>({localStorageKeys:Object.keys(localStorage),theme:localStorage.getItem('benchmark-registry-theme'),sessionStorageKeys:Object.keys(sessionStorage),indexedDbNames:(await indexedDB.databases()).map(x=>x.name),cacheStorageKeys:await caches.keys(),serviceWorkers:(await navigator.serviceWorker.getRegistrations()).length,cookieNames:document.cookie.split(';').filter(Boolean).map(x=>x.split('=')[0].trim())}));
  assert.deepEqual(evidence.storage.localStorageKeys,['benchmark-registry-theme']);
  assert.ok(evidence.storage.sessionStorageKeys.every(key=>key==='_cfPre_tabId'),'Only known Cloudflare security session storage');assert.deepEqual(evidence.storage.indexedDbNames,[]);assert.deepEqual(evidence.storage.cacheStorageKeys,[]);assert.equal(evidence.storage.serviceWorkers,0);
  if(!staging) assert.ok(evidence.storage.cookieNames.every(name=>['cf_clearance','__cf_bm','__cflb','_cfuvid'].includes(name)),'Only documented Cloudflare security cookies');
  for(const theme of ['light','dark']) {
    await page.locator(`label[for=theme-${theme}]`).click();
    await page.setViewportSize({width:320,height:800});
    for(const kind of ['legal','privacy','terms']) {
      await page.goto(`${origin}/${kind}`);
      await page.addStyleTag({content:'html {font-size:200% !important}'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${kind} enlarged-text reflow`);
      await page.screenshot({path:values.output.replace(/\.json$/u,`-${kind}-${theme}-reflow.png`),fullPage:true});
    }
  }
  evidence.interactions.push('Explicit Dark persists; all three pages fit 320px at 200% text in Light and Dark.');
  await page.locator('label[for=theme-system]').click();
  evidence.externalRequests=[...external];assert.deepEqual(errors,[]);assert.deepEqual([...external],[]);
  if(!staging) assert.deepEqual(diagnostics,[]);
  evidence.challengePlatformRequest=challengePlatformRequest;evidence.externalRequests=[...external];evidence.consoleDiagnostics=Object.fromEntries([...new Set(diagnostics)].map(type=>[type,diagnostics.filter(value=>value===type).length]));evidence.result='PASS';
  await context.close();
} catch(error) {evidence.result='FAIL';evidence.failure=String(error);throw error;}
finally {writeFileSync(values.output,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(`PASS: bounded ${values.host} legal accessibility, keyboard, reflow, storage and network audit`);
