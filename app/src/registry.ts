import type { ModelSummary, Page, ResultRow } from "../worker/api";

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

export type RegistryRoute =
  | { kind: "models" }
  | { kind: "model"; registryNo: string }
  | { kind: "not-found" };

export type LoadedRegistryRoute =
  | { kind: "models"; payload: ModelListResponse }
  | { kind: "model"; payload: ModelDetailResponse }
  | { kind: "not-found" };

export class RegistryClientError extends Error {}

export function resolveRegistryRoute(pathname: string): RegistryRoute {
  if (pathname === "/models" || pathname === "/models/") {
    return { kind: "models" };
  }

  const match = /^\/models\/([^/]+)\/?$/u.exec(pathname);
  if (!match) return { kind: "not-found" };

  try {
    return { kind: "model", registryNo: decodeURIComponent(match[1]) };
  } catch {
    return { kind: "not-found" };
  }
}

function apiPath(route: Exclude<RegistryRoute, { kind: "not-found" }>): string {
  return route.kind === "models"
    ? "/api/models"
    : `/api/models/${encodeURIComponent(route.registryNo)}`;
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

  return route.kind === "models"
    ? { kind: "models", payload: body as ModelListResponse }
    : { kind: "model", payload: body as ModelDetailResponse };
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
