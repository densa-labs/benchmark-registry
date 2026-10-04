import { CONTENT_METADATA } from "../src/content-metadata";
import { structuredDataScript } from "./structured-data";
import { LEGAL_METADATA } from "../src/legal-content";
import { resolveRegistryRoute } from "../src/registry";
import type { RegistryReader } from "./materialized-repository";
import { IS_STAGING } from "../src/build";
import { parseComparisonState } from "../src/compare";

export interface DocumentMetadata {
  page?: SeoPage;
  title: string;
  description: string;
  status?: number;
  canonical?: string;
  noindex?: boolean;
  facts?: string[];
  links?: Array<{ href: string; label: string }>;

}

import { CANONICAL_ORIGIN, CANONICAL_HOST } from "../src/seo-config";

import { buildPageMetadata, isIndexablePage, SITE_NAME, seoTitle, seoDescription, entityTitle } from "../src/seo";
import type { SeoPage } from "./seo-data";
const missing: DocumentMetadata = {
  status: 404,
  title: `Page Not Found | ${SITE_NAME}`,
  description: "The requested Benchmark Registry page could not be found.",
};

async function pageMetadata(url: URL, repository?: RegistryReader): Promise<DocumentMetadata> {
  const route = resolveRegistryRoute(url.pathname);
  if (route.kind === "corrections" || route.kind === "coverage") return {title:seoTitle(CONTENT_METADATA[route.kind].title),description:seoDescription([CONTENT_METADATA[route.kind].description])};
  if (route.kind === "legal" || route.kind === "privacy" || route.kind === "terms") return {
    title: seoTitle(LEGAL_METADATA[route.kind].title), description: seoDescription([LEGAL_METADATA[route.kind].description]),
  };
  if (route.kind === "not-found") return missing;
  if (route.kind === "compare") {
    let models: string[] = [];
    try { models = parseComparisonState(url.search).models; } catch { /* UI handles malformed selection. */ }
    const selected = await Promise.all(models.map(number => number ? requireRepository(repository).metadataModel(number) : null));
    return {title:selected.length===2 && selected.every(Boolean) ? entityTitle(`${selected[0]!.name} vs ${selected[1]!.name}:`,"Benchmark Comparison") : seoTitle("Compare AI Model Benchmark Results"),
      description:seoDescription([selected.every(Boolean) && selected.length===2 ? `${selected[0]!.name} vs ${selected[1]!.name}: compare reported benchmark scores and primary sources.` : "Compare AI model information, reasoning levels, and reported benchmark results from primary sources."])};
  }
  const snapshot = await requireRepository(repository).seoSnapshot();
  const path = decodeURI(url.pathname).replace(/\/$/u, "") || "/";
  const page = snapshot.pages[path];
  return page ? {...buildPageMetadata(page), page} : missing;
}

export async function documentMetadata(url: URL, repository?: RegistryReader): Promise<DocumentMetadata> {
  const metadata = await pageMetadata(url, repository);
  const route = resolveRegistryRoute(url.pathname);
  const segment = encodeURIComponent;
  const path = route.kind === 'model' ? `/models/${segment(route.registryNo)}`
    : route.kind === 'company' ? `/companies/${segment(route.slug)}`
    : route.kind === 'benchmark' ? `/benchmarks/${segment(route.slug)}`
    : route.kind === 'benchmark-version' ? `/benchmarks/${segment(route.slug)}/${segment(route.version)}`
    : url.pathname === '/' ? '/' : url.pathname.replace(/\/$/u, '');
  metadata.noindex = (metadata.status ?? 200) !== 200 || url.searchParams.size > 0 || Boolean(metadata.page && !isIndexablePage(metadata.page));
  metadata.canonical = CANONICAL_ORIGIN + path;
  return metadata;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function metadataHead(metadata: DocumentMetadata, url: URL): string {
  const title = escapeHtml(metadata.title);
  const documentTitle = IS_STAGING ? "STAGING | Benchmark Registry" : title;
  const description = escapeHtml(metadata.description);
  // Sharing metadata follows the same deterministic production canonical.
  const pageUrl = metadata.canonical
    ? `<meta property="og:url" content="${escapeHtml(metadata.canonical)}">` : "";
  const canonical = metadata.canonical ? `<link rel="canonical" href="${escapeHtml(metadata.canonical)}">` : "";
  const robots = metadata.noindex || url.hostname !== CANONICAL_HOST
    ? '<meta name="robots" content="noindex, follow">' : '';
  return `<title>${documentTitle}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta property="og:image" content="${CANONICAL_ORIGIN}/assets/Benchmark-Registry-B-Logo-Dark.png">
<meta name="twitter:image" content="${CANONICAL_ORIGIN}/assets/Benchmark-Registry-B-Logo-Dark.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
${pageUrl}
${canonical}
${robots}
${structuredDataScript(metadata)}`;
}

export function rewriteMetadata(html: string, metadata: DocumentMetadata, url: URL, content?: string): string {
  // This is the app-owned Vite document template, not arbitrary external HTML.
  const rewritten = html.replace(/<head\b[^>]*>([\s\S]*?)<\/head>/iu, (head, contents: string) => {
    const cleaned = contents
      .replace(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/giu, "")
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/giu, "")
      .replace(/<meta\b(?=[^>]*\b(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/giu, "");
    const withoutCanonical = cleaned.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/giu, "");
    return head.slice(0, head.indexOf(">") + 1) + withoutCanonical + metadataHead(metadata, url) + "\n</head>";
  });
  const links = metadata.links ?? (metadata.canonical ? [{ href: new URL(metadata.canonical).pathname, label: metadata.title }] : []);
  const summary = `<main class="page-container registry-page"><h1>${escapeHtml(metadata.title)}</h1><p>${escapeHtml(metadata.description)}</p>${(metadata.facts ?? []).map((fact) => `<p>${escapeHtml(fact)}</p>`).join('')}${links.map((link) => `<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>`).join('')}</main>`;
  return rewritten.replace(/<html\b[^>]*>/iu, '<html lang="en">').replace(/<div id="root"><\/div>/u, `<div id="root">${content ?? summary}</div>`);
}

function requireRepository(repository?: RegistryReader): RegistryReader {
  if (!repository) throw new Error("Registry reader required for data route.");
  return repository;
}
