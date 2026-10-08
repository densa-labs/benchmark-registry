import type { ComparisonPair } from "./comparison-pairs";
import type { BenchmarkRef, ResultRow } from "../worker/api";
import type { ModelDetailResponse, ModelListEntry } from "./registry";
import { benchmarkDisplayName } from "./benchmark-names";
import { normalizeSearch } from "../worker/params";
import { effortRank } from "./result-pivot";

export interface ComparisonState {
  models: [string, string];
  reasoning: [string | undefined, string | undefined];
  query: string;
  sharedOnly: boolean;
  page: number;
  limit: 50 | 100 | 500;
}

export interface ComparisonResponse {
  models: ModelListEntry[];
  selected: [ModelDetailResponse | null, ModelDetailResponse | null];
  issues: string[];
  /** Prerendered pair pages, offered while fewer than two models are chosen. */
  suggestions?: ComparisonPair[];
}

/** Selector value for Any; the comma format writes it as a bare "~" too. */
export const ANY_REASONING = "~";

export function parseComparisonState(search: string): ComparisonState {
  const params = new URLSearchParams(search);
  // provider and released_* belonged to a retired model filter; old links still load and ignore them.
  const allowed = ["models", "reasoning", "model_a", "model_b", "reasoning_a", "reasoning_b", "q", "benchmarks", "page", "limit", "provider", "released_from", "released_to"];
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new Error("This comparison URL contains unsupported or repeated parameters.");
  }
  if (params.has("models") && (params.has("model_a") || params.has("model_b")) || params.has("reasoning") && (params.has("reasoning_a") || params.has("reasoning_b"))) throw new Error("This comparison URL mixes selection formats.");
  const models = params.has("models") ? params.get("models")!.split(",") : [params.get("model_a") ?? "", params.get("model_b") ?? ""];
  if (models.length > 2 || models.some(value => value !== "" && !/^[0-9]{5,6}$/u.test(value))) throw new Error("Choose up to two models using their Registry Nos.");
  // "~" (or no value) is Any: every recorded reasoning level for that model.
  const reasoning = params.has("reasoning") ? params.get("reasoning")!.split(",").map(value => value === "~" ? undefined : decodeURIComponent(value)) : [params.get("reasoning_a"), params.get("reasoning_b")].map(value => value === null || value === ANY_REASONING ? undefined : value);
  if (reasoning.length > 2 || reasoning.some(value => value?.includes("\u0000"))) throw new Error("Choose one reasoning level per model.");
  const query = (params.get("q") ?? "").trim();
  if (new TextEncoder().encode(query).length > 50) throw new Error("Benchmark search must be 50 bytes or fewer.");
  const mode = params.get("benchmarks");
  if (mode !== null && mode !== "all" && mode !== "shared") throw new Error("Choose All or Shared only benchmarks.");
  const pageValue = params.get("page") ?? "1";
  const page = Number(pageValue);
  if (!/^[1-9][0-9]*$/u.test(pageValue) || !Number.isSafeInteger(page)) throw new Error("Page must be a positive whole number.");
  const limitValue = params.get("limit") ?? "50";
  if (!["50", "100", "500"].includes(limitValue)) throw new Error("Rows per page must be 50, 100, or 500.");
  if (!Number.isSafeInteger((page - 1) * Number(limitValue))) throw new Error("Page is outside the supported range.");
  return { models: [models[0] ?? "", models[1] ?? ""], reasoning: [reasoning[0], reasoning[1]], query, sharedOnly: mode !== "all", page, limit: Number(limitValue) as ComparisonState["limit"] };
}

export function comparisonHref(state: ComparisonState): string {
  const params = new URLSearchParams();
  if (state.models.some(Boolean)) params.set("models", state.models.join(","));
  if (state.reasoning.some(value => value !== undefined)) params.set("reasoning", state.reasoning.map(value => value === undefined ? "~" : encodeURIComponent(value).replaceAll("~", "%7E")).join(","));
  if (state.query) params.set("q", state.query);
  if (!state.sharedOnly) params.set("benchmarks", "all");
  if (state.limit !== 50) params.set("limit", String(state.limit));
  if (state.page !== 1) params.set("page", String(state.page));
  return params.size ? `/compare?${params}` : "/compare";
}

// Any (undefined) keeps the latest result at every recorded level, each labelled with
// its level in the score cell; a named level filters to exactly that level.
export function reasoningSelection(response: ModelDetailResponse | null, requested: string | undefined) {
  const rows = response?.data.results ?? [];
  const available = [...new Set(rows.map(row => row.reasoning_level ?? ""))].sort((a, b) => a.localeCompare(b, "en"));
  return { available, value: requested, unavailable: requested !== undefined && available.length > 0 && !available.includes(requested), results: requested === undefined ? rows : rows.filter(row => (row.reasoning_level ?? "") === requested) };
}

export interface ComparisonRow {
  key: string;
  benchmark: BenchmarkRef;
  results: [ResultRow[], ResultRow[]];
  shared: boolean;
  differences: string[];
}

const contextKey = (row: ResultRow) => JSON.stringify([row.benchmark_version_slug, row.metric.key, row.metric.unit, row.metric.storage_kind]);
const evaluatorKey = (row: ResultRow) => JSON.stringify([...row.evaluator_names].sort());
const setKey = (rows: ResultRow[], key: (row: ResultRow) => string) => JSON.stringify([...new Set(rows.map(key))].sort());

function comparisonRow(key: string, benchmark: BenchmarkRef, results: ComparisonRow["results"]): ComparisonRow {
  const [a, b] = results;
  const shared = a.length > 0 && b.length > 0;
  const differences: string[] = [];
  if (shared) {
    if (setKey(a, row => row.benchmark_version_slug) !== setKey(b, row => row.benchmark_version_slug)) differences.push("Benchmark versions differ.");
    if (setKey(a, row => JSON.stringify([row.metric.key, row.metric.unit, row.metric.storage_kind])) !== setKey(b, row => JSON.stringify([row.metric.key, row.metric.unit, row.metric.storage_kind]))) differences.push("Metrics differ.");
    if (setKey(a, evaluatorKey) !== setKey(b, evaluatorKey)) differences.push("Evaluator sets differ.");
    if (setKey(a, row => row.score_setting?.key ?? "") !== setKey(b, row => row.score_setting?.key ?? "")) differences.push("Benchmark settings differ.");
  }
  // Within an evaluator, Any lists levels from no effort to max, then unreviewed labels.
  const order = (rows: ResultRow[]) => [...rows].sort((left, right) => evaluatorKey(left).localeCompare(evaluatorKey(right), "en") || effortRank(left) - effortRank(right)
    || (left.reasoning_level ?? "").localeCompare(right.reasoning_level ?? "", "en") || left.result_key.localeCompare(right.result_key, "en"));
  return { key, benchmark, results: [order(a), order(b)], shared, differences };
}

// Match canonical version/metric identities first. Retain each evaluator's latest
// series; an unmatched pair is shown with its recorded differences, never merged.
export function buildComparisonRows(a: ResultRow[], b: ResultRow[]): ComparisonRow[] {
  const families = new Map<string, { benchmark: BenchmarkRef; sides: [Map<string, ResultRow[]>, Map<string, ResultRow[]>] }>();
  for (const [side, rows] of [a, b].entries()) {
    for (const row of rows) {
      let family = families.get(row.benchmark.slug);
      if (!family) { family = { benchmark: row.benchmark, sides: [new Map(), new Map()] }; families.set(row.benchmark.slug, family); }
      const key = contextKey(row);
      const group = family.sides[side].get(key) ?? [];
      group.push(row);
      family.sides[side].set(key, group);
    }
  }
  const output: ComparisonRow[] = [];
  const ordered = [...families.entries()].sort(([, left], [, right]) => benchmarkDisplayName(left.benchmark).localeCompare(benchmarkDisplayName(right.benchmark), "en") || left.benchmark.slug.localeCompare(right.benchmark.slug, "en"));
  for (const [slug, { benchmark, sides: [left, right] }] of ordered) {
    const keys = [...new Set([...left.keys(), ...right.keys()])].sort();
    for (const key of keys) {
      if (left.has(key) && right.has(key)) {
        output.push(comparisonRow(`${slug}:${key}`, benchmark, [left.get(key)!, right.get(key)!]));
        left.delete(key); right.delete(key);
      }
    }
    if (left.size === 1 && right.size === 1) {
      output.push(comparisonRow(`${slug}:different-context`, benchmark, [[...left.values()][0], [...right.values()][0]]));
    } else {
      for (const key of keys) {
        if (left.has(key) || right.has(key)) output.push(comparisonRow(`${slug}:${key}`, benchmark, [left.get(key) ?? [], right.get(key) ?? []]));
      }
    }
  }
  return [...output.filter(row => row.shared), ...output.filter(row => !row.shared)];
}

export function comparisonPage(rows: ComparisonRow[], state: ComparisonState) {
  const query = normalizeSearch(state.query);
  const filtered = rows.filter(row => (!state.sharedOnly || row.shared) && (!query || [row.benchmark.name, ...row.benchmark.aliases, ...row.results.flat().map(result => result.benchmark_version)].some(value => normalizeSearch(value).includes(query))));
  const page = filtered.slice((state.page - 1) * state.limit, state.page * state.limit);
  return { shared: page.filter(row => row.shared), other: page.filter(row => !row.shared), total: filtered.length, totalPages: Math.ceil(filtered.length / state.limit) };
}

/** Prerendered pair pages, newest release first; pairs with a model missing from the directory are skipped. */
export function suggestedComparisons(response: ComparisonResponse): { name: string; path: string }[] {
  const byNo = new Map(response.models.map(model => [model.registry_no, model]));
  return (response.suggestions ?? []).flatMap(pair => {
    const [a, b] = pair.models.map(no => byNo.get(no));
    return a && b ? [{ name: `${a.name} vs ${b.name}`, path: pair.path, newest: a.released_at > b.released_at ? a.released_at : b.released_at }] : [];
  }).sort((x, y) => y.newest.localeCompare(x.newest, "en") || x.path.localeCompare(y.path, "en")).map(({ name, path }) => ({ name, path }));
}
