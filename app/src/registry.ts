import type {
  BenchmarkVersionSummary,
  CompanySummary,
  ModelSummary,
  Page,
  ResultRow,
} from "../worker/api";

export interface ModelListResponse {
  data: ModelSummary[];
  page: Page;
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
    benchmark: { name: string; slug: string };
    latest_version: string;
    latest_released_at: string;
    latest_release_precision: "date" | "timestamp";
  }>;
  page: Page;
}

export interface BenchmarkFamilyResponse {
  data: {
    benchmark: { name: string; slug: string; aliases: string[] };
    versions: BenchmarkVersionSummary[];
  };
}

export interface BenchmarkVersionResponse {
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

export type RegistryRoute =
  | { kind: "models" }
  | { kind: "model"; registryNo: string }
  | { kind: "benchmarks" }
  | { kind: "benchmark"; slug: string }
  | { kind: "benchmark-version"; slug: string; version: string }
  | { kind: "not-found" };

export type LoadedRegistryRoute =
  | { kind: "models"; payload: ModelListResponse }
  | { kind: "model"; payload: ModelDetailResponse }
  | { kind: "benchmarks"; payload: BenchmarkListResponse }
  | { kind: "benchmark"; payload: BenchmarkFamilyResponse }
  | { kind: "benchmark-version"; payload: BenchmarkVersionPageResponse }
  | { kind: "not-found" };

export class RegistryClientError extends Error {}

export function resolveRegistryRoute(pathname: string): RegistryRoute {
  if (pathname === "/models" || pathname === "/models/") {
    return { kind: "models" };
  }

  if (pathname === "/benchmarks" || pathname === "/benchmarks/") {
    return { kind: "benchmarks" };
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

    return { kind: "not-found" };
  } catch {
    return { kind: "not-found" };
  }
}

function apiPath(route: Exclude<RegistryRoute, { kind: "not-found" }>): string {
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
    if (!response.ok) throw new RegistryClientError(errorMessage(body));

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
  if (route.kind === "not-found") return route;

  const response = await fetcher(`${apiPath(route)}${search}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const body: unknown = await response.json();

  if (response.status === 404) return { kind: "not-found" };
  if (!response.ok) throw new RegistryClientError(errorMessage(body));

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
      const availableCompanies = await loadBenchmarkCompanies(
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
  }
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
  precision: "date" | "timestamp",
): string {
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
