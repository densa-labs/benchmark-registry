// Check existing bounded homepage reports; this command never starts a crawl.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
const {values}=parseArgs({options:{mobile:{type:'string'},desktop:{type:'string'}}});
for(const profile of ['mobile','desktop']) {
  assert.ok(values[profile],`Pass --${profile} /path/to/homepage-report.json`);
  const report=JSON.parse(readFileSync(values[profile],'utf8'));
  assert.equal(new URL(report.finalDisplayedUrl ?? report.finalUrl).origin,'https://benchmarkregistry.org');
  assert.equal(new URL(report.finalDisplayedUrl ?? report.finalUrl).pathname,'/');
  assert.ok(report.categories.performance.score>=(profile==='mobile'?0.90:0.95),`${profile} performance regression`);
  assert.ok(report.audits['largest-contentful-paint'].numericValue<=(profile==='mobile'?2500:1500),`${profile} LCP regression`);
  assert.ok(report.audits['total-blocking-time'].numericValue<=250,`${profile} blocking-time regression`);
  assert.ok(report.audits['cumulative-layout-shift'].numericValue<=0.1,`${profile} layout-shift regression`);
  console.log(`${profile}: performance ${Math.round(report.categories.performance.score*100)}, homepage regression thresholds passed`);
}
