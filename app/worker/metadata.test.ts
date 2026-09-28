import template from "../index.html?raw";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index";
import { asD1Database, seedSearchFixtures } from "./search-test-fixtures";

vi.mock("./document", () => ({ renderDocument: async () => undefined }));

const resultKey = "a".repeat(64);

describe("crawler-visible page metadata", () => {
  let db: DatabaseSync;
  let env: Env;
  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    seedSearchFixtures(db);
    db.exec(`
      ALTER TABLE models ADD COLUMN company_id INTEGER DEFAULT 1;
      CREATE TABLE registry_redirects (source_model_id INTEGER, target_model_id INTEGER);
      CREATE TABLE evaluator_organizations (id INTEGER, name TEXT, normalized_name TEXT);
      CREATE TABLE benchmark_version_evaluators (id INTEGER, benchmark_version_id INTEGER, evaluator_organization_id INTEGER);
      INSERT INTO evaluator_organizations VALUES (1, 'DataCurve', 'datacurve');
      INSERT INTO evaluator_organizations VALUES (2, 'Cursor', 'cursor');
      INSERT INTO benchmark_version_evaluators VALUES (1, 2, 1);
      INSERT INTO companies VALUES (3, 'SpaceXAI', 'spacexai', 'spacexai');
      INSERT INTO companies VALUES (4, 'Anthropic', 'anthropic', 'anthropic');
      INSERT INTO models VALUES (8, 'Grok 4.7', 'grok 4.7', '40003', 3);
      INSERT INTO benchmark_versions VALUES (1, 2, 'TEST', 'test');
      INSERT INTO benchmarks VALUES (5, 'DeepSWE', 'deepswe', 'deep-swe');
      INSERT INTO benchmark_versions VALUES (2, 5, '1.1', '1.1');
      INSERT INTO benchmarks VALUES (6, 'AI2D', 'ai2d', 'ai2d');
      INSERT INTO benchmark_versions VALUES (3, 6, 'TEST', 'test');
      INSERT INTO benchmarks VALUES (7, 'ChartQA', 'chartqa', 'chartqa');
      INSERT INTO benchmark_versions VALUES (4, 7, 'TEST', 'test');
      INSERT INTO benchmarks VALUES (8, 'SWE-bench', 'swe-bench', 'swe-bench');
      INSERT INTO benchmark_versions VALUES (5, 8, 'Verified', 'verified');
      INSERT INTO benchmarks VALUES (9, 'Terminal-Bench', 'terminal-bench', 'terminal-bench');
      INSERT INTO benchmark_versions VALUES (6, 9, '2.0', '2.0');
      INSERT INTO benchmarks VALUES (10, 'Example without reviewed abbreviation', 'example', 'example');
      INSERT INTO benchmark_versions VALUES (7, 10, '2026', '2026');
      INSERT INTO results VALUES (8, 2, 'max', '${resultKey}');
      INSERT INTO benchmarks VALUES (11, 'CursorBench', 'cursorbench', 'cursorbench');
      INSERT INTO benchmark_versions VALUES (8, 11, '4', '4');
      INSERT INTO benchmark_versions VALUES (9, 11, '4.0', '4-0');
      INSERT INTO benchmark_version_evaluators VALUES (2, 8, 2);
      INSERT INTO results VALUES (8, 8, 'max', '${'c'.repeat(64)}');
      ALTER TABLE results ADD COLUMN score_raw TEXT DEFAULT '72.5%';
      ALTER TABLE results ADD COLUMN primary_source_url TEXT DEFAULT 'https://example.com/evaluation';
    `);
    env = {
      DB: asD1Database(db),
      ASSETS: { fetch: vi.fn(async () => new Response(template, {
        headers: { "Content-Type": "text/html; charset=utf-8", "ETag": "static-template", "Content-Length": String(template.length) },
      })) } as unknown as Fetcher,
    };
  });
  afterEach(() => db.close());

  async function page(path: string, host = "benchmarkregistry.org", method = "GET") {
    const response = await worker.fetch(new Request(`https://${host}${path}`, { method }), env);
    return { response, html: await response.text() };
  }
  const title = (html: string) => /<title>(.*?)<\/title>/u.exec(html)?.[1];
  const description = (html: string) => /<meta name="description" content="([^"]*)">/u.exec(html)?.[1];

  it("returns the exact homepage title and tagline in initial HTML", async () => {
    const { response, html } = await page("/");
    expect(response.status).toBe(200);
    expect(title(html)).toBe("Benchmark Registry");
    expect(description(html)).toBe("AI model benchmark results in one place | Benchmark Registry");
    expect(html).toContain('<div id="root"><main');
    expect(response.headers.has("ETag")).toBe(false);
    expect(response.headers.has("Content-Length")).toBe(false);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("uses the model and canonical company names", async () => {
    const { html } = await page("/models/10006");
    expect(title(html)).toBe("GPT-6 Astra | Benchmarks");
    expect(description(html)).toBe("OpenAI&#39;s GPT-6 Astra model evaluation and benchmark results | Benchmark Registry");
    const grok = await page("/models/40003");
    expect(title(grok.html)).toBe("Grok 4.7 | Benchmarks");
    expect(description(grok.html)).toBe("SpaceXAI&#39;s Grok 4.7 model evaluation and benchmark results | Benchmark Registry");
  });

  it("uses the reviewed common family name and exposes the full canonical name", async () => {
    const { html } = await page("/benchmarks/mmmu");
    expect(title(html)).toBe("MMMU | Benchmarks");
    expect(description(html)).toContain("MMMU (Massive Multi-discipline Multimodal Understanding)");
    const fallback = await page("/benchmarks/example");
    expect(title(fallback.html)).toBe("Example without reviewed abbreviation | Benchmarks");
  });

  it.each([
    ["/benchmarks/deep-swe/1.1", "DeepSWE 1.1"],
    ["/benchmarks/ai2d/test", "AI2D TEST"],
    ["/benchmarks/chartqa/test", "ChartQA TEST"],
    ["/benchmarks/swe-bench/verified", "SWE-bench Verified"],
    ["/benchmarks/terminal-bench/2.0", "Terminal-Bench 2.0"],
    ["/benchmarks/example/2026", "Example without reviewed abbreviation 2026"],
    ["/benchmarks/cursorbench/4", "CursorBench 4"],
    ["/benchmarks/cursorbench/4-0", "CursorBench 4.0"],
  ])("preserves exact version identity for %s", async (path, label) => {
    const { html } = await page(path);
    expect(title(html)).toBe(`${label} | Results`);
    expect(description(html)).toContain(label);
  });

  it("uses the canonical company name", async () => {
    const { html } = await page("/companies/openai");
    expect(title(html)).toBe("OpenAI | Benchmarks");
    expect(description(html)).toBe("OpenAI model evaluation and benchmark results | Benchmark Registry");
    const anthropic = await page("/companies/anthropic");
    expect(title(anthropic.html)).toBe("Anthropic | Benchmarks");
    expect(description(anthropic.html)).toBe("Anthropic model evaluation and benchmark results | Benchmark Registry");
  });

  it("uses the version evaluator and never substitutes the model developer", async () => {
    expect(description((await page("/benchmarks/deep-swe/1.1")).html)).toBe("DataCurve&#39;s DeepSWE 1.1 model results");
    expect(description((await page("/benchmarks/cursorbench/4")).html)).toBe("Cursor&#39;s CursorBench 4 model results");
    expect(description((await page("/benchmarks/ai2d/test")).html)).toBe("Model results on AI2D TEST");
    db.exec("INSERT INTO benchmark_version_evaluators VALUES (3, 2, 2)");
    expect(description((await page("/benchmarks/deep-swe/1.1")).html)).toBe("Model results on DeepSWE 1.1");
  });

  it("gives each index unique factual metadata independent of arbitrary search text", async () => {
    const pages = await Promise.all(["models", "benchmarks", "companies"].map(async (route) => (await page(`/${route}?q=arbitrary`)).html));
    expect(pages.map(title)).toEqual(["Models | Benchmark Registry", "Benchmarks | Benchmark Registry", "Companies | Benchmark Registry"]);
    expect(new Set(pages.map(description)).size).toBe(3);
    expect(pages.map(description)).toEqual(["AI models and their benchmark results", "AI benchmarks and model evaluation results", "AI companies, models, and benchmark results"]);
    expect(pages.join("")).not.toMatch(/<title>[^<]*arbitrary/u);
  });

  it("gives an immutable scoped result its clean title and description", async () => {
    const { html } = await page(`/benchmarks/deep-swe/1.1?view=history&result=${resultKey}`);
    expect(title(html)).toBe("Grok 4.7 | DeepSWE 1.1");
    expect(description(html)).toBe("SpaceXAI&#39;s Grok 4.7 evaluation results on DeepSWE 1.1");
    expect(html).toContain(`?view=history&amp;result=${resultKey}`);
    const cursor = await page(`/benchmarks/cursorbench/4?view=history&result=${"c".repeat(64)}`);
    expect(title(cursor.html)).toBe("Grok 4.7 | CursorBench 4");
    expect(description(cursor.html)).toBe("SpaceXAI&#39;s Grok 4.7 evaluation results on CursorBench 4");
  });

  it("keeps family metadata independent of its multiple stored versions", async () => {
    const family = await page("/benchmarks/cursorbench");
    expect(title(family.html)).toBe("CursorBench | Benchmarks");
    expect(description(family.html)).toBe("Model results across versions of CursorBench");
  });

  it("never returns the superseded generic SEO title patterns", async () => {
    for (const path of ["/", "/models", "/benchmarks", "/companies", "/models/40003", "/companies/anthropic", "/benchmarks/mmmu", "/benchmarks/deep-swe/1.1"]) {
      const { html } = await page(path);
      expect(title(html)).not.toMatch(/Benchmark Results|Models &amp; Benchmarks|^AI (Models|Benchmarks|Companies)| Benchmarks \| Benchmark Registry/u);
    }
  });

  it.each([
    `/benchmarks/ai2d/test?result=${resultKey}`,
    `/benchmarks/deep-swe/1.1?result=${"b".repeat(64)}`,
    "/benchmarks/deep-swe/1.1?result=invalid",
    `/benchmarks/deep-swe/1.1?result=${resultKey}&result=${resultKey}`,
  ])("keeps version metadata for an absent, unrelated, or invalid result: %s", async (path) => {
    expect(title((await page(path)).html)).toMatch(/ \| Results$/u);
  });

  it("escapes apostrophes, dots, hyphens, quotes, ampersands, and HTML punctuation", async () => {
    const name = `O'Brien's Model-5.5 "TEST" <script>&`;
    db.prepare("UPDATE models SET canonical_name = ? WHERE id = 1").run(name);
    db.prepare("UPDATE companies SET name = ? WHERE id = 1").run(`Z.ai & O'Brien`);
    const { html } = await page("/models/10006");
    expect(title(html)).toBe("O&#39;Brien&#39;s Model-5.5 &quot;TEST&quot; &lt;script&gt;&amp; | Benchmarks");
    expect(description(html)).toContain("Z.ai &amp; O&#39;Brien&#39;s O&#39;Brien&#39;s Model-5.5");
    expect(html).not.toContain(name);
    const benchmark = await page("/benchmarks/humanitys-last-exam");
    expect(title(benchmark.html)).toBe("Humanity&#39;s Last Exam | Benchmarks");
  });

  it("returns one aligned metadata set and no staging metadata or crawl policy in production", async () => {
    const { response, html } = await page("/models/10006");
    expect(html.match(/<title>/gu)).toHaveLength(1);
    expect(html.match(/name="description"/gu)).toHaveLength(1);
    expect(html).toContain(`<meta property="og:title" content="${title(html)}">`);
    expect(html).toContain(`<meta property="og:description" content="${description(html)}">`);
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta property="og:site_name" content="Benchmark Registry">');
    expect(html).toContain('property="og:url" content="https://benchmarkregistry.org/models/10006"');
    expect(html).not.toMatch(/STAGING|staging\.|noindex|published_time|twitter:/u);
    expect(response.headers.has("X-Robots-Tag")).toBe(false);
  });

  it("preserves Access-side staging protection and Worker crawler protection without a title override", async () => {
    env.STAGING_CRAWLER_PROTECTION = "enabled";
    const { response, html } = await page("/models/10006", "staging.benchmarkregistry.org");
    expect(title(html)).toBe("GPT-6 Astra | Benchmarks");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect((await page("/robots.txt", "staging.benchmarkregistry.org")).html).toBe("User-agent: *\nDisallow: /\n");
  });

  it("does not treat the global search control as a standalone search route", async () => {
    const { html } = await page("/search?q=anything");
    expect(title(html)).toBe("Page Not Found | Benchmark Registry");
    expect(html).not.toContain("Search | Benchmark Registry");
  });

  it("keeps existing immutable model redirects ahead of metadata lookup", async () => {
    db.exec("INSERT INTO registry_redirects VALUES (2, 1)");
    const { response } = await page("/models/00001?q=test");
    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://benchmarkregistry.org/models/10006?q=test");
  });

  it("keeps non-HTML assets intact and serves HEAD without a body", async () => {
    expect((await page("/models/10006", "benchmarkregistry.org", "HEAD")).html).toBe("");
    env.ASSETS = { fetch: vi.fn(async () => new Response("asset", { headers: { "Content-Type": "text/css", "ETag": "css" } })) } as unknown as Fetcher;
    const asset = await page("/assets/app.css");
    expect(asset.html).toBe("asset");
    expect(asset.response.headers.get("ETag")).toBe("css");
    expect((await page("/assets/app.css", "benchmarkregistry.org", "HEAD")).html).toBe("");
  });
  const canonical = (html: string) => /<link rel="canonical" href="([^"]*)">/u.exec(html)?.[1]?.replaceAll('&amp;', '&');

  it.each(['/', '/models', '/benchmarks', '/companies', '/models/40003', '/companies/anthropic', '/benchmarks/mmmu', '/benchmarks/deep-swe/1.1'])('self-canonicalizes the indexable content route %s', async (path) => {
    const { response, html } = await page(path);
    expect(response.status).toBe(200);
    expect(canonical(html)).toBe(`https://benchmarkregistry.org${path}`);
    expect(html.match(/rel="canonical"/gu)).toHaveLength(1);
    expect(html).not.toContain('noindex');
    expect(html).toContain('<main class="page-container registry-page"><h1>');
    expect(html).toContain(description(html));
    expect(response.headers.has('X-Robots-Tag')).toBe(false);
  });

  it('indexes the unique retained result at its stable history/result URL', async () => {
    const path = `/benchmarks/deep-swe/1.1?view=history&result=${resultKey}`;
    const { html } = await page(path);
    expect(canonical(html)).toBe(`https://benchmarkregistry.org${path}`);
    expect(html).not.toContain('noindex');
    expect(html).toContain('Grok 4.7 | DeepSWE 1.1');
    expect(html).toContain('<p>Score: 72.5%</p>');
    expect(html).toContain('<a href="https://example.com/evaluation">Source</a>');
    expect(html).toContain('<a href="/models/40003">Grok 4.7 (Registry No. 40003)</a>');
    expect(html).toContain('<a href="/companies/spacexai">SpaceXAI</a>');
  });

  it.each(['low', 'max'])('counts every retained variant/run (%s), preserves them, and excludes ambiguous SEO URLs', async (reasoning) => {
    db.exec(`INSERT INTO results (model_id, benchmark_version_id, reasoning_level, result_key) VALUES (8, 2, '${reasoning}', '${'d'.repeat(64)}')`);
    for (const key of [resultKey, 'd'.repeat(64)]) {
      const { html, response } = await page(`/benchmarks/deep-swe/1.1?view=history&result=${key}`);
      expect(response.status).toBe(200);
      expect(html).toContain('<meta name="robots" content="noindex, follow">');
      expect(canonical(html)).toBe('https://benchmarkregistry.org/benchmarks/deep-swe/1.1');
    }
    const { html } = await page('/sitemap.xml');
    expect(html).not.toContain(resultKey);
    expect(html).not.toContain('d'.repeat(64));
    expect(db.prepare('SELECT count(*) AS n FROM results WHERE model_id = 8 AND benchmark_version_id = 2').get()).toMatchObject({ n: 2 });
  });

  it.each([
    `?view=history&result=${'b'.repeat(64)}`, '?result=invalid',
    `?result=${resultKey}&result=${resultKey}`, `?view=history&result=${resultKey}&page=2`,
    '?sort=name&order=asc', '?page=2', '?company=anthropic', '?q=Grok', '?view=history', '?ui=anything',
  ])('noindexes non-SEO query state %s', async (query) => {
    const { html } = await page(`/benchmarks/deep-swe/1.1${query}`);
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
    expect(canonical(html)).toMatch(/^https:\/\/benchmarkregistry\.org\/benchmarks\/deep-swe\/1\.1/u);
    if (!query.includes(`result=${resultKey}&page`)) expect(canonical(html)).toBe('https://benchmarkregistry.org/benchmarks/deep-swe/1.1');
  });

  it('does not index a result on an unrelated benchmark version', async () => {
    const { html } = await page(`/benchmarks/ai2d/test?view=history&result=${resultKey}`);
    expect(html).toContain('noindex, follow');
    expect(canonical(html)).toBe('https://benchmarkregistry.org/benchmarks/ai2d/test');
    expect(title(html)).toBe('AI2D TEST | Results');
  });

  it.each(['/models/missing', '/benchmarks/missing', '/benchmarks/deep-swe/missing', '/companies/missing', '/arbitrary/route'])('returns real noindex 404 HTML for %s', async (path) => {
    const { response, html } = await page(path);
    expect(response.status).toBe(404);
    expect(title(html)).toBe('Page Not Found | Benchmark Registry');
    expect(html).toContain('noindex, follow');
    expect(canonical(html)).toBeUndefined();
    const head = await page(path, 'benchmarkregistry.org', 'HEAD');
    expect(head.response.status).toBe(404);
    expect(head.html).toBe('');
  });

  it('generates the complete sitemap from data, with only approved exact results and no lastmod', async () => {
    const { response, html } = await page('/sitemap.xml');
    expect(response.headers.get('Content-Type')).toContain('application/xml');
    const urls = [...html.matchAll(/<loc>(.*?)<\/loc>/gu)].map((match) => match[1].replaceAll('&amp;', '&'));
    const models = db.prepare('SELECT registry_no FROM models').all() as Array<{ registry_no: string }>;
    const families = db.prepare('SELECT slug FROM benchmarks').all() as Array<{ slug: string }>;
    const versions = db.prepare('SELECT b.slug, bv.version_slug FROM benchmark_versions bv JOIN benchmarks b ON b.id = bv.benchmark_id').all() as Array<{ slug: string; version_slug: string }>;
    const companies = db.prepare('SELECT slug FROM companies').all() as Array<{ slug: string }>;
    for (const path of ['/', '/models', '/benchmarks', '/companies',
      ...models.map((row) => `/models/${row.registry_no}`),
      ...families.map((row) => `/benchmarks/${row.slug}`),
      ...versions.map((row) => `/benchmarks/${row.slug}/${row.version_slug}`),
      ...companies.map((row) => `/companies/${row.slug}`),
      `/benchmarks/deep-swe/1.1?view=history&result=${resultKey}`]) {
      expect(urls).toContain(`https://benchmarkregistry.org${path}`);
    }
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url).not.toMatch(/staging\.|www\.|workers\.dev|sort=|company=|page=|q=/u);
    expect(html).not.toContain('<lastmod>');
    // Every advertised URL must actually serve an indexable, self-canonical 200 document.
    for (const url of urls) {
      const document = await page(url.replace('https://benchmarkregistry.org', ''));
      expect(document.response.status, url).toBe(200);
      expect(canonical(document.html), url).toBe(url);
      expect(document.html, url).not.toContain('noindex');
    }
  });

  it('excludes redirected models and their results from the sitemap', async () => {
    db.exec('INSERT INTO registry_redirects VALUES (8, 1)');
    const { html } = await page('/sitemap.xml');
    expect(html).not.toContain('/models/40003');
    expect(html).not.toContain(resultKey);
  });

  it('allows production crawling without blocking query URLs needed for noindex', async () => {
    const { response, html } = await page('/robots.txt');
    expect(response.status).toBe(200);
    expect(html).toBe('User-agent: *\nAllow: /\n\nSitemap: https://benchmarkregistry.org/sitemap.xml\n');
    expect(response.headers.has('X-Robots-Tag')).toBe(false);
  });

  it('keeps staging protected with production canonical equivalents, including sitemap', async () => {
    env.STAGING_CRAWLER_PROTECTION = 'enabled';
    for (const path of ['/models/40003', '/sitemap.xml', '/robots.txt']) {
      const { response, html } = await page(path, 'staging.benchmarkregistry.org');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
      expect(html).not.toContain('https://staging.');
      if (path === '/models/40003') expect(canonical(html)).toBe('https://benchmarkregistry.org/models/40003');
      if (path === '/robots.txt') expect(html).toBe('User-agent: *\nDisallow: /\n');
    }
    const preview = await page('/robots.txt', 'preview.workers.dev');
    expect(preview.html).toBe('User-agent: *\nDisallow: /\n');
    expect(preview.response.headers.get('X-Robots-Tag')).toContain('noindex');
  });

  it('normalizes trailing slashes and escaped entity keys permanently without losing queries', async () => {
    for (const path of ['/models/40003/', '/models/%34%30%30%30%33']) {
      const { response } = await page(path + '?view=history');
      expect(response.status).toBe(308);
      expect(response.headers.get('Location')).toBe('https://benchmarkregistry.org/models/40003?view=history');
    }
  });

  it('redirects HTTP to HTTPS and gives APIs a noindex policy', async () => {
    const response = await worker.fetch(new Request('http://benchmarkregistry.org/models/40003?q=test'), env);
    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('https://benchmarkregistry.org/models/40003?q=test');
    const api = await page('/api/no-such-route');
    expect(api.response.status).toBe(404);
    expect(api.response.headers.get('X-Robots-Tag')).toBe('noindex, follow');
  });

});
