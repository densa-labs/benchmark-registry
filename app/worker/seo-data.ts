import type { BenchmarkRef, BenchmarkVersionSummary, ModelSummary, ResultRow } from "./api";
import { isPlaceholder } from "../src/seo";
import { benchmarkDisplayName, benchmarkVersionLabel } from "../src/benchmark-names";

export type SeoKind = "home" | "models" | "benchmarks" | "companies" | "model" | "benchmark" | "benchmark-version" | "company";
export interface SeoPage {
  kind: SeoKind;
  name: string;
  records: number;
  models: number;
  benchmarks: number;
  versions: number;
  organizations: number;
  updated?: string;
  released?: string;
  provider?: string;
  registryNo?: string;
  version?: string;
  familyName?: string;
  latest?: string;
  metric?: string;
  sources: string[];
  topResults?: ResultRow[];
  latestVersion?: BenchmarkVersionSummary;
  coveredBenchmarks?: Array<{name:string;path:string}>;
}
export interface SeoSnapshot { pages: Record<string, SeoPage>; models: ModelSummary[] }
export interface SeoInputs {
  models: Array<ModelSummary & { checked: string; source: string }>;
  companies: Array<{ name: string; slug: string; checked: string; latest?: string }>;
  families: Array<BenchmarkRef & { checked: string }>;
  versions: Array<BenchmarkVersionSummary & { checked: string; source: string }>;
  results: Array<{ row: ResultRow; checked: string }>;
}
export function latestDate(values: Array<string | undefined>): string | undefined {
  return values.filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}
/** Runs only in the controlled producer, using persisted facts; never build time. */
export function buildSeoSnapshot(input: SeoInputs): SeoSnapshot {
  const pages: Record<string, SeoPage> = {};
  const summarize = (kind: SeoKind, name: string, results: SeoInputs["results"], checked: string[]): SeoPage => ({
    kind, name, records: results.length,
    models: new Set(results.map(({ row }) => row.model.registry_no)).size,
    benchmarks: new Set(results.map(({ row }) => row.benchmark.slug)).size,
    versions: new Set(results.map(({ row }) => `${row.benchmark.slug}/${row.benchmark_version_slug}`)).size,
    organizations: input.companies.length,
    updated: latestDate([...checked, ...results.map(result => result.checked)]),
    sources: [...new Set(results.map(({ row }) => row.primary_source_url))].sort(),
  });
  const checked = [...input.models, ...input.companies, ...input.families, ...input.versions].map(entity => entity.checked);
  for (const [path, kind, name] of [["/", "home", "Benchmark Registry"], ["/models", "models", "AI Models"], ["/benchmarks", "benchmarks", "AI Benchmarks"], ["/companies", "companies", "AI Model Developers"]] as const) {
    pages[path] = { ...summarize(kind, name, input.results, checked), models: input.models.length, benchmarks: input.families.length, versions: input.versions.length };
  }
  for (const model of input.models) {
    const rows = input.results.filter(({ row }) => row.model.registry_no === model.registry_no);
    pages[`/models/${model.registry_no}`] = { ...summarize("model", model.name, rows, [model.checked]),
      provider: model.company.name, registryNo: model.registry_no, released: model.released_at,
      sources: [...new Set([model.source, ...rows.map(({ row }) => row.primary_source_url)])].sort(),
      coveredBenchmarks: [...new Map(rows.flatMap(({row})=>[
        [`/benchmarks/${row.benchmark.slug}`,{name:benchmarkDisplayName(row.benchmark),path:`/benchmarks/${row.benchmark.slug}`}],
        [`/benchmarks/${row.benchmark.slug}/${row.benchmark_version_slug}`,{name:benchmarkVersionLabel(row.benchmark,row.benchmark_version),path:`/benchmarks/${row.benchmark.slug}/${row.benchmark_version_slug}`}],
      ] as const)).values()].sort((a,b)=>a.name.localeCompare(b.name,"en") || a.path.localeCompare(b.path,"en")),
    };
  }
  for (const company of input.companies) {
    const models = input.models.filter(model => model.company.slug === company.slug);
    const rows = input.results.filter(({ row }) => row.model.company.slug === company.slug);
    pages[`/companies/${company.slug}`] = { ...summarize("company", company.name, rows, [company.checked, ...models.map(model => model.checked)]), models: models.length, latest: company.latest };
  }
  for (const family of input.families) {
    const versions = input.versions.filter(version => version.benchmark.slug === family.slug);
    const rows = input.results.filter(({ row }) => row.benchmark.slug === family.slug);
    pages[`/benchmarks/${family.slug}`] = { ...summarize("benchmark", benchmarkDisplayName(family), rows, [family.checked, ...versions.map(version => version.checked)]), versions: versions.length, latest: versions[0] ? (isPlaceholder(versions[0].version) ? benchmarkDisplayName(family) : benchmarkVersionLabel(family, versions[0].version)) : undefined };
    const familyPage=pages[`/benchmarks/${family.slug}`];
    familyPage.latestVersion=versions[0];
    familyPage.topResults=rows.filter(({row})=>row.benchmark_version_slug===versions[0]?.version_slug)
      .map(({row})=>row).sort((a,b)=>{
        const x=a.reported_at.slice(0,a.reported_precision==='date' || b.reported_precision==='date'?10:undefined);
        const y=b.reported_at.slice(0,a.reported_precision==='date' || b.reported_precision==='date'?10:undefined);
        return y.localeCompare(x,'en') || a.result_key.localeCompare(b.result_key,'en');
      }).slice(0,5);
    for (const version of versions) {
      const selected = rows.filter(({ row }) => row.benchmark_version_slug === version.version_slug);
      pages[`/benchmarks/${family.slug}/${version.version_slug}`] = { ...summarize("benchmark-version", isPlaceholder(version.version) ? benchmarkDisplayName(family) : benchmarkVersionLabel(family, version.version), selected, [version.checked]), version: version.version, familyName:benchmarkDisplayName(family),
        released: version.released_at, metric: version.metric.name,
        sources: [...new Set([version.source, ...selected.map(({ row }) => row.primary_source_url)])].sort() };
    }
  }
  return { pages, models: input.models.map(({ checked: _checked, source: _source, ...model }) => model) };
}
