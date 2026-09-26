import { ApiError, type ResultView } from "./api";

export type SortOrder = "asc" | "desc";

export interface ParsedListParams {
  page: number;
  limit: 50 | 100 | 500;
  q?: string;
  company?: string;
  sort?: string;
  order?: SortOrder;
  view?: ResultView;
  result?: string;
}

interface ParameterPolicy {
  allowed: readonly string[];
  sorts?: readonly string[];
  requireQuery?: boolean;
}

const LIMITS = new Set(["50", "100", "500"]);

// ECMAScript has no native full Unicode case-fold operation. NFKC handles the
// compatibility forms; these are the fold differences relevant to names that
// are not handled by lower-casing itself.
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("ß", "ss")
    .replaceAll("ς", "σ")
    .replace(/[\uAB70-\uABBF]/gu, (character) =>
      String.fromCodePoint(character.codePointAt(0)! - 0x97d0),
    );
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  if (!/^[1-9][0-9]*$/u.test(value)) {
    throw new ApiError(400, "invalid_query", "Page must be a positive integer.");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new ApiError(400, "invalid_query", "Page is outside the supported range.");
  }
  return parsed;
}

export function parseParameters(
  searchParams: URLSearchParams,
  policy: ParameterPolicy,
): ParsedListParams {
  const allowed = new Set(policy.allowed);
  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) {
      throw new ApiError(
        400,
        "unsupported_parameter",
        `Query parameter '${key}' is not supported on this endpoint.`,
      );
    }
    if (searchParams.getAll(key).length !== 1) {
      throw new ApiError(
        400,
        "invalid_query",
        `Query parameter '${key}' may be supplied only once.`,
      );
    }
  }

  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const limitValue = searchParams.get("limit");
  const normalizedLimit = limitValue ?? "50";
  if (!LIMITS.has(normalizedLimit)) {
    throw new ApiError(400, "invalid_query", "Limit must be 50, 100, or 500.");
  }
  const limit = Number(normalizedLimit) as 50 | 100 | 500;
  if (!Number.isSafeInteger((page - 1) * limit)) {
    throw new ApiError(400, "invalid_query", "Page is outside the supported range.");
  }

  let q: string | undefined;
  const query = searchParams.get("q");
  if (query !== null) {
    q = normalizeSearch(query.trim());
    if (q.length === 0) {
      throw new ApiError(400, "invalid_query", "Search query must not be empty.");
    }
    if (new TextEncoder().encode(q).byteLength > 50) {
      throw new ApiError(400, "invalid_query", "Search query must not exceed 50 UTF-8 bytes.");
    }
  } else if (policy.requireQuery) {
    throw new ApiError(400, "invalid_query", "Search query is required.");
  }

  const company = searchParams.get("company") ?? undefined;
  if (company !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(company)) {
    throw new ApiError(400, "invalid_query", "Company must be a canonical slug.");
  }

  const sort = searchParams.get("sort") ?? undefined;
  if (sort !== undefined && !policy.sorts?.includes(sort)) {
    throw new ApiError(400, "invalid_query", "Sort key is not supported on this endpoint.");
  }
  const orderValue = searchParams.get("order") ?? undefined;
  if (orderValue !== undefined && sort === undefined) {
    throw new ApiError(400, "invalid_query", "Order requires a sort key.");
  }
  if (orderValue !== undefined && orderValue !== "asc" && orderValue !== "desc") {
    throw new ApiError(400, "invalid_query", "Order must be 'asc' or 'desc'.");
  }

  const viewValue = searchParams.get("view") ?? undefined;
  if (viewValue !== undefined && viewValue !== "latest" && viewValue !== "history") {
    throw new ApiError(400, "invalid_query", "View must be 'latest' or 'history'.");
  }

  const result = searchParams.get("result") ?? undefined;
  if (result !== undefined && !/^[a-f0-9]{64}$/u.test(result)) {
    throw new ApiError(400, "invalid_query", "Result must be a valid immutable result key.");
  }

  return {
    result,
    page,
    limit,
    q,
    company,
    sort,
    order: sort === undefined ? undefined : (orderValue ?? "asc") as SortOrder,
    view: viewValue as ResultView | undefined,
  };
}

export function likePattern(normalizedQuery: string): string {
  return `%${normalizedQuery.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}
