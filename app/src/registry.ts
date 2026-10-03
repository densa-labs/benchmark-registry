import type { LegalKind } from "./legal-content";
import type {
  BenchmarkRef,
  BenchmarkVersionSummary,
  CompanySummary,
  ModelSummary,
  Page,
  ResultRow,
} from "../worker/api";
import { diagnoseApiFailure } from "./diagnostics";
import type { HomePanels } from "../worker/home-panels";
import type { FeaturedResult } from "../worker/featured-result";
import { parseComparisonState, type ComparisonResponse } from "./compare";
import { ApiError } from "../worker/api";

export type ModelListEntry = ModelSummary & { featured_result?: FeaturedResult | null };

export interface ModelListResponse {
  data: ModelListEntry[];
  page: Page;
}

export interface HomePageResponse {
  stats: {
    data: {
      benchmark_results: number;
      models: number;
      benchmarks: number;
      versions: number;
    };
  };
  panels: HomePanels;
  all_models: ModelListEntry[];
}

export interface ModelDetailResponse {
  data: {
    model: ModelSummary & {
      source_url: string;
      aliases: string[];
    };
    redirected_from: string | null;
    results: ResultRow[];
    result_page: Page;
  };
}

export interface BenchmarkListResponse {
  data: Array<{
    benchmark: BenchmarkRef;
    latest_version: string;
    latest_released_at: string;
    latest_release_precision: "date" | "timestamp";
  }>;
  page: Page;
}

export interface BenchmarkFamilyResponse {
  data: {
    benchmark: BenchmarkRef;
    versions: BenchmarkVersionSummary[];
  };
}

export interface BenchmarkVersionResponse {
  available_companies?: CompanySummary[];
  data: {
    version: BenchmarkVersionSummary;
    evaluator_names: string[];
    source_url: string;
    view: "latest" | "history";
    company: string | null;
    results: ResultRow[];
    result_page: Page;
  };
}

export interface BenchmarkVersionPageResponse extends BenchmarkVersionResponse {
  available_companies: CompanySummary[];
}

export interface CompanyListResponse {
  data: Array<CompanySummary & {
    established_at: string | null;
    established_precision: "year" | "date" | "timestamp" | null;
    entity_kind: "company" | "ai_unit";
    established_basis: "source" | "user_attested";
    latest_model: ModelSummary | null;
  }>;
  page: Page;
}

export interface CompanyDetailResponse {
  data: {
    company: CompanySummary & {
      established_at: string | null;
      established_precision: "year" | "date" | "timestamp" | null;
      entity_kind: "company" | "ai_unit";
      established_basis: "source" | "user_attested";
    };
    latest_model: ModelSummary | null;
    results: ResultRow[];
    result_page: Page;
  };
}

interface SearchResultFields {
  canonical_name: string;
  matched_text: string;
  href: string;
}

export type SearchResult = SearchResultFields & (
  | { entity_type: "benchmark"; aliases: string[] }
  | { entity_type: "model" | "company" | "result" }
);

export interface SearchResponse {
  direct_href?: string;
  data: SearchResult[];
  page: Page;
}

export type RegistryRoute =
  | { kind: "home" }
  | { kind: "compare" }
  | { kind: "models" }
  | { kind: "model"; registryNo: string }
  | { kind: "benchmarks" }
  | { kind: "benchmark"; slug: string }
  | { kind: "benchmark-version"; slug: string; version: string }
  | { kind: "companies" }
  | { kind: "company"; slug: string }
  | { kind: "legal" }
  | { kind: "privacy" }
  | { kind: "terms" }
  | { kind: "not-found" };

export type LoadedRegistryRoute =
  | { kind: "home"; payload: HomePageResponse }
  | { kind: "compare"; payload: ComparisonResponse }
  | { kind: "models"; payload: ModelListResponse }
  | { kind: "model"; payload: ModelDetailResponse }
  | { kind: "benchmarks"; payload: BenchmarkListResponse }
  | { kind: "benchmark"; payload: BenchmarkFamilyResponse }
  | { kind: "benchmark-version"; payload: BenchmarkVersionPageResponse }
  | { kind: "companies"; payload: CompanyListResponse }
  | { kind: "company"; payload: CompanyDetailResponse }
  | { kind: "legal" }
  | { kind: "privacy" }
  | { kind: "terms" }
  | { kind: "not-found" };

export class RegistryClientError extends Error {}

export function resolveRegistryRoute(pathname: string): RegistryRoute {
  if (pathname === "/") {
    return { kind: "home" };
  }

  if (pathname === "/compare" || pathname === "/compare/") return { kind: "compare" };

  for (const kind of ["legal", "privacy", "terms"] as const) {
    if (pathname === `/${kind}` || pathname === `/${kind}/`) return { kind };
  }

  if (pathname === "/models" || pathname === "/models/") {
    return { kind: "models" };
  }

  if (pathname === "/benchmarks" || pathname === "/benchmarks/") {
    return { kind: "benchmarks" };
  }

  if (pathname === "/companies" || pathname === "/companies/") {
    return { kind: "companies" };
  }

  try {
    const modelMatch = /^\/models\/([^/]+)\/?$/u.exec(pathname);
    if (modelMatch) {
      return { kind: "model", registryNo: decodeURIComponent(modelMatch[1]) };
    }

    const benchmarkVersionMatch = /^\/benchmarks\/([^/]+)\/([^/]+)\/?$/u.exec(pathname);
    if (benchmarkVersionMatch) {
      return {
        kind: "benchmark-version",
        slug: decodeURIComponent(benchmarkVersionMatch[1]),
        version: decodeURIComponent(benchmarkVersionMatch[2]),
      };
    }

    const benchmarkMatch = /^\/benchmarks\/([^/]+)\/?$/u.exec(pathname);
    if (benchmarkMatch) {
      return { kind: "benchmark", slug: decodeURIComponent(benchmarkMatch[1]) };
    }

    const companyMatch = /^\/companies\/([^/]+)\/?$/u.exec(pathname);
    if (companyMatch) {
      return { kind: "company", slug: decodeURIComponent(companyMatch[1]) };
    }

    return { kind: "not-found" };
  } catch {
    return { kind: "not-found" };
  }
}

function apiPath(route: Exclude<RegistryRoute, { kind: "home" | "compare" | "not-found" | LegalKind }>): string {
  switch (route.kind) {
    case "models":
      return "/api/models";
    case "model":
      return `/api/models/${encodeURIComponent(route.registryNo)}`;
    case "benchmarks":
      return "/api/benchmarks";
    case "benchmark":
      return `/api/benchmarks/${encodeURIComponent(route.slug)}`;
    case "benchmark-version":
      return `/api/benchmarks/${encodeURIComponent(route.slug)}/${encodeURIComponent(route.version)}`;
    case "companies":
      return "/api/companies";
    case "company":
      return `/api/companies/${encodeURIComponent(route.slug)}`;
  }
}

function errorMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }
  return "The registry data could not be loaded.";
}

let searchGeneration: string | undefined;
export function setSearchGeneration(generation: string) { searchGeneration=generation; }
const searchCaches = new WeakMap<typeof fetch, Map<string, {time:number; generation?:string; body:SearchResponse}>>();

export async function searchRegistry(
  query: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  let cache = searchCaches.get(fetcher);
  if (!cache) {cache=new Map();searchCaches.set(fetcher,cache);}
  const cached = cache.get(query);
  if (cached && cached.generation===searchGeneration && Date.now() - cached.time < 60_000) return cached.body;
  const params = new URLSearchParams({ q: query, limit: "50" });
  const response = await fetcher(`/api/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) { diagnoseApiFailure(response.status); throw new RegistryClientError(errorMessage(body)); }
  if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data) || !("page" in body)) throw new RegistryClientError("Invalid search response.");
  if (!signal?.aborted) {
    cache.set(query,{time:Date.now(),generation:response.headers.get('X-Registry-Revision') ?? searchGeneration,body:body as SearchResponse});
    if (cache.size > 16) cache.delete(cache.keys().next().value!);
  }
  return body as SearchResponse;
}

async function loadBenchmarkCompanies(
  route: Extract<RegistryRoute, { kind: "benchmark-version" }>,
  search: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<CompanySummary[]> {
  const params = new URLSearchParams(search);
  for (const key of ["company", "page", "limit", "sort", "order"]) {
    params.delete(key);
  }
  params.set("limit", "500");

  const companies = new Map<string, CompanySummary>();
  let page = 1;
  while (true) {
    params.set("page", String(page));
    const response = await fetcher(`${apiPath(route)}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) { diagnoseApiFailure(response.status); throw new RegistryClientError(errorMessage(body)); }

    const payload = body as BenchmarkVersionResponse;
    for (const result of payload.data.results) {
      companies.set(result.model.company.slug, result.model.company);
    }
    if (page >= payload.data.result_page.total_pages) break;
    page += 1;
  }

  return Array.from(companies.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
}

export async function loadRegistryRoute(
  route: RegistryRoute,
  search: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<LoadedRegistryRoute> {
  if (route.kind === "not-found" || route.kind === "legal" || route.kind === "privacy" || route.kind === "terms") return route;

  if (route.kind === "compare") return { kind: "compare", payload: await loadComparison(search, fetcher, signal) };

  if (route.kind === "home") {
    const request = (path: string) => fetcher(path, {
      headers: { Accept: "application/json" },
      signal,
    });
    const [statsResponse, panelsResponse, directoryResponse] = await Promise.all([
      request("/api/stats"),
      request("/api/home-panels"),
      request("/api/models?sort=name&order=asc&limit=500"),
    ]);
    const [statsBody, panelsBody, directoryBody]: unknown[] = await Promise.all([
      statsResponse.json(),
      panelsResponse.json(),
      directoryResponse.json(),
    ]);
    if (!statsResponse.ok) throw new RegistryClientError(errorMessage(statsBody));
    if (!panelsResponse.ok) throw new RegistryClientError(errorMessage(panelsBody));
    if (!directoryResponse.ok) throw new RegistryClientError(errorMessage(directoryBody));
    const directory = directoryBody as ModelListResponse;
    const remainingPages = Array.from(
      { length: Math.max(0, directory.page.total_pages - 1) },
      (_, index) => index + 2,
    );
    const remaining = await Promise.all(remainingPages.map(async (page) => {
      const response = await request(`/api/models?sort=name&order=asc&limit=500&page=${page}`);
      const body: unknown = await response.json();
      if (!response.ok) throw new RegistryClientError(errorMessage(body));
      return body as ModelListResponse;
    }));
    return {
      kind: "home",
      payload: {
        stats: statsBody as HomePageResponse["stats"],
        panels: panelsBody as HomePanels,
        all_models: [directory, ...remaining].flatMap((page) => page.data),
      },
    };
  }

  const response = await fetcher(`${apiPath(route)}${search}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const body: unknown = await response.json();

  if (response.status === 404) return { kind: "not-found" };
  if (!response.ok) { diagnoseApiFailure(response.status); throw new RegistryClientError(errorMessage(body)); }

  switch (route.kind) {
    case "models":
      return { kind: "models", payload: body as ModelListResponse };
    case "model":
      return { kind: "model", payload: body as ModelDetailResponse };
    case "benchmarks":
      return { kind: "benchmarks", payload: body as BenchmarkListResponse };
    case "benchmark":
      return { kind: "benchmark", payload: body as BenchmarkFamilyResponse };
    case "benchmark-version": {
      const availableCompanies = (body as BenchmarkVersionResponse).available_companies ?? await loadBenchmarkCompanies(
        route,
        search,
        fetcher,
        signal,
      );
      return {
        kind: "benchmark-version",
        payload: {
          ...(body as BenchmarkVersionResponse),
          available_companies: availableCompanies,
        },
      };
    }
    case "companies":
      return { kind: "companies", payload: body as CompanyListResponse };
    case "company":
      return { kind: "company", payload: body as CompanyDetailResponse };
  }
}

async function loadComparison(search: string, fetcher: typeof fetch, signal?: AbortSignal): Promise<ComparisonResponse> {
  const issues: string[] = [];
  let state;
  try { state = parseComparisonState(search); }
  catch (error) { issues.push(error instanceof Error ? error.message : "This comparison URL is invalid."); state = parseComparisonState(""); }
  const request = async <T,>(path: string, allowMissing = false): Promise<T | null> => {
    let response: Response;
    try { response = await fetcher(path, { headers: { Accept: "application/json" }, signal }); }
    catch (error) {
      // The pinned Worker reader throws API errors directly during SSR.
      if (allowMissing && error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
    const body: unknown = await response.json();
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) { diagnoseApiFailure(response.status); throw new RegistryClientError(errorMessage(body)); }
    return body as T;
  };
  const directory = async () => {
    const first = (await request<ModelListResponse>("/api/models?sort=name&order=asc&limit=500"))!;
    const models = [...first.data];
    for (let page = 2; page <= first.page.total_pages; page++) {
      const next = (await request<ModelListResponse>(`/api/models?sort=name&order=asc&limit=500&page=${page}`))!;
      models.push(...next.data);
    }
    return models;
  };
  const model = async (registryNo: string) => {
    if (!registryNo) return null;
    const path = `/api/models/${encodeURIComponent(registryNo)}?view=latest&limit=500`;
    const first = await request<ModelDetailResponse>(path, true);
    if (!first) return null;
    const results = [...first.data.results];
    for (let page = 2; page <= first.data.result_page.total_pages; page++) {
      const next = (await request<ModelDetailResponse>(`${path}&page=${page}`))!;
      results.push(...next.data.results);
    }
    return { data: { ...first.data, results } };
  };
  const [models, a, b] = await Promise.all([directory(), model(state.models[0]), model(state.models[1])]);
  for (const [side, selected] of [a, b].entries()) {
    if (!selected && state.models[side]) issues.push(`Model ${side === 0 ? "A" : "B"} (Registry No. ${state.models[side]}) was not found. Choose another model.`);
  }
  return { models, selected: [a, b], issues };
}

export type QueryChange = string | number | null | undefined;

export function queryHref(
  pathname: string,
  currentSearch: string,
  changes: Record<string, QueryChange>,
): string {
  const params = new URLSearchParams(currentSearch);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

export function formatRegistryDate(
  value: string,
  precision: "year" | "date" | "timestamp",
): string {
  if (precision === "year") return value.slice(0, 4);

  if (precision === "date") {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  return `${new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function formatRegistryMonthYear(value: string): string {
  const [year, month] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
