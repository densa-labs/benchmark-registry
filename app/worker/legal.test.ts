import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import template from "../index.html?raw";
import worker, { handleRequest, type Env } from "./index";
import type { RegistryReader } from "./materialized-repository";
import { loadRegistryRoute, resolveRegistryRoute } from "../src/registry";

const pages = [
  ["legal", "Legal", "Privacy, terms, and support information for Benchmark Registry."],
  ["privacy", "Privacy Policy", "How Benchmark Registry processes visitor information."],
  ["terms", "Terms", "Terms for using Benchmark Registry."],
] as const;

function fixture() {
  const reads = vi.fn(() => { throw new Error("LEGAL MUST NOT READ KV OR D1"); });
  const env = { READ_STORE: { get: reads }, READ_ENVIRONMENT: "local",
    DB: { prepare: reads }, ASSETS: { fetch: async () => new Response(template, { headers: { "Content-Type": "text/html" } }) },
  } as unknown as Env;
  return { env, reads };
}

it.each(pages)("serves %s as meaningful static initial HTML with production metadata and no data reads", async (kind, title, description) => {
  const { env, reads } = fixture();
  const response = await worker.fetch(new Request(`https://benchmarkregistry.org/${kind}`), env);
  expect(response.status).toBe(200);
  expect(response.headers.get("X-Registry-D1-Queries")).toBe("0");
  expect(response.headers.get("X-Registry-Read-Store-Reads")).toBe("0");
  const html = await response.text();
  expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${title}</h1>`, "u"));
  expect(html).toContain(`<title>${title} | Benchmark Registry</title>`);
  expect(html).toContain(`<meta name="description" content="${description}">`);
  expect(html).toContain(`<meta property="og:title" content="${title} | Benchmark Registry">`);
  expect(html).toContain(`rel="canonical" href="https://benchmarkregistry.org/${kind}"`);
  expect(html).not.toContain('name="robots"');
  expect(html).toContain('href="/legal">Legal</a>');
  expect(html).toContain("support@benchmarkregistry.org");
  expect(html).toContain(`"loaded":{"kind":"${kind}"}`);
  expect(reads).not.toHaveBeenCalled();
  const fetcher = vi.fn();
  expect(await loadRegistryRoute(resolveRegistryRoute(`/${kind}`), "", fetcher)).toEqual({ kind });
  expect(fetcher).not.toHaveBeenCalled();
});

it.each(pages)("preserves staging noindex, canonical and query-state treatment on %s", async (kind) => {
  const { env } = fixture();
  env.STAGING_CRAWLER_PROTECTION = "enabled";
  const response = await worker.fetch(new Request(`https://staging.benchmarkregistry.org/${kind}`), env);
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
  expect(await response.text()).toContain('name="robots" content="noindex, follow"');
  const queried = await worker.fetch(new Request(`https://benchmarkregistry.org/${kind}?q=private`), env);
  const html = await queried.text();
  expect(html).toContain(`rel="canonical" href="https://benchmarkregistry.org/${kind}"`);
  expect(html).toContain('name="robots" content="noindex, follow"');
});

it("links the minimal Legal hub to Privacy, Terms and an accessible SVG Support handoff", async () => {
  const { env } = fixture();
  const html = await (await worker.fetch(new Request("https://benchmarkregistry.org/legal"), env)).text();
  expect(html).toContain('href="/privacy">Privacy Policy</a>');
  expect(html).toContain('href="/terms">Terms</a>');
  expect(html).toMatch(/href="mailto:support@benchmarkregistry.org"[^>]*>Support<svg[^>]*aria-hidden="true"/u);
  expect(html).not.toContain("↗");
});

it("distinguishes disabled application persistence from Cloudflare security and earlier analytics retention", async () => {
  const { env } = fixture();
  const html = await (await worker.fetch(new Request("https://benchmarkregistry.org/privacy"), env)).text();
  expect(html).toContain("Persisted per-request Worker logs, automatic invocation records and traces are disabled.");
  expect(html).toContain("security analytics can retain sampled request records, including IP addresses");
  expect(html).toContain("Security Events are available for 24 hours and Security Analytics for seven days.");
  expect(html).toContain("unsampled for seven days, then available in sampled aggregates for up to six months");
  expect(html).toContain("three-day Workers Free retention period");
  expect(html).not.toMatch(/GDPR compliant|CCPA compliant|tracking-free|GPS coordinates/u);
});

it.each(["/legal/arbitrary", "/privacy/arbitrary", "/terms/arbitrary"])("returns an independent static 404 for %s", async (path) => {
  const { env, reads } = fixture();
  expect((await worker.fetch(new Request(`https://benchmarkregistry.org${path}`), env)).status).toBe(404);
  expect(reads).not.toHaveBeenCalled();
});

it("canonicalizes trailing slash and supports HEAD with no body or Registry reads", async () => {
  const { env, reads } = fixture();
  const redirect = await worker.fetch(new Request("https://benchmarkregistry.org/legal/"), env);
  expect(redirect.status).toBe(308);
  expect(redirect.headers.get("Location")).toBe("https://benchmarkregistry.org/legal");
  const head = await worker.fetch(new Request("https://benchmarkregistry.org/privacy", { method: "HEAD" }), env);
  expect(head.status).toBe(200);
  expect(await head.text()).toBe("");
  expect(reads).not.toHaveBeenCalled();
});

it("adds static legal sitemap paths exactly once to an existing materialized inventory", async () => {
  const { env } = fixture();
  const repository = { sitemapPaths: async () => ["/", "/models", "/legal"] } as unknown as RegistryReader;
  const response = await handleRequest(new Request("https://benchmarkregistry.org/sitemap.xml"), env, repository);
  const xml = await response.text();
  expect([...xml.matchAll(/<loc>/gu)]).toHaveLength(5);
  for (const [kind] of pages) expect([...xml.matchAll(new RegExp(`https://benchmarkregistry.org/${kind}<`, "g"))]).toHaveLength(1);
  expect(xml).not.toMatch(/mailto:|staging\./u);
});

it("keeps privacy controls identical and explicit in both isolated deployments", () => {
  const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  for (const environment of ["staging", "production"]) {
    expect(config.env[environment].observability).toEqual({ enabled: true, redact_query_string: true,
      logs: { enabled: true, invocation_logs: false, persist: false, head_sampling_rate: 1, destinations: [] },
      traces: { enabled: false, persist: false, destinations: [] } });
    expect(config.env[environment].d1_databases).toBeUndefined();
  }
  expect(config.env.staging.kv_namespaces[0].id).not.toBe(config.env.production.kv_namespaces[0].id);
  const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  expect(source).not.toMatch(/console\.|__p1111_probe|request\.cf/u);
});
