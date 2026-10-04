// Build-time static site producer. Renders every public page with the same
// document, metadata and API code the Worker used, so output stays identical,
// and emits the files Workers static assets serve without invoking a Worker.
import { CONTENT_PATHS } from "../src/content-metadata";
import { LEGAL_PATHS } from "../src/legal-content";
import { CANONICAL_ORIGIN } from "../src/seo-config";
import type { StaticDataManifest } from "../src/static-api";
import type { AnalyticsEnvironment } from "./analytics";
import { handleRequest, type Env } from "./index";
import { buildGeneration } from "./materializer";
import { MaterializedRepository } from "./materialized-repository";
import { verifyGeneration } from "./publication";
import { highestRecordedResult } from "./featured-result";
import { digest, type ReadData, type ReadEnvironment, type ReadObject } from "./read-model";

export type SiteEnvironment = "staging" | "production";
export interface StaticFile { path: string; body: string }
export interface StaticSiteOptions {
  db: D1Database;
  environment: SiteEnvironment;
  /** The Vite-built index.html every page is rendered into. */
  template: string;
  analytics?: AnalyticsEnvironment;
}
export interface StaticSite {
  files: StaticFile[];
  generation: string;
  report: { pages: number; badges: number; dataFiles: number; redirects: number; dynamicRedirects: number };
}

/** Workers static assets limits (free plan) the build must stay inside. */
export const MAX_ASSET_FILES = 20_000;
export const FILE_COUNT_BUDGET = 15_000;
export const MAX_STATIC_REDIRECTS = 2_000;
export const MAX_DYNAMIC_REDIRECTS = 100;
export const MAX_HEADER_RULES = 100;
export const HTML_CACHE_CONTROL = "public, max-age=300, must-revalidate";
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const STAGING_ROBOTS_TAG = "noindex, nofollow, noarchive";
const STAGING_CSP = "script-src-elem 'self' 'unsafe-inline'";
const ROOT_HUBS = new Set(["models", "benchmarks", "companies", "compare", "legal", "privacy", "terms", "recent"]);

/** `/models/10006` → `models/10006.html`; `/` → `index.html`; files keep their name. */
export function pageFile(path: string): string {
  if (path === "/") return "index.html";
  const decoded = decodeURIComponent(path).replace(/^\//u, "").replace(/\/$/u, "");
  if (!decoded || decoded.split("/").some((part) => !part || part === "." || part === "..")) throw new Error(`Unsafe page path: ${path}`);
  return /\.(xml|txt|svg)$/u.test(decoded) ? decoded : `${decoded}.html`;
}

const nameSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/gu, "");
const hyphenSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");

/** Redirects the Worker resolved per request, as `_redirects` rules. */
export function redirectRules(data: Pick<ReadData, "redirects" | "seo">, versions: Array<{ family: string; version: string }>): { lines: string[]; dynamic: number } {
  const lines: string[] = [];
  const seen = new Set<string>();
  const add = (source: string, target: string, status: 301 | 308) => {
    if (seen.has(source) || source === target) return;
    seen.add(source);lines.push(`${source} ${target} ${status}`);
  };
  for (const redirect of data.redirects) add(`/models/${redirect.source}`, `/models/${redirect.target}`, 308);
  for (const { family, version } of versions) add(`/benchmarks/${family}/versions/${version}`, `/benchmarks/${family}/${version}`, 301);
  for (const model of data.seo.models) {
    if (data.redirects.some((redirect) => redirect.source === model.registry_no)) continue;
    for (const slug of new Set([nameSlug(model.name), hyphenSlug(model.name)])) {
      if (!slug || /^[0-9]+$/u.test(slug)) continue;
      add(`/models/${slug}`, `/models/${model.registry_no}`, 301);
      if (!ROOT_HUBS.has(slug) && !LEGAL_PATHS.includes(`/${slug}`) && !CONTENT_PATHS.includes(`/${slug}`)) add(`/${slug}`, `/models/${model.registry_no}`, 301);
    }
  }
  add("/incai-ringflash20", "/models", 301);
  const dynamic = [
    // Retired version URLs whose version no longer exists return to the family hub.
    "/benchmarks/:family/versions/* /benchmarks/:family 301",
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
export function headerRules(files: string[], environment: SiteEnvironment): string {
  const blocks: string[] = [];
  const rule = (pattern: string, headers: Record<string, string>) => blocks.push([pattern, ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`)].join("\n"));
  rule("/assets/*", { "Cache-Control": IMMUTABLE_CACHE_CONTROL });
  rule("/data/objects/*", { "Cache-Control": IMMUTABLE_CACHE_CONTROL, "X-Robots-Tag": "noindex" });
  rule("/data/manifest.json", { "Cache-Control": HTML_CACHE_CONTROL, "X-Robots-Tag": "noindex" });
  const top = new Map<string, "file" | "directory">();
  for (const file of files) {
    const [first, ...rest] = file.split("/");
    if (["assets", "data", "_headers", "_redirects", "404.html"].includes(first)) continue;
    if (rest.length) top.set(first, "directory");
    else if (!top.has(first)) top.set(first, "file");
  }
  for (const [name, kind] of [...top].sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const headers: Record<string, string> = { "Cache-Control": HTML_CACHE_CONTROL };
    if (name === "feed.xml" || name === "badge") headers["X-Robots-Tag"] = "noindex";
    if (name === "feed.xml") headers["Content-Type"] = "application/atom+xml; charset=utf-8";
    if (kind === "directory") {
      rule(`/${name}/*`, headers);
      continue;
    }
    if (name === "index.html") rule("/", headers);
    else if (name.endsWith(".html")) rule(`/${name.slice(0, -5)}`, headers);
    else rule(`/${name}`, headers);
  }
  if (environment === "staging") rule("/*", { "X-Robots-Tag": STAGING_ROBOTS_TAG, "Content-Security-Policy": STAGING_CSP });
  if (blocks.length > MAX_HEADER_RULES) throw new Error(`${blocks.length} header rules exceed the ${MAX_HEADER_RULES} limit.`);
  return blocks.join("\n\n") + "\n";
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
  for (const [key, hash] of Object.entries(build.manifest.objects)) {
    if (!key.startsWith("version:")) continue;
    const [, family, version] = key.split(":");
    versions.push({ family, version });
    for (const row of (object(hash).data as ReadData["version"]).response.data.results) badges.add(`/badge/${row.model.registry_no}/${row.benchmark.slug}.svg`);
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
    if (key.startsWith("model:")) featured[key.slice(6)] = highestRecordedResult((object(hash).data as ReadData["model"]).response.data.results);
  }
  const featuredObject = JSON.stringify({ schema: 1, key: "featured", environment: readEnvironment, data: featured } satisfies ReadObject);
  const featuredHash = await digest(featuredObject);
  serialized.set(featuredHash, featuredObject);
  const manifest: StaticDataManifest = { generation, objects: { ...build.manifest.objects, featured: featuredHash } };
  for (const hash of new Set(Object.values(manifest.objects))) files.push({ path: `data/objects/${hash}.json`, body: serialized.get(hash)! });
  files.push({ path: "data/manifest.json", body: JSON.stringify(manifest) });

  const redirects = redirectRules({ redirects: object(build.manifest.objects.redirects).data as ReadData["redirects"], seo: snapshot }, versions);
  for (const rule of redirects.lines) {
    const source = rule.split(" ")[0];
    if (files.some((file) => file.path === pageFile(source))) throw new Error(`Redirect source shadows a page: ${source}`);
  }
  files.push({ path: "_redirects", body: redirects.lines.join("\n") + "\n" });
  return {
    files, generation,
    report: { pages: pages.length + standalone.size, badges: badgeCount, dataFiles: new Set(Object.values(manifest.objects)).size + 1, redirects: redirects.lines.length - redirects.dynamic, dynamicRedirects: redirects.dynamic },
  };
}

