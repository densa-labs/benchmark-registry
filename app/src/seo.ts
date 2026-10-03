import { MIN_INDEXABLE_RECORDS } from "./seo-config";
import type { SeoPage } from "../worker/seo-data";
export const SITE_NAME = "Benchmark Registry";
export const TITLE_LIMIT = 70;
export const DESCRIPTION_LIMIT = 160;
const forbidden = /\b(?:Unspecified|Unknown|undefined|null|default)\b/giu;
export const isPlaceholder = (value: string | undefined) => !value?.trim() || /\b(?:Unspecified|Unknown|undefined|null|default)\b/iu.test(value);
export function cleanSeoText(value: string): string {
  return value.replace(forbidden, "").replace(/\s+/gu, " ").trim();
}
function clip(value: string, limit: number) {
  if (value.length <= limit) return value;
  const text = value.slice(0, limit - 1);
  const space = text.lastIndexOf(" ");
  return `${text.slice(0, space > limit * 0.65 ? space : text.length).trimEnd()}…`;
}
export function seoTitle(primary: string, suffix = ` | ${SITE_NAME}`): string {
  const text = cleanSeoText(primary);
  if (text.length + suffix.length <= TITLE_LIMIT) return text + suffix;
  return clip(text, TITLE_LIMIT - suffix.length) + suffix;
}
export function seoDescription(clauses: Array<string | undefined>): string {
  const valid = clauses.filter((clause): clause is string => Boolean(clause)).map(cleanSeoText).filter(Boolean);
  let text = valid.shift() ?? "AI model benchmark results from primary sources.";
  for (const clause of valid) if (text.length + 1 + clause.length <= DESCRIPTION_LIMIT) text += ` ${clause}`;
  return clip(text, DESCRIPTION_LIMIT);
}
const date = (value?: string) => value?.slice(0, 10);
export function buildPageMetadata(page: SeoPage): {title:string;description:string} {
  const name = cleanSeoText(page.name) || "Benchmark";
  const released = date(page.released);
  const updated = date(page.updated);
  switch (page.kind) {
    case "home": return {title:"Benchmark Registry: AI Model Benchmark Results in One Place",description:seoDescription([
      `AI model benchmark results from primary sources: ${page.models} models, ${page.benchmarks} benchmarks, ${page.records} records.`,updated && `Updated ${updated}.`])};
    case "models": return {title:seoTitle("AI Models and Benchmark Results"),description:seoDescription([`${page.models} AI models from ${page.organizations} developers with reported benchmark scores, sourced from official publications.`])};
    case "benchmarks": return {title:seoTitle("AI Benchmarks: Results and Leaderboards"),description:seoDescription([`${page.benchmarks} AI benchmarks with ${page.records} reported results across ${page.models} models, from primary sources.`])};
    case "companies": return {title:seoTitle("AI Model Developers and Benchmark Results"),description:seoDescription([`${page.organizations} AI model developers with ${page.models} models and ${page.records} reported benchmark results, sourced from official publications.`])};
    case "model": {
      const primary = `${name} Benchmark Results & Scores`;
      return {title:primary.length + SITE_NAME.length + 3 <= TITLE_LIMIT ? seoTitle(primary) : seoTitle(`${name} Benchmark Results`),description:seoDescription([
        `${name} benchmark results from primary sources: ${page.records} records across ${page.benchmarks} benchmarks.`,
        !isPlaceholder(page.provider) ? `Developer: ${page.provider}.` : undefined,
        released && `Released ${released}.`,page.registryNo && `Registry No. ${page.registryNo}.`])};
    }
    case "benchmark": return {title:seoTitle(`${name} Benchmark Results & Scores`),description:seoDescription([
      `${name} results for ${page.models} models across ${page.versions} versions, from primary sources.`,
      !isPlaceholder(page.latest) ? `Latest version: ${page.latest}.` : undefined])};
    case "benchmark-version": return {title:seoTitle(`${name} Results & Scores`),description:seoDescription([
      `${name} scores for ${page.models} models.`,!isPlaceholder(page.metric) ? `Metric: ${page.metric}.` : undefined,
      released && `Released ${released}.`,`${page.records} reported results from primary sources.`])};
    case "company": return {title:seoTitle(`${name} AI Models and Benchmark Results`),description:seoDescription([
      `Benchmark results for ${page.models} ${name} models${!isPlaceholder(page.latest) ? `, including ${page.latest}` : ""}.`,"Sourced from official publications."])};
  }
}

export function isIndexablePage(page: SeoPage): boolean {
  return page.kind !== "model" && page.kind !== "benchmark-version"
    || page.records >= MIN_INDEXABLE_RECORDS && (page.kind !== "benchmark-version" || !isPlaceholder(page.version));
}
