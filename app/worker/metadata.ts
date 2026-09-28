import { benchmarkDisplayName, benchmarkVersionLabel } from "../src/benchmark-names";
import { resolveRegistryRoute } from "../src/registry";
import type { BenchmarkRef } from "./api";
import { RegistryRepository } from "./repository";

export interface DocumentMetadata {
  title: string;
  description: string;
  status?: number;
  canonical?: string;
  noindex?: boolean;
  facts?: string[];
  links?: Array<{ href: string; label: string }>;

}

export const PRODUCTION_ORIGIN = "https://benchmarkregistry.org";

const SITE_NAME = "Benchmark Registry";
const missing: DocumentMetadata = {
  status: 404,
  title: `Page Not Found | ${SITE_NAME}`,
  description: "The requested Benchmark Registry page could not be found.",
};

async function pageMetadata(url: URL, repository: RegistryRepository): Promise<DocumentMetadata> {
  const route = resolveRegistryRoute(url.pathname);
  switch (route.kind) {
    case "home":
      return { title: SITE_NAME, description: "AI model benchmark results in one place | Benchmark Registry" };
    case "models":
      return { title: `Models | ${SITE_NAME}`, description: "AI models and their benchmark results" };
    case "benchmarks":
      return { title: `Benchmarks | ${SITE_NAME}`, description: "AI benchmarks and model evaluation results" };
    case "companies":
      return { title: `Companies | ${SITE_NAME}`, description: "AI companies, models, and benchmark results" };
    case "model": {
      const model = await repository.metadataModel(route.registryNo);
      return model ? {
        title: `${model.name} | Benchmarks`,
        description: `${model.company_name}'s ${model.name} model evaluation and benchmark results | ${SITE_NAME}`,
        links: [{ href: `/companies/${model.company_slug}`, label: model.company_name },
          { href: `/models/${model.registry_no}`, label: `Registry No. ${model.registry_no}` }],
      } : missing;
    }
    case "company": {
      const company = await repository.metadataCompany(route.slug);
      return company ? {
        title: `${company.name} | Benchmarks`,
        description: `${company.name} model evaluation and benchmark results | ${SITE_NAME}`,
      } : missing;
    }
    case "benchmark":
    case "benchmark-version": {
      const benchmark = await repository.metadataBenchmark(route.slug, route.kind === "benchmark-version" ? route.version : undefined);
      if (!benchmark) return missing;
      if (benchmark.version !== null) {
        const label = benchmarkVersionLabel(benchmark, benchmark.version);
        const keys = url.searchParams.getAll("result");
        if (keys.length === 1 && /^[a-f0-9]{64}$/u.test(keys[0])) {
          const model = await repository.metadataResult(route.slug, route.kind === "benchmark-version" ? route.version : "", keys[0]);
          if (model) return {
            title: `${model.name} | ${label}`,
            description: `${model.company_name}'s ${model.name} evaluation results on ${label}`,
            facts: [`Score: ${model.score_raw}`, ...(model.reasoning_level ? [`Reasoning level: ${model.reasoning_level}`] : [])],
            links: [{ href: model.primary_source_url, label: 'Source' }, { href: `/models/${model.registry_no}`, label: `${model.name} (Registry No. ${model.registry_no})` },
              { href: `/companies/${model.company_slug}`, label: model.company_name },
              { href: `/benchmarks/${benchmark.slug}`, label: benchmarkDisplayName(benchmark) },
              { href: url.pathname.replace(/\/$/u, ''), label }],
          };
        }
        return {
          title: `${label} | Results`,
          description: benchmark.evaluator_names.length === 1
            ? `${benchmark.evaluator_names[0]}'s ${label} model results`
            : `Model results on ${label}`,
        };
      }
      return benchmarkFamilyMetadata(benchmark);
    }
    case "not-found":
      return missing;
  }
}

export async function documentMetadata(url: URL, repository: RegistryRepository): Promise<DocumentMetadata> {
  const metadata = await pageMetadata(url, repository);
  const route = resolveRegistryRoute(url.pathname);
  const segment = encodeURIComponent;
  const path = route.kind === 'model' ? `/models/${segment(route.registryNo)}`
    : route.kind === 'company' ? `/companies/${segment(route.slug)}`
    : route.kind === 'benchmark' ? `/benchmarks/${segment(route.slug)}`
    : route.kind === 'benchmark-version' ? `/benchmarks/${segment(route.slug)}/${segment(route.version)}`
    : url.pathname === '/' ? '/' : url.pathname.replace(/\/$/u, '');
  metadata.noindex = (metadata.status ?? 200) !== 200 || url.searchParams.size > 0;
  if (metadata.status === 404) return metadata;
  metadata.canonical = PRODUCTION_ORIGIN + path;
  const keys = url.searchParams.getAll('result');
  if (route.kind === 'benchmark-version' && keys.length === 1 && /^[a-f0-9]{64}$/u.test(keys[0])) {
    const result = await repository.metadataResult(route.slug, route.version, keys[0]);
    if (result?.exact_result_indexable === 1) {
      const exact = `${PRODUCTION_ORIGIN}${path}?view=history&result=${keys[0]}`;
      // Only the stable history/result state is indexable. Extra UI state still needs noindex.
      metadata.canonical = exact;
      metadata.noindex = url.searchParams.size !== 2
        || url.searchParams.getAll('view').length !== 1 || url.searchParams.get('view') !== 'history';
    }
  }
  return metadata;
}

function benchmarkFamilyMetadata(benchmark: BenchmarkRef): DocumentMetadata {
  const name = benchmarkDisplayName(benchmark);
  const expanded = name === benchmark.name ? name : `${name} (${benchmark.name})`;
  return {
    title: `${name} | Benchmarks`,
    description: `Model results across versions of ${expanded}`,
  };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function metadataHead(metadata: DocumentMetadata, url: URL): string {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  // Sharing metadata follows the same deterministic production canonical.
  const pageUrl = metadata.canonical
    ? `<meta property="og:url" content="${escapeHtml(metadata.canonical)}">` : "";
  const canonical = metadata.canonical ? `<link rel="canonical" href="${escapeHtml(metadata.canonical)}">` : "";
  const robots = metadata.noindex || url.hostname !== 'benchmarkregistry.org'
    ? '<meta name="robots" content="noindex, follow">' : '';
  return `<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
${pageUrl}
${canonical}
${robots}`;
}

export function rewriteMetadata(html: string, metadata: DocumentMetadata, url: URL, content?: string): string {
  // This is the app-owned Vite document template, not arbitrary external HTML.
  const rewritten = html.replace(/<head\b[^>]*>([\s\S]*?)<\/head>/iu, (head, contents: string) => {
    const cleaned = contents
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/giu, "")
      .replace(/<meta\b(?=[^>]*\b(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+)["'])[^>]*>/giu, "");
    const withoutCanonical = cleaned.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/giu, "");
    return head.slice(0, head.indexOf(">") + 1) + withoutCanonical + metadataHead(metadata, url) + "\n</head>";
  });
  const links = metadata.links ?? (metadata.canonical ? [{ href: new URL(metadata.canonical).pathname, label: metadata.title }] : []);
  const summary = `<main class="page-container registry-page"><h1>${escapeHtml(metadata.title)}</h1><p>${escapeHtml(metadata.description)}</p>${(metadata.facts ?? []).map((fact) => `<p>${escapeHtml(fact)}</p>`).join('')}${links.map((link) => `<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>`).join('')}</main>`;
  return rewritten.replace(/<div id="root"><\/div>/u, `<div id="root">${content ?? summary}</div>`);
}
