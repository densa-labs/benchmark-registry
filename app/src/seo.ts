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
/** Keep the result keywords intact when an entity name needs shortening. */
export function entityTitle(name:string,keywords:string,compactKeywords=keywords):string {
  const suffix=` ${keywords} | ${SITE_NAME}`;
  if(cleanSeoText(name).length+suffix.length<=TITLE_LIMIT) return seoTitle(name,suffix);
  const compact=` ${compactKeywords} | ${SITE_NAME}`;
  if(cleanSeoText(name).length+compact.length<=TITLE_LIMIT) return seoTitle(name,compact);
  // Clipping the name would make sibling titles identical (e.g. two harness versions); drop the site name first.
  return seoTitle(name,` ${compactKeywords}`);
}
function comparisonName(name:string):string {
  const sides=name.split(" vs ");if(sides.length!==2) return name;
  const [a,b]=sides.map(side=>/^(.*?)(\d+(?:\.\d+)*)(.*)$/u.exec(side));
  if(a && b && a[1]===b[1] && a[3]===b[3]) return `${a[1]}${a[2]} vs ${b[2]}${a[3]}`;
  return name;
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
      return {title:entityTitle(name,"Benchmark Results & Scores","Benchmark Results"),description:seoDescription([
        `${name} benchmark results from primary sources: ${page.records} records across ${page.benchmarks} benchmarks.`,
        !isPlaceholder(page.provider) ? `Developer: ${page.provider}.` : undefined,
        released && `Released ${released}.`,page.registryNo && `Registry No. ${page.registryNo}.`])};
    }
    case "benchmark": return {title:entityTitle(name,"Benchmark Results & Scores","Benchmark Results"),description:seoDescription([
      `${name} results for ${page.models} ${page.models===1 ? "model" : "models"} across ${page.versions} ${page.versions===1 ? "version" : "versions"}, from primary sources.`,
      !isPlaceholder(page.latest) ? `Latest version: ${page.latest}.` : undefined])};
    case "benchmark-version": return {title:entityTitle(name,"Results & Scores","Results"),description:seoDescription([
      `${name} scores for ${page.models} models.`,!isPlaceholder(page.metric) ? `Metric: ${page.metric}.` : undefined,
      released && `Released ${released}.`,`${page.records} reported results from primary sources.`])};
    case "recent": return {title:seoTitle("Recently Added AI Benchmark Results"),description:seoDescription([
      `${page.records} recently added benchmark records across ${page.models} AI models, with reported scores and primary source links.`,updated && `Updated ${updated}.`])};
    case "comparison": return {title:entityTitle((`${name}: Benchmark Comparison | ${SITE_NAME}`.length<=TITLE_LIMIT ? name : comparisonName(name))+":","Benchmark Comparison"),description:seoDescription([
      `${name}: compare scores across ${page.benchmarks} shared benchmarks, with reported results and primary source links.`])};
    case "company": return {title:entityTitle(name,"AI Models and Benchmark Results","Models & Benchmarks"),description:seoDescription([
      `Benchmark results for ${page.models} ${name} models${!isPlaceholder(page.latest) ? `, including ${page.latest}` : ""}.`,"Sourced from official publications."])};
  }
}

export function isIndexablePage(page: SeoPage): boolean {
  return page.kind !== "model" && page.kind !== "benchmark-version"
    || page.records >= MIN_INDEXABLE_RECORDS && (page.kind !== "benchmark-version" || !isPlaceholder(page.version));
}
