export type DatePrecision = "date" | "timestamp";
export type CompanyDatePrecision = "year" | DatePrecision;
export type ResultView = "latest" | "history";

export interface Page {
  number: number;
  limit: 50 | 100 | 500;
  total_items: number;
  total_pages: number;
}
export interface CompanySummary {
  name: string;
  slug: string;
}

export interface ModelSummary {
  registry_no: string;
  name: string;
  company: CompanySummary;
  released_at: string;
  release_precision: DatePrecision;
  published_at: string;
  status: "preview" | "active" | "deprecated" | "stealth";
}

export interface BenchmarkRef {
  name: string;
  slug: string;
  aliases: string[];
}

export interface MetricSummary {
  name: string;
  key: string;
  unit: string;
  storage_kind: "decimal" | "integer" | "text";
  display_precision: number;
}

export interface BenchmarkVersionSummary {
  benchmark: BenchmarkRef;
  version: string;
  version_slug: string;
  released_at: string;
  release_precision: DatePrecision;
  metric: MetricSummary;
}

export interface ResultRow {
  result_key: string;
  model: ModelSummary;
  benchmark: BenchmarkRef;
  benchmark_version: string;
  reasoning_level: string | null;
  metric: MetricSummary;
  score: {
    raw: string;
    value: string | null;
    display: string;
  };
  evaluator_names: string[];
  primary_source_url: string;
  reported_at: string;
  reported_precision: DatePrecision;
}

export class ApiError extends Error {
  constructor(
    readonly status: 400 | 404,
    readonly code: "invalid_query" | "unsupported_parameter" | "not_found",
    message: string,
  ) {
    super(message);
  }
}

export function jsonError(
  status: 400 | 404 | 500,
  code:
    | "invalid_query"
    | "unsupported_parameter"
    | "not_found"
    | "internal_error",
  message: string,
): Response {
  return Response.json({ error: { code, message } }, { status });
}

export function pageMetadata(
  number: number,
  limit: 50 | 100 | 500,
  totalItems: number,
): Page {
  return {
    number,
    limit,
    total_items: totalItems,
    total_pages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
  };
}

export function parseJsonArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error("Database returned an invalid JSON array.");
  }
  return parsed;
}

function fixedDecimal(value: string, precision: number): string {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const padded = fractionPart.padEnd(precision + 1, "0");
  let displayedInteger = integerPart;
  let displayedFraction = padded.slice(0, precision);

  if (padded[precision] >= "5") {
    const digits = `${integerPart}${displayedFraction}`.split("");
    let carry = 1;
    for (let index = digits.length - 1; index >= 0 && carry; index -= 1) {
      const next = Number(digits[index]) + carry;
      digits[index] = String(next % 10);
      carry = next >= 10 ? 1 : 0;
    }
    if (carry) digits.unshift("1");
    const boundary = digits.length - precision;
    displayedInteger = digits.slice(0, boundary).join("") || "0";
    displayedFraction = digits.slice(boundary).join("");
  }

  const rendered = precision === 0
    ? displayedInteger
    : `${displayedInteger}.${displayedFraction.padEnd(precision, "0")}`;
  return negative && rendered !== "0" ? `-${rendered}` : rendered;
}

export function formatScore(
  raw: string,
  value: string | null,
  storageKind: MetricSummary["storage_kind"],
  displayPrecision: number,
  unit: string,
): string {
  if (storageKind === "text" || value === null) return raw;
  const numeric = fixedDecimal(value, displayPrecision);
  return unit === "percent" ? `${numeric}%` : numeric;
}

export interface ModelDbRow {
  registry_no: string;
  model_name: string;
  company_name: string;
  company_slug: string;
  release_at: string;
  release_precision: DatePrecision;
  published_at: string;
  status: ModelSummary["status"];
}

export function modelFromRow(row: ModelDbRow): ModelSummary {
  return {
    registry_no: row.registry_no,
    name: row.model_name,
    company: { name: row.company_name, slug: row.company_slug },
    released_at: row.release_at,
    release_precision: row.release_precision,
    published_at: row.published_at,
    status: row.status,
  };
}

export interface ResultDbRow extends ModelDbRow {
  result_key: string;
  benchmark_name: string;
  benchmark_slug: string;
  benchmark_aliases: string;
  benchmark_version: string;
  reasoning_level: string;
  metric_name: string;
  metric_key: string;
  metric_unit: string;
  storage_kind: MetricSummary["storage_kind"];
  display_precision: number;
  score_value: string | null;
  score_raw: string;
  evaluator_names: string;
  primary_source_url: string;
  reported_at: string;
  reported_precision: DatePrecision;
}

export function resultFromRow(row: ResultDbRow): ResultRow {
  const metric: MetricSummary = {
    name: row.metric_name,
    key: row.metric_key,
    unit: row.metric_unit,
    storage_kind: row.storage_kind,
    display_precision: row.display_precision,
  };
  return {
    result_key: row.result_key,
    model: modelFromRow(row),
    benchmark: {
      name: row.benchmark_name,
      slug: row.benchmark_slug,
      aliases: parseJsonArray(row.benchmark_aliases),
    },
    benchmark_version: row.benchmark_version,
    reasoning_level: row.reasoning_level === "" ? null : row.reasoning_level,
    metric,
    score: {
      raw: row.score_raw,
      value: row.score_value,
      display: formatScore(
        row.score_raw,
        row.score_value,
        row.storage_kind,
        row.display_precision,
        row.metric_unit,
      ),
    },
    evaluator_names: parseJsonArray(row.evaluator_names),
    primary_source_url: row.primary_source_url,
    reported_at: row.reported_at,
    reported_precision: row.reported_precision,
  };
}
