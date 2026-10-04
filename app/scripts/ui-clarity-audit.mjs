/* global document, window, innerWidth, getComputedStyle */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright-core';

const { values } = parseArgs({ options: { base: { type: 'string' }, phase: { type: 'string' }, output: { type: 'string' }, chrome: { type: 'string' } } });
const base = values.base ?? 'http://127.0.0.1:4197';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local targets only');
const phase = values.phase ?? 'after';
const directory = resolve(values.output ?? '../docs/ui-clarity');
mkdirSync(directory, { recursive: true });
const axe = readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
const pages = [
  ['/benchmarks/terminal-bench', 'terminal-bench'],
  ['/models/20015', 'claude-opus-5.5'],
  ['/benchmarks/terminal-bench/2-1', 'terminal-bench-2.1'],
];
const browser = await chromium.launch({ executablePath: values.chrome ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = { phase, status: "running", pages: [], interactions: [], errors: [] };
try {
  for (const width of [1440, 390]) {
    for (const javaScriptEnabled of phase === 'before' ? [true] : [true, false]) {
      for (const colorScheme of phase === 'after' && javaScriptEnabled ? ['light', 'dark'] : ['light']) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, javaScriptEnabled, colorScheme });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => report.errors.push(error.message));
      for (const [path, slug] of pages) {
        const response = await page.goto(base + path);
        assert.equal(response.status(), 200, path);
        await page.locator('main h1').waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (javaScriptEnabled && colorScheme === 'light') await page.screenshot({ path: resolve(directory, `${phase}-${slug}-${width}.png`), fullPage: true });
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          h1: document.querySelectorAll('main h1').length,
          tables: [...document.querySelectorAll('main table')].every(table => table.querySelector('caption, [aria-label]') && [...table.querySelectorAll('thead th')].every(th => th.scope === 'col')),
          skippedHeading: [...document.querySelectorAll('main h1, main h2, main h3, main h4')].some((node, i, all) => i > 0 && Number(node.tagName.slice(1)) > Number(all[i - 1].tagName.slice(1)) + 1),
        }));
        assert.equal(state.h1, 1, path);
        assert.equal(state.overflow, false, `${path}: page overflow at ${width}`);
        assert.ok(state.tables, `${path}: table semantics`);
        assert.equal(state.skippedHeading, false, `${path}: heading levels`);
        let violations = [];
        if (phase === 'after' && javaScriptEnabled) {
          // Axe uses timers; check no-JS semantics above without running the timed checker.
          await page.evaluate(axe);
          violations = await page.evaluate(async () => (await Promise.race([window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }), new Promise((_, reject) => setTimeout(() => reject(new Error('axe timeout')), 20000))])).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })));
          assert.deepEqual(violations, [], `${path}/${width}/JS=${javaScriptEnabled}: axe`);
        }
        report.pages.push({ path, width, javaScriptEnabled, colorScheme, ...state, axeChecked: phase === 'after' && javaScriptEnabled, violations });
      }
      if (phase === 'after' && width === 390 && colorScheme === 'light') {
        await page.goto(base + '/benchmarks/terminal-bench');
        const summary = page.locator('.version-variants summary').first();
        await summary.focus();
        assert.notEqual(await summary.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'Summary focus outline');
        const wasOpen = await summary.evaluate(el => el.parentElement.open);
        await page.keyboard.press('Enter');
        assert.equal(await summary.evaluate(el => el.parentElement.open), !wasOpen, 'Enter toggles native details');
        await page.keyboard.press('Space');
        assert.equal(await summary.evaluate(el => el.parentElement.open), wasOpen, 'Space toggles native details');
        const scroll = page.locator('main .table-scroll').first();
        await scroll.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(250);
        assert.ok(await scroll.evaluate(el => el.scrollLeft > 0), 'Keyboard table scrolling');
        await page.goto(base + '/models/20015');
        const history = page.locator('main .tabs a', { hasText: 'History' });
        await history.focus(); await page.keyboard.press('Enter');
        await page.waitForURL('**view=history**');
        assert.equal(await page.locator('main .tabs a[aria-current]').textContent(), 'History');
        const sort = page.locator('th a[href*="sort=benchmark"]');
        await sort.focus(); await page.keyboard.press('Enter');
        await page.waitForURL('**sort=benchmark**');
        assert.equal(await page.locator('[aria-sort]').getAttribute('aria-sort'), 'descending');
        const sourceSort = page.locator('th a[href*="sort=source"]');
        await sourceSort.focus(); await page.keyboard.press('Enter');
        await page.waitForURL('**sort=source**');
        assert.equal(await page.locator('[aria-sort]').getAttribute('aria-sort'), 'ascending');
        const compare = page.locator('.model-compare');
        await compare.focus(); await page.keyboard.press('Enter');
        await page.waitForURL('**/compare?models=*');
        assert.equal(await page.locator('#compare-model-0').inputValue(), '20015', 'Compare preselection');
        report.interactions.push({ javaScriptEnabled, checks: ['Native details Enter/Space and focus outline', 'Keyboard table scrolling', 'History tab', 'Benchmark/source sort and aria-sort', 'Compare preselection'] });
      }
      await context.close();
      }
    }
  }
  assert.deepEqual(report.errors, [], 'Browser errors');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.errors.push(error.message);
  throw error;
} finally {
  await browser.close();
  writeFileSync(resolve(directory, `${phase}-checks.json`), JSON.stringify(report, null, 2) + '\n');
}
console.log(`${phase}: ${report.pages.length} page/viewport/JS checks passed`);
