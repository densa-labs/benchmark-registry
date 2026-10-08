// Build-time static site producer. Renders every public page with the same
// document, metadata and API code the Worker used, so output stays identical,
// and emits the files Workers static assets serve without invoking a Worker.
import { CONTENT_PATHS } from "../src/content-metadata";
import { LEGAL_PATHS } from "../src/legal-content";
import { CANONICAL_ORIGIN } from "../src/seo-config";
import { STATIC_MANIFEST_PATH, staticObjectPath, type StaticDataManifest } from "../src/static-api";
import { analyticsConfiguration, type AnalyticsEnvironment } from "./analytics";
import { handleRequest, type Env } from "./index";
import { buildGeneration } from "./materializer";
import { MaterializedRepository } from "./materialized-repository";
import { verifyGeneration } from "./publication";
import { latestReportedResult } from "./featured-result";
import { LEGACY_ROOT_SLUGS } from "./legacy-root-slugs";
import { digest, type ReadData, type ReadEnvironment, type ReadObject } from "./read-model";
import { benchmarkShareCard, comparisonCardRows, comparisonShareCard, modelShareCard, siteShareCard, type ShareCard } from "./share-card";
import { LLMS_TXT_PATH, RESULTS_CSV_PATH, llmsText, resultsCsv } from "./downloads";
import type { ResultRow } from "./api";

export type SiteEnvironment = "staging" | "production";
export interface StaticFile { path: string; body: string }
export interface StaticSiteOptions {
  db: D1Database;
  environment: SiteEnvironment;
  /** The Vite-built index.html every page is rendered into. */
  template: string;
  analytics?: AnalyticsEnvironment;
  /** Root-level legacy model slugs; defaults to the frozen allow-list. Fixture databases pass `{}`. */
  legacyRootSlugs?: Readonly<Record<string, string>>;
}
export interface StaticSite {
  files: StaticFile[];
  /** Share-card SVGs; scripts/build-static.mjs rasterises each to PNG at its path. */
  cards: ShareCard[];
  generation: string;
  security: SecurityPolicy;
  report: { pages: number; badges: number; dataFiles: number; redirects: number; dynamicRedirects: number };
}
/** What the CSP must allow: the hashed inline scripts the build emitted and any configured analytics script. */
export interface SecurityPolicy { scriptHashes: string[]; analyticsScript?: string }

/** Workers static assets limits (free plan) the build must stay inside. */
export const MAX_ASSET_FILES = 20_000;
export const FILE_COUNT_BUDGET = 15_000;
export const MAX_STATIC_REDIRECTS = 2_000;
export const MAX_DYNAMIC_REDIRECTS = 100;
export const MAX_HEADER_RULES = 100;
export const HTML_CACHE_CONTROL = "public, max-age=300, must-revalidate";
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
/** Build identity written by scripts/build-static.mjs; never cached. */
export const VERSION_FILE = "version.json";
const STAGING_ROBOTS_TAG = "noindex, nofollow, noarchive";
/**
 * Cloudflare Web Analytics is injected automatically on production only; staging must not load it.
 * An origin, not a file: the injected URL carries a version path (`beacon.min.js/v31…`).
 */
export const CLOUDFLARE_WEB_ANALYTICS_SCRIPT = "https://static.cloudflareinsights.com";
/** Only the theme script may be inline; a second one must be reviewed, not silently allowed. */
export const MAX_INLINE_SCRIPTS = 1;
const EXECUTABLE_SCRIPT_TYPES = new Set(["", "module", "text/javascript", "application/javascript"]);

/** `/models/10006` → `models/10006.html`; `/` → `index.html`; files keep their name. */
// Retracted results stay stored in D1 but never reach a public page, data file,
// search index, badge, sitemap or feed. The build removes them (with their
// evaluator and source joins) from its private in-memory snapshot only; their
// correction log entries remain and feed /corrections.
export const RETRACTED_RESULT_FILTER = [
  "DELETE FROM result_evaluators WHERE result_id IN (SELECT id FROM results WHERE retracted_at IS NOT NULL)",
  "DELETE FROM result_sources WHERE result_id IN (SELECT id FROM results WHERE retracted_at IS NOT NULL)",
  "DELETE FROM results WHERE retracted_at IS NOT NULL",
] as const;

export function pageFile(path: string): string {
  if (path === "/") return "index.html";
  const decoded = decodeURIComponent(path).replace(/^\//u, "").replace(/\/$/u, "");
  if (!decoded || decoded.split("/").some((part) => !part || part === "." || part === "..")) throw new Error(`Unsafe page path: ${path}`);
  return /\.(xml|txt|svg|csv|png)$/u.test(decoded) ? decoded : `${decoded}.html`;
}

const nameSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/gu, "");
const hyphenSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");

/**
 * Redirects for identities that still exist. Retired identities with no
 * equivalent (an unknown version, an unlisted root slug) get the real 404 page.
 */
export function redirectRules(data: Pick<ReadData, "redirects" | "seo">, versions: Array<{ family: string; version: string }>, legacyRootSlugs: Readonly<Record<string, string>> = LEGACY_ROOT_SLUGS): { lines: string[]; dynamic: number } {
  const lines: string[] = [];
  const seen = new Set<string>();
  const add = (source: string, target: string, status: 301 | 308) => {
    if (seen.has(source) || source === target) return;
    seen.add(source);lines.push(`${source} ${target} ${status}`);
  };
  for (const redirect of data.redirects) add(`/models/${redirect.source}`, `/models/${redirect.target}`, 308);
  for (const { family, version } of versions) add(`/benchmarks/${family}/versions/${version}`, `/benchmarks/${family}/${version}`, 301);
  // v1 used a `default` version for the family as a whole; only existing families have one.
  for (const family of [...new Set(versions.map(({ family }) => family))].sort()) add(`/benchmarks/${family}/versions/default`, `/benchmarks/${family}`, 301);
  const retired = new Set(data.redirects.map((redirect) => redirect.source));
  for (const model of data.seo.models) {
    if (retired.has(model.registry_no)) continue;
    for (const slug of new Set([nameSlug(model.name), hyphenSlug(model.name)])) {
      if (!slug || /^[0-9]+$/u.test(slug)) continue;
      add(`/models/${slug}`, `/models/${model.registry_no}`, 301);
    }
  }
  const published = new Set(data.seo.models.map((model) => model.registry_no).filter((registryNo) => !retired.has(registryNo)));
  for (const [slug, registryNo] of Object.entries(legacyRootSlugs)) {
    if (!published.has(registryNo)) throw new Error(`Legacy root slug /${slug} points at ${registryNo}, which is not a published model.`);
    add(`/${slug}`, `/models/${registryNo}`, 301);
  }
  const dynamic = [
    // Trailing-slash variants redirect permanently to the canonical path, as the Worker did.
    "/:a/ /:a 308", "/:a/:b/ /:a/:b 308", "/:a/:b/:c/ /:a/:b/:c 308",
  ];
  if (lines.length > MAX_STATIC_REDIRECTS) throw new Error(`${lines.length} static redirects exceed the ${MAX_STATIC_REDIRECTS} limit.`);
  return { lines: [...lines, ...dynamic], dynamic: dynamic.length };
}

/**
 * Cache rules. Patterns never overlap for Cache-Control, because overlapping
 * `_headers` rules append values instead of replacing them.
 */
export function headerRules(files: string[], environment: SiteEnvironment, security: SecurityPolicy): string {
  const blocks: string[] = [];
  const rule = (pattern: string, headers: Record<string, string>) => blocks.push([pattern, ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`)].join("\n"));
  rule("/assets/*", { "Cache-Control": IMMUTABLE_CACHE_CONTROL });
  rule("/data/objects/*", { "Cache-Control": IMMUTABLE_CACHE_CONTROL, "X-Robots-Tag": "noindex" });
  rule("/data/manifest.json", { "Cache-Control": HTML_CACHE_CONTROL, "X-Robots-Tag": "noindex" });
  if (files.includes(VERSION_FILE)) rule(`/${VERSION_FILE}`, { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  const top = new Map<string, "file" | "directory">();
  for (const file of files) {
    const [first, ...rest] = file.split("/");
    if (["assets", "data", "_headers", "_redirects", "404.html", VERSION_FILE].includes(first)) continue;
    if (rest.length) top.set(first, "directory");
    else if (!top.has(first)) top.set(first, "file");
  }
  for (const [name, kind] of [...top].sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const headers: Record<string, string> = { "Cache-Control": HTML_CACHE_CONTROL };
    if (name === "feed.xml" || name === "badge") headers["X-Robots-Tag"] = "noindex";
    if (name === "feed.xml") headers["Content-Type"] = "application/atom+xml; charset=utf-8";
    if (name === "llms.txt") headers["Content-Type"] = "text/plain; charset=utf-8";
    if (name === "downloads") Object.assign(headers, { "Content-Type": "text/csv; charset=utf-8", "X-Robots-Tag": "noindex" });
    if (kind === "directory") {
      rule(`/${name}/*`, headers);
      continue;
    }
    if (name === "index.html") rule("/", headers);
    else if (name.endsWith(".html")) rule(`/${name.slice(0, -5)}`, headers);
    else rule(`/${name}`, headers);
  }
  rule("/*", { ...(environment === "staging" ? { "X-Robots-Tag": STAGING_ROBOTS_TAG } : {}), ...securityHeaders(environment, security) });
  if (blocks.length > MAX_HEADER_RULES) throw new Error(`${blocks.length} header rules exceed the ${MAX_HEADER_RULES} limit.`);
  return blocks.join("\n\n") + "\n";
}

/** CSP hashes of every executable inline script in the given HTML documents. */
export async function inlineScriptHashes(documents: string[]): Promise<string[]> {
  const hashes = new Set<string>();
  for (const html of documents) {
    for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/giu)) {
      if (/\ssrc\s*=/iu.test(attributes)) continue;
      const type = /\stype\s*=\s*["']?([^"'\s>]+)/iu.exec(attributes)?.[1].toLowerCase() ?? "";
      if (!EXECUTABLE_SCRIPT_TYPES.has(type)) continue;
      const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)));
      hashes.add(`'sha256-${btoa(String.fromCharCode(...bytes))}'`);
    }
  }
  if (hashes.size > MAX_INLINE_SCRIPTS) throw new Error(`${hashes.size} distinct inline scripts exceed the ${MAX_INLINE_SCRIPTS} the CSP allows.`);
  return [...hashes].sort();
}

export function contentSecurityPolicy(environment: SiteEnvironment, policy: SecurityPolicy): string {
  const scripts = ["'self'", ...policy.scriptHashes];
  if (environment === "production") scripts.push(CLOUDFLARE_WEB_ANALYTICS_SCRIPT);
  if (environment === "production" && policy.analyticsScript) scripts.push(policy.analyticsScript);
  const connect = ["'self'"];
  if (environment === "production" && policy.analyticsScript) connect.push(new URL(policy.analyticsScript).origin);
  return [
    "default-src 'self'", `script-src ${scripts.join(" ")}`, "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:", "font-src 'self'", `connect-src ${connect.join(" ")}`, "object-src 'none'",
    "frame-ancestors 'none'", "base-uri 'none'", "form-action 'self'",
  ].join("; ");
}

/** Sent on every response. Each name appears in exactly one rule, so values never append. */
export function securityHeaders(environment: SiteEnvironment, policy: SecurityPolicy): Record<string, string> {
  return {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": contentSecurityPolicy(environment, policy),
  };
}

export function robotsFile(environment: SiteEnvironment): string {
  return environment === "production" ? `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n";
}

export async function buildStaticSite(options: StaticSiteOptions): Promise<StaticSite> {
  const readEnvironment: ReadEnvironment = options.environment;
  // One full projection from the snapshot; joins already ran against local SQLite.
  const build = await buildGeneration(options.db, readEnvironment);
  if (!build) throw new Error("No registry projection was produced.");
  const serialized = new Map(build.objects);
  const store = { get: async (key: string) => serialized.get(key.replace(/^objects\//u, "")) ?? null, put: async () => {} };
  // The publication checks gate the build: broken references or counts fail it.
  await verifyGeneration(store, build.manifest);
  const parsed = new Map<string, ReadObject>();
  const object = (hash: string) => {
    if (!parsed.has(hash)) parsed.set(hash, JSON.parse(serialized.get(hash)!) as ReadObject);
    return parsed.get(hash)!;
  };
  const repository = new MaterializedRepository(build.manifest, async <K extends keyof ReadData>(key: string) => object(build.manifest.objects[key]).data as ReadData[K]);
  const generation = build.manifest.generation;
  const env = {
    ...(options.environment === "production" ? options.analytics : {}),
    DB: options.db, REGISTRY_REVISION: generation, READ_ENVIRONMENT: readEnvironment,
    ASSETS: { fetch: async () => new Response(options.template, { headers: { "Content-Type": "text/html; charset=utf-8" } }) },
  } as unknown as Env;
  const files: StaticFile[] = [];
  const render = async (path: string, withData = true, expected = 200) => {
    const response = await handleRequest(new Request(CANONICAL_ORIGIN + path), env, withData ? repository : undefined);
    if (response.status !== expected) throw new Error(`${path} rendered ${response.status}, expected ${expected}.`);
    return response.text();
  };

  const snapshot = await repository.seoSnapshot();
  const standalone = new Set([...LEGAL_PATHS, ...CONTENT_PATHS]);
  const inventory = (await repository.sitemapPaths()).filter((path) => !path.includes("?"));
  const pages = [...new Set(["/", "/compare", ...Object.keys(snapshot.pages), ...inventory])].filter((path) => !standalone.has(path)).sort();
  for (const path of pages) files.push({ path: pageFile(path), body: await render(path) });
  // Legal and content pages never read registry data in the Worker either.
  for (const path of [...standalone].sort()) files.push({ path: pageFile(path), body: await render(path, false) });
  files.push({ path: "404.html", body: await render("/__registry_static_not_found__", true, 404) });
  files.push({ path: "sitemap.xml", body: await render("/sitemap.xml") });
  files.push({ path: "feed.xml", body: await render("/feed.xml") });
  files.push({ path: "robots.txt", body: robotsFile(options.environment) });

  const versions: Array<{ family: string; version: string }> = [];
  const badges = new Set<string>();
  const published: ResultRow[] = [];
  for (const [key, hash] of Object.entries(build.manifest.objects)) {
    if (!key.startsWith("version:")) continue;
    const [, family, version] = key.split(":");
    versions.push({ family, version });
    const data = (object(hash).data as ReadData["version"]).response.data;
    if (data.result_page.total_pages > 1) throw new Error(`${key} is paginated; the results download would be incomplete.`);
    published.push(...data.results);
    for (const row of data.results) badges.add(`/badge/${row.model.registry_no}/${row.benchmark.slug}.svg`);
  }
  const stats = (object(build.manifest.objects.stats).data as ReadData["stats"]).data;
  if (published.length !== stats.benchmark_results) throw new Error(`The results download has ${published.length} rows; the registry publishes ${stats.benchmark_results}.`);
  files.push({ path: RESULTS_CSV_PATH, body: resultsCsv(published) });
  files.push({ path: LLMS_TXT_PATH, body: llmsText({ models: stats.models, benchmarks: stats.benchmarks, versions: stats.versions, results: stats.benchmark_results }) });

  // Model pages, benchmark families and comparison pairs share their own card; every other page shares the site card.
  const cards: ShareCard[] = [siteShareCard({ models: stats.models, benchmarks: stats.benchmarks, results: stats.benchmark_results })];
  for (const path of pages) {
    const registryNo = /^\/models\/([0-9]+)$/u.exec(path)?.[1];
    if (!registryNo) continue;
    const data = (object(build.manifest.objects[`model:${registryNo}`]).data as ReadData["model"]).response.data;
    if (data.result_page.total_pages > 1) throw new Error(`model:${registryNo} is paginated; its share card would miss results.`);
    cards.push(modelShareCard({ registry_no: registryNo, name: data.model.name, company: data.model.company.name, results: data.results }));
  }
  // Benchmark families and comparison pairs get their own cards too; version pages share the site card.
  for (const [path, page] of Object.entries(snapshot.pages)) {
    const slug = /^\/benchmarks\/([a-z0-9-]+)$/u.exec(path)?.[1];
    if (slug) cards.push(benchmarkShareCard({ slug, name: page.name, models: page.models, versions: page.versions, latest: page.latest, results: page.topResults ?? [] }));
  }
  for (const pair of snapshot.comparisons) {
    const sides = await Promise.all(pair.models.map(async (no) => {
      const { data } = await repository.model(no, { page: 1, limit: 500, view: "latest" });
      if (data.result_page.total_pages > 1) throw new Error(`model:${no} is paginated; its comparison card would miss results.`);
      return data;
    }));
    cards.push(comparisonShareCard({
      slug: pair.path.slice("/compare/".length),
      models: [{ name: sides[0].model.name, company: sides[0].model.company.name }, { name: sides[1].model.name, company: sides[1].model.company.name }],
      sharedBenchmarks: pair.sharedBenchmarks,
      rows: comparisonCardRows(sides[0].results, sides[1].results),
    }));
  }
  let badgeCount = 0;
  for (const path of [...badges].sort()) {
    const response = await handleRequest(new Request(CANONICAL_ORIGIN + path), env, repository);
    // Redirected (retired) model numbers have no badge, as before.
    if (response.status === 404) continue;
    if (response.status !== 200) throw new Error(`${path} rendered ${response.status}.`);
    files.push({ path: pageFile(path), body: await response.text() });
    badgeCount++;
  }

  // Model lists show each model's featured result; precompute them so a list
  // read in the browser is one file, not one file per model.
  const featured: ReadData["featured"] = {};
  for (const [key, hash] of Object.entries(build.manifest.objects)) {
    if (key.startsWith("model:")) featured[key.slice(6)] = latestReportedResult((object(hash).data as ReadData["model"]).response.data.results);
  }
  const featuredObject = JSON.stringify({ schema: 1, key: "featured", environment: readEnvironment, data: featured } satisfies ReadObject);
  const featuredHash = await digest(featuredObject);
  serialized.set(featuredHash, featuredObject);
  const comparisonsObject = JSON.stringify({ schema: 1, key: "comparisons", environment: readEnvironment, data: snapshot.comparisons } satisfies ReadObject);
  const comparisonsHash = await digest(comparisonsObject);
  serialized.set(comparisonsHash, comparisonsObject);
  const manifest: StaticDataManifest = { generation, objects: { ...build.manifest.objects, featured: featuredHash, comparisons: comparisonsHash } };
  for (const hash of new Set(Object.values(manifest.objects))) files.push({ path: `data/objects/${hash}.json`, body: serialized.get(hash)! });
  files.push({ path: "data/manifest.json", body: JSON.stringify(manifest) });
  // /compare reads its state from the URL in the browser. Start its data requests with the
  // HTML instead of after the script: the manifest and the model list it always needs.
  const comparePage = files.find((file) => file.path === pageFile("/compare"));
  if (comparePage) comparePage.body = comparePage.body.replace("</head>", [STATIC_MANIFEST_PATH, ...["models", "featured", "redirects", "comparisons"].map((key) => staticObjectPath(manifest.objects[key]))]
    .map((href) => `<link rel="preload" href="${href}" as="fetch" crossorigin="anonymous">`).join("") + "</head>");

  const redirects = redirectRules({ redirects: object(build.manifest.objects.redirects).data as ReadData["redirects"], seo: snapshot }, versions, options.legacyRootSlugs);
  for (const rule of redirects.lines) {
    const source = rule.split(" ")[0];
    if (files.some((file) => file.path === pageFile(source))) throw new Error(`Redirect source shadows a page: ${source}`);
  }
  files.push({ path: "_redirects", body: redirects.lines.join("\n") + "\n" });
  const security: SecurityPolicy = {
    scriptHashes: await inlineScriptHashes(files.filter((file) => file.path.endsWith(".html")).map((file) => file.body)),
    ...(options.environment === "production" && analyticsConfiguration(options.analytics ?? {}) ? { analyticsScript: analyticsConfiguration(options.analytics!)!.url } : {}),
  };
  return {
    files, cards, generation, security,
    report: { pages: pages.length + standalone.size, badges: badgeCount, dataFiles: new Set(Object.values(manifest.objects)).size + 1, redirects: redirects.lines.length - redirects.dynamic, dynamicRedirects: redirects.dynamic },
  };
}

