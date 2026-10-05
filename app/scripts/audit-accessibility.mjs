// Fixed representative sample, never a crawl. No production runtime dependency.
/* global window, document, getComputedStyle, innerWidth, innerHeight */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright-core';

const {values}=parseArgs({options:{host:{type:'string'},base:{type:'string'},output:{type:'string'},cloudflared:{type:'string'},chrome:{type:'string'},quick:{type:'boolean'}}});
// --base serves a local production build (npm run preview), e.g. http://127.0.0.1:8787.
const local=values.base ? new URL(values.base) : null;
assert.ok(local ? ['127.0.0.1','localhost'].includes(local.hostname) : ['staging.benchmarkregistry.org','benchmarkregistry.org'].includes(values.host));
assert.ok(values.output);
if(local) values.host=local.host;
const staging=!local && values.host.startsWith('staging.');
const origin=local ? local.origin : `https://${values.host}`;
const extraHTTPHeaders=staging?{'CF-Access-Jwt-Assertion':execFileSync(values.cloudflared??'cloudflared',['access','token',`--app=${origin}`],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}:{};
const browser=await chromium.launch({executablePath:values.chrome??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const exact='/benchmarks/automationbench/1-0-6?view=history&result=4b14afd90fb1cc979b76f2f3a99a5f1e5610e93a84bd6f19559467343de5481b';
const paths=staging?['/','/models','/models/10005','/benchmarks','/benchmarks/gpqa','/benchmarks/gpqa/diamond','/companies','/companies/openai',exact,'/models/99999']
  // Locally, also the pages the October 2026 audit found target-size failures on.
  :local?['/','/models','/models/10005','/models/20015','/recent','/benchmarks','/benchmarks/gpqa/diamond','/benchmarks/mmmu-pro/no-tools','/companies','/companies/anthropic',exact,'/models/99999']
  :['/','/models/10005','/benchmarks/gpqa/diamond','/companies/openai',exact,'/models/99999'];
const evidence={host:values.host,started:new Date().toISOString(),axeVersion:JSON.parse(readFileSync(new URL('../node_modules/axe-core/package.json',import.meta.url),'utf8')).version,routes:[],interactions:[],limits:['Automated Chrome keyboard and accessibility-tree checks; no physical screen reader or touch-device test.','200% text resize and constrained layout are automated separately from actual browser zoom.']};
// axe is injected as an inline script, which the site's CSP correctly blocks.
const bypassCSP=true;
const errors=[];
const axeSource=readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
async function axeCheck(page,label) {
  await page.addScriptTag({content:axeSource});
  const result=await page.evaluate(async()=>{
    const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});
    return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:r.passes.length};
  });
  evidence.routes.push({label,...result});
  assert.deepEqual(result.violations,[],label);
}
function check(condition,message) {assert.ok(condition,message);}
try {
  for(const width of values.quick?[]:staging||local?[1440,390]:[390]) {
    const context=await browser.newContext({viewport:{width,height:900},extraHTTPHeaders,bypassCSP});
    const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
    for(const theme of staging?['light','dark']:['light']) {
      await page.emulateMedia({colorScheme:theme});
      for(const path of paths) {
        const response=await page.goto(origin+path);await page.locator('main h1').waitFor();
        assert.equal(response.status(),path.endsWith('99999')?404:200,path);
        // Static assets: no Worker, so no diagnostics headers.
        assert.equal(Object.keys(response.headers()).some(name=>name.startsWith('x-registry-') || name==='server-timing'),false,path);
        assert.equal(await page.locator('main h1').count(),1,path);
        assert.equal(await page.locator('main').count(),1,path);
        assert.equal(await page.locator('.staging-banner').count(),staging?1:0);
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow ${path}/${width}`);
        if(staging) assert.equal(response.headers()['x-robots-tag'],'noindex, nofollow, noarchive');
        await axeCheck(page,`${path} ${width} ${theme}`);
      }
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},extraHTTPHeaders,bypassCSP});
  const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/models');
  await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(el=>el===document.activeElement),true);
  const skipVisible=await page.locator('.skip-link').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+5,r.top+5));});check(skipVisible,'Skip link above sticky header');
  await page.keyboard.press('Enter');assert.equal(await page.locator('main').evaluate(el=>el===document.activeElement),true);
  await page.locator('.wordmark').focus();await page.keyboard.press('Tab');
  assert.equal(await page.locator('.mobile-menu-toggle').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Space');assert.equal(await page.locator('.mobile-menu-toggle').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Tab');assert.equal(await page.locator('#global-search-input').evaluate(el=>el===document.activeElement),true);
  await page.locator('#global-search-input').fill('gpt');await page.keyboard.press('Enter');await page.locator('.global-search-results a').first().waitFor();
  // Measure contrast after the menu's opacity transition, not mid-fade.
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.header-menu')).opacity==='1');
  await axeCheck(page,'Mobile global search expanded');
  // Submit button, then the operator hint link, then the first result.
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  check(await page.locator('.global-search-results a').first().evaluate(el=>el===document.activeElement),'Search results reachable through Tab');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#global-search-input').evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('.mobile-menu-toggle').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');assert.equal(await page.locator('.mobile-menu-toggle').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('.mobile-menu-toggle').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Tab');check(await page.evaluate(()=>!document.activeElement.closest('#header-menu')),'Closed menu does not retain focus');
  evidence.interactions.push('Skip link visible and focuses main; mobile Space/open, search Tab/Enter/results, nested Escape and focus restoration; closed menu omitted from Tab order.');

  await page.locator('th a[href*="sort=name"]').focus();await page.keyboard.press('Enter');
  await page.waitForURL('**/models?sort=name&order=asc');
  assert.equal(await page.locator('[aria-sort]').count(),1);
  assert.equal(await page.locator('[aria-sort]').getAttribute('aria-sort'),'ascending');
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-focus-key')),'sort-Model');
  await page.locator('.table-scroll').focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.table-scroll').scrollLeft>0);
  await page.locator('.pagination a[rel=next]').focus();await page.keyboard.press('Enter');await page.waitForURL('**page=2*');
  check(await page.locator('[data-route-status]').textContent().then(x=>x.includes('Page 2')),'Pagination announcement');
  check(await page.evaluate(()=>document.activeElement!==document.body),'Pagination retains logical focus');
  await page.locator('#local-search-input').fill('a11y-no-results');await page.locator('#local-search-input').press('Enter');await page.locator('.state-message h3').waitFor();
  check(await page.locator('[data-route-status]').textContent().then(x=>x.includes('0 models')),'Empty local search announcement');
  await axeCheck(page,'Empty local search');
  await page.locator('.local-search__clear').focus();await page.keyboard.press('Enter');await page.locator('table').waitFor();
  await page.locator('.mobile-menu-toggle').press('Enter');await page.locator('.primary-nav a[href="/benchmarks"]').focus();await page.keyboard.press('Enter');await page.waitForURL('**/benchmarks');
  check(await page.locator('h1').evaluate(el=>el===document.activeElement),'Route identity gets focus');
  check(await page.title().then(title=>staging?title==='STAGING | Benchmark Registry':title.startsWith('AI Benchmarks')),'Route title');
  await page.locator('.mobile-menu-toggle').press('Enter');await page.locator('.primary-nav a[href="/models"]').press('Enter');await page.waitForURL('**/models');
  check(await page.locator('h1').evaluate(el=>el===document.activeElement),'Cached route still gets focus');
  evidence.interactions.push('Sort state and restored control focus; keyboard table scrolling; pagination announcement; local search/empty/clear; cold and cached route identity focus.');

  await page.locator('#theme-system').focus();await page.keyboard.press('ArrowLeft');
  check(await page.locator('#theme-dark').isChecked(),'Native theme arrow keys');await page.keyboard.press('ArrowLeft');check(await page.locator('#theme-light').isChecked(),'Native theme arrow keys light');
  await page.locator('label[for=theme-dark]').click();await page.reload();check(await page.locator('#theme-dark').isChecked(),'Explicit theme persists');await axeCheck(page,'Explicit Dark theme');
  const contrast=await page.evaluate(()=>{
    const s=getComputedStyle(document.documentElement);const rgb=c=>c.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
    const lum=c=>rgb(c).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const ratio=(a,b)=>{const x=lum(s.getPropertyValue(a).trim()),y=lum(s.getPropertyValue(b).trim());return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    return {text:ratio('--text','--background'),muted:ratio('--text-muted','--surface-strong'),focus:ratio('--focus','--surface-strong'),control:ratio('--control-border','--surface'),accent:ratio('--accent','--surface-strong')};
  });
  check(contrast.text>=4.5 && contrast.muted>=4.5 && contrast.accent>=4.5 && contrast.focus>=3 && contrast.control>=3,'Dark contrast');evidence.interactions.push({darkContrast:contrast});
  await page.locator('label[for=theme-system]').click();check(await page.locator('input[name="color-theme"]:checked').count()===1,'One selected native radio');
  await page.locator('.last-updated').focus();await page.keyboard.press('Space');assert.equal(await page.locator('.last-updated').getAttribute('aria-pressed'),'true');await page.keyboard.press('Enter');assert.equal(await page.locator('.last-updated').getAttribute('aria-pressed'),'false');
  // The footer's links (license, then the link list) in order, then the theme control.
  const footerOrder=[page.locator('.site-footer a[href*="creativecommons.org"]'),...await page.locator('.site-footer__links a').all()];
  for(const link of footerOrder) {await page.keyboard.press('Tab');assert.equal(await link.evaluate(el=>el===document.activeElement),true);}
  await page.keyboard.press('Tab');assert.equal(await page.locator('#theme-system').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await page.locator('.github-link').evaluate(el=>el===document.activeElement),true);
  evidence.interactions.push('Native theme arrows, one selected radio, explicit theme persistence, System restoration; Last updated Space/Enter toggle; Legal/theme/GitHub keyboard order.');

  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.mobile-menu-toggle').press('Enter');
  check(await page.locator('.header-menu').evaluate(el=>getComputedStyle(el).transitionDuration.split(',').every(x=>parseFloat(x)===0)),'Reduced menu motion');
  check(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior==='auto'),'Reduced scrolling motion');
  await page.locator('.mobile-menu-toggle').press('Escape');
  await page.setViewportSize({width:320,height:800});
  await page.addStyleTag({content:'html { font-size: 200% !important; }'});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'320px, 200% text reflow');
  await page.locator('.mobile-menu-toggle').press('Enter');check(await page.locator('#global-search-input').isVisible(),'Enlarged-text menu usable');
  await page.screenshot({path:values.output.replace(/\.json$/u,'-reflow.png'),fullPage:false});
  await page.locator('.mobile-menu-toggle').press('Escape');await page.locator('.github-link').focus();
  check(await page.locator('.github-link').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),'Enlarged-text footer fits');
  evidence.interactions.push('Reduced-motion menu/scrolling; 320px viewport with 200% text: page, menu and footer reflow.');
  if(staging) {
    await page.goto(origin+'/models');
    await page.route('**/benchmarks',async route=>{await new Promise(resolve=>setTimeout(resolve,250));await route.abort();});
    await page.locator('.mobile-menu-toggle').press('Enter');await page.locator('.primary-nav a[href="/benchmarks"]').press('Enter');
    await page.locator('main[aria-busy=true]').waitFor();
    check(await page.locator('.skeleton').first().evaluate(el=>getComputedStyle(el).animationName==='none'),'Reduced-motion skeleton is static');
    check(await page.locator('main [role=status]').count()>0,'Meaningful loading status');
    await page.locator('[role=alert]').waitFor();
    assert.equal(await page.locator('main h1').count(),1);await axeCheck(page,'Navigation failure retains page and alert');
    evidence.interactions.push('Injected staging-browser navigation failure: static reduced-motion skeleton, retained page, accessible error alert.');
  }
  {
    const phone=await browser.newContext({viewport:{width:390,height:844},extraHTTPHeaders,bypassCSP});
    const view=await phone.newPage();view.setDefaultTimeout(8000);view.on('pageerror',error=>errors.push(error.message));
    // Audit D1: the first model score is above the fold on a 390x844 phone.
    await view.goto(origin+'/models/20015');
    check(await view.locator('#benchmarks-heading').evaluate(heading=>{const cell=heading.closest('section').querySelector('tbody td.numeric');return Boolean(cell)&&cell.getBoundingClientRect().bottom<=innerHeight;}),'First model score above the fold at 390x844');
    // Audit D2: the record citation dialog opens from the keyboard, passes axe, and returns focus on Escape.
    await view.goto(origin+'/recent');
    const cite=view.locator('button.record-cite').first();await cite.focus();await view.keyboard.press('Enter');
    await view.locator('dialog.record-dialog[open]').waitFor();
    await axeCheck(view,'Record citation dialog');
    await view.keyboard.press('Escape');await view.locator('dialog.record-dialog').waitFor({state:'detached'});
    check(await cite.evaluate(el=>el===document.activeElement),'Citation dialog returns focus on Escape');
    evidence.interactions.push('390x844: first model score above the fold; record citation dialog by keyboard, axe, Escape and focus return.');
    await phone.close();
  }
  assert.deepEqual(errors,[],'Client exceptions');
  evidence.result='PASS';
  await context.close();
} catch(error) {evidence.result='FAIL';evidence.failure=String(error);throw error;}
finally {writeFileSync(values.output,JSON.stringify(evidence,null,2)+'\n');await browser.close();}
console.log(`PASS: bounded ${origin} accessibility and keyboard audit`);
