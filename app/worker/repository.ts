import {
  ApiError,
  type BenchmarkVersionSummary,
  type CompanyDatePrecision,
  type DatePrecision,
  type MetricSummary,
  type ModelDbRow,
  type ModelSummary,
  pageMetadata,
  parseJsonArray,
  type ResultDbRow,
  resultFromRow,
  modelFromRow,
} from "./api";
import { interpretSearch, orderSearch, type SearchEntity } from "./search";
import { likePattern, type ParsedListParams, type SortOrder } from "./params";

type BindValue = string | number | null;

interface CountRow {
  total: number;
}

interface IdRow {
  id: number;
}

interface ModelDetailRow extends ModelDbRow {
  id: number;
  source_url: string;
  aliases: string;
}

interface BenchmarkListRow {
  benchmark_name: string;
  benchmark_slug: string;
  benchmark_aliases: string;
  latest_version: string;
  latest_released_at: string;
  latest_release_precision: DatePrecision;
}

interface BenchmarkFamilyRow {
  id: number;
  benchmark_name: string;
  benchmark_slug: string;
  aliases: string;
}

interface BenchmarkVersionRow {
  id: number;
  benchmark_name: string;
  benchmark_slug: string;
  benchmark_aliases: string;
  version: string;
  version_slug: string;
  release_at: string;
  release_precision: DatePrecision;
  metric_name: string;
  metric_key: string;
  metric_unit: string;
  storage_kind: MetricSummary["storage_kind"];
  display_precision: number;
  source_url: string;
  evaluator_names: string;
}

interface CompanyListRow {
  id: number;
  company_name: string;
  company_slug: string;
  established_at: string | null;
  established_precision: CompanyDatePrecision | null;
  entity_kind: "company" | "ai_unit";
  established_basis: "source" | "user_attested";
  latest_registry_no: string | null;
  latest_model_name: string | null;
  latest_company_name: string | null;
  latest_company_slug: string | null;
  latest_release_at: string | null;
  latest_release_precision: DatePrecision | null;
  latest_published_at: string | null;
  latest_status: ModelSummary["status"] | null;
}

interface SearchCatalogueRow extends Omit<SearchEntity, "aliases" | "normalized_aliases" | "versions"> {
  aliases: string;
  registry_alias: string;
  versions: string;
}
interface SearchRelationshipRow {
  model_id: number;
  benchmark_id: number;
  version_id: number;
  version: string;
  version_slug: string;
  reasoning_level: string;
  result_key: string;
}

const MODEL_COLUMNS = `
  m.registry_no,
  m.canonical_name AS model_name,
  c.name AS company_name,
  c.slug AS company_slug,
  m.release_at,
  m.release_precision,
  m.published_at,
  m.status`;

const BENCHMARK_ALIASES = `COALESCE((
  SELECT json_group_array(alias.name) FROM (
    SELECT ba.name FROM benchmark_aliases ba
    WHERE ba.benchmark_id = b.id ORDER BY ba.normalized_name, ba.id
  ) alias
), '[]')`;

const RESULT_COLUMNS = `
  r.result_key,
  ${MODEL_COLUMNS},
  b.canonical_name AS benchmark_name,
  b.slug AS benchmark_slug,
  ${BENCHMARK_ALIASES} AS benchmark_aliases,
  bv.version AS benchmark_version,
  r.reasoning_level,
  metric.name AS metric_name,
  metric.key AS metric_key,
  metric.unit AS metric_unit,
  metric.storage_kind,
  metric.display_precision,
  r.score_value,
  r.score_raw,
  COALESCE((
    SELECT json_group_array(evaluator.name)
    FROM (
      SELECT eo.name
      FROM result_evaluators re
      JOIN evaluator_organizations eo ON eo.id = re.evaluator_organization_id
      WHERE re.result_id = r.id
      ORDER BY eo.normalized_name, eo.id
    ) evaluator
  ), '[]') AS evaluator_names,
  r.primary_source_url,
  r.reported_at,
  r.reported_precision`;

const RESULT_JOINS = `
  FROM results r
  JOIN models m ON m.id = r.model_id
  JOIN companies c ON c.id = m.company_id
  JOIN benchmark_versions bv ON bv.id = r.benchmark_version_id
  JOIN benchmarks b ON b.id = bv.benchmark_id
  JOIN metrics metric ON metric.id = r.metric_id`;

const MODEL_RELEASE_KEY = `CASE
  WHEN m.release_precision = 'date' OR EXISTS (
    SELECT 1 FROM models date_peer
    WHERE substr(date_peer.release_at, 1, 10) = substr(m.release_at, 1, 10)
      AND date_peer.release_precision = 'date'
  ) THEN substr(m.release_at, 1, 10)
  ELSE m.release_at
END`;

const RESULT_REPORTED_KEY = `CASE
  WHEN r.reported_precision = 'date' OR EXISTS (
    SELECT 1 FROM results date_peer
    WHERE substr(date_peer.reported_at, 1, 10) = substr(r.reported_at, 1, 10)
      AND date_peer.reported_precision = 'date'
  ) THEN substr(r.reported_at, 1, 10)
  ELSE r.reported_at
END`;

const LATEST_RESULT_PREDICATE = `r.id IN (
  SELECT ranked.id FROM (
    SELECT candidate.id,
      row_number() OVER (
        PARTITION BY candidate.model_id, candidate.reasoning_level,
          candidate.benchmark_version_id, candidate.metric_id,
          candidate.evaluator_set_key
        ORDER BY
          CASE
            WHEN candidate.reported_precision = 'date' OR EXISTS (
              SELECT 1 FROM results date_peer
              WHERE date_peer.model_id = candidate.model_id
                AND date_peer.reasoning_level = candidate.reasoning_level
                AND date_peer.benchmark_version_id = candidate.benchmark_version_id
                AND date_peer.metric_id = candidate.metric_id
                AND date_peer.evaluator_set_key = candidate.evaluator_set_key
                AND substr(date_peer.reported_at, 1, 10) = substr(candidate.reported_at, 1, 10)
                AND date_peer.reported_precision = 'date'
            ) THEN substr(candidate.reported_at, 1, 10)
            ELSE candidate.reported_at
          END DESC,
          candidate.result_key ASC
      ) AS position
    FROM results candidate
  ) ranked
  WHERE ranked.position = 1
)`;

const BENCHMARK_VERSION_KEY = `CASE
  WHEN bv.release_precision = 'date' OR EXISTS (
    SELECT 1 FROM benchmark_versions date_peer
    WHERE date_peer.benchmark_id = bv.benchmark_id
      AND substr(date_peer.release_at, 1, 10) = substr(bv.release_at, 1, 10)
      AND date_peer.release_precision = 'date'
  ) THEN substr(bv.release_at, 1, 10)
  ELSE bv.release_at
END`;

const COMPANY_ESTABLISHED_KEY = `CASE
  WHEN c.established_at IS NULL THEN NULL
  WHEN c.established_precision = 'year' OR EXISTS (
    SELECT 1 FROM companies year_peer
    WHERE substr(year_peer.established_at, 1, 4) = substr(c.established_at, 1, 4)
      AND year_peer.established_precision = 'year'
  ) THEN substr(c.established_at, 1, 4)
  WHEN c.established_precision = 'date' OR EXISTS (
    SELECT 1 FROM companies date_peer
    WHERE substr(date_peer.established_at, 1, 10) = substr(c.established_at, 1, 10)
      AND date_peer.established_precision = 'date'
  ) THEN substr(c.established_at, 1, 10)
  ELSE c.established_at
END`;

function direction(order: SortOrder | undefined): "ASC" | "DESC" {
  return order === "desc" ? "DESC" : "ASC";
}

function modelOrder(params: ParsedListParams): string {
  const order = direction(params.order);
  const sorts: Record<string, string> = {
    name: `m.normalized_name ${order}, m.registry_no ${order}`,
    released: `${MODEL_RELEASE_KEY} ${order}, m.registry_no ${order}`,
    published: `m.published_at ${order}, m.registry_no ASC`,
    company: `c.normalized_name ${order}, m.registry_no ${order}`,
    registry_no: `m.registry_no ${order}`,
  };
  return params.sort === undefined
    ? `${MODEL_RELEASE_KEY} DESC, m.normalized_name ASC, m.registry_no ASC`
    : sorts[params.sort];
}

function resultOrder(params: ParsedListParams): string {
  const order = direction(params.order);
  const sorts: Record<string, string> = {
    benchmark: `b.normalized_name ${order}, r.result_key ${order}`,
    model: `m.normalized_name ${order}, r.result_key ${order}`,
    company: `c.normalized_name ${order}, r.result_key ${order}`,
    source: `r.primary_source_normalized_url ${order}, r.result_key ${order}`,
    registry_no: `m.registry_no ${order}, r.result_key ${order}`,
    reported_at: `${RESULT_REPORTED_KEY} ${order}, r.result_key ${order}`,
  };
  return params.sort === undefined
    ? `${RESULT_REPORTED_KEY} DESC, m.registry_no ASC, r.result_key ASC`
    : sorts[params.sort];
}

function resultFilters(
  params: ParsedListParams,
  scopeSql: string,
  scopeBindings: BindValue[],
  searchKind: "benchmarks" | "models" | "both",
): { sql: string; bindings: BindValue[] } {
  const clauses = [scopeSql];
  const bindings = [...scopeBindings];
  if ((params.view ?? "latest") === "latest") clauses.push(LATEST_RESULT_PREDICATE);
  if (params.result !== undefined) {
    clauses.push("r.result_key = ?");
    bindings.push(params.result);
  }
  if (params.company !== undefined) {
    clauses.push("c.slug = ?");
    bindings.push(params.company);
  }
  if (params.q !== undefined) {
    // Literal substring matching also supports valid 49–50 byte names without
    // exceeding D1's 50 byte LIKE-pattern limit after adding wildcard characters.
    const benchmarkMatch = `(instr(b.normalized_name, ?) > 0 OR EXISTS (
      SELECT 1 FROM benchmark_aliases ba
      WHERE ba.benchmark_id = b.id AND instr(ba.normalized_name, ?) > 0
    ))`;
    const modelMatch = `(instr(m.normalized_name, ?) > 0 OR instr(m.registry_no, ?) > 0 OR EXISTS (
      SELECT 1 FROM model_aliases ma
      WHERE ma.model_id = m.id AND instr(ma.normalized_name, ?) > 0
    ))`;
    if (searchKind === "benchmarks") {
      clauses.push(benchmarkMatch);
      bindings.push(params.q, params.q);
    } else if (searchKind === "models") {
      clauses.push(modelMatch);
      bindings.push(params.q, params.q, params.q);
    } else {
      clauses.push(`(${benchmarkMatch} OR ${modelMatch})`);
      bindings.push(params.q, params.q, params.q, params.q, params.q);
    }
  }
  return { sql: clauses.join(" AND "), bindings };
}

function metricFromVersion(row: BenchmarkVersionRow): MetricSummary {
  return {
    name: row.metric_name,
    key: row.metric_key,
    unit: row.metric_unit,
    storage_kind: row.storage_kind,
    display_precision: row.display_precision,
  };
}

function versionFromRow(row: BenchmarkVersionRow): BenchmarkVersionSummary {
  return {
    benchmark: {
      name: row.benchmark_name,
      slug: row.benchmark_slug,
      aliases: parseJsonArray(row.benchmark_aliases),
    },
    version: row.version,
    version_slug: row.version_slug,
    released_at: row.release_at,
    release_precision: row.release_precision,
    metric: metricFromVersion(row),
  };
}

function latestModelFromCompany(row: CompanyListRow): ModelSummary | null {
  if (
    row.latest_registry_no === null ||
    row.latest_model_name === null ||
    row.latest_company_name === null ||
    row.latest_company_slug === null ||
    row.latest_release_at === null ||
    row.latest_release_precision === null ||
    row.latest_published_at === null ||
    row.latest_status === null
  ) return null;
  return {
    registry_no: row.latest_registry_no,
    name: row.latest_model_name,
    company: { name: row.latest_company_name, slug: row.latest_company_slug },
    released_at: row.latest_release_at,
    release_precision: row.latest_release_precision,
    published_at: row.latest_published_at,
    status: row.latest_status,
  };
}

export class RegistryRepository {
  constructor(private readonly db: D1Database) {}

  async modelRedirectTarget(registryNo: string): Promise<string | null> {
    const row = await this.first<{ registry_no: string }>(
      `/* model-page:redirect */ SELECT target.registry_no
       FROM registry_redirects rr
       JOIN models source ON source.id = rr.source_model_id
       JOIN models target ON target.id = rr.target_model_id
       WHERE source.registry_no = ?`,
      [registryNo],
    );
    return row?.registry_no ?? null;
  }

  private async all<T>(sql: string, bindings: BindValue[] = []): Promise<T[]> {
    const result = await this.db.prepare(sql).bind(...bindings).all<T>();
    return result.results;
  }

  private async first<T>(sql: string, bindings: BindValue[] = []): Promise<T | null> {
    return this.db.prepare(sql).bind(...bindings).first<T>();
  }

  private async count(sql: string, bindings: BindValue[]): Promise<number> {
    const row = await this.first<CountRow>(sql, bindings);
    if (row === null) throw new Error("Count query returned no row.");
    return Number(row.total);
  }

  async stats() {
    const row = await this.first<{
      benchmark_results: number;
      models: number;
      benchmarks: number;
      versions: number;
    }>(`/* registry:stats */ SELECT
      (SELECT count(*) FROM results) AS benchmark_results,
      (SELECT count(*) FROM models) AS models,
      (SELECT count(*) FROM benchmarks) AS benchmarks,
      (SELECT count(*) FROM benchmark_versions) AS versions`);
    if (row === null) throw new Error("Registry statistics query returned no row.");
    return { data: row };
  }

  async models(params: ParsedListParams) {
    const clauses: string[] = [];
    const bindings: BindValue[] = [];
    if (params.company !== undefined) {
      clauses.push("c.slug = ?");
      bindings.push(params.company);
    }
    if (params.q !== undefined) {
      const pattern = likePattern(params.q);
      clauses.push(`(m.normalized_name LIKE ? ESCAPE '\\' OR m.registry_no LIKE ? ESCAPE '\\' OR EXISTS (
        SELECT 1 FROM model_aliases ma
        WHERE ma.model_id = m.id AND ma.normalized_name LIKE ? ESCAPE '\\'
      ))`);
      bindings.push(pattern, pattern, pattern);
    }
    const where = clauses.length === 0 ? "" : `WHERE ${clauses.join(" AND ")}`;
    const total = await this.count(
      `/* models:count */ SELECT count(*) AS total FROM models m JOIN companies c ON c.id = m.company_id ${where}`,
      bindings,
    );
    const rows = await this.all<ModelDbRow>(
      `/* models:list */ SELECT ${MODEL_COLUMNS}
       FROM models m JOIN companies c ON c.id = m.company_id
       ${where}
       ORDER BY ${modelOrder(params)}
       LIMIT ? OFFSET ?`,
      [...bindings, params.limit, (params.page - 1) * params.limit],
    );
    return { data: rows.map(modelFromRow), page: pageMetadata(params.page, params.limit, total) };
  }

  async model(registryNo: string, params: ParsedListParams) {
    const requested = await this.first<IdRow>(
      "/* model:requested */ SELECT id FROM models WHERE registry_no = ?",
      [registryNo],
    );
    if (requested === null) throw new ApiError(404, "not_found", "Model not found.");
    const redirect = await this.first<{ target_id: number; redirected_from: string }>(
      `/* model:redirect */ SELECT rr.target_model_id AS target_id, source.registry_no AS redirected_from
       FROM registry_redirects rr
       JOIN models source ON source.id = rr.source_model_id
       WHERE rr.source_model_id = ?`,
      [requested.id],
    );
    const targetId = redirect?.target_id ?? requested.id;
    const row = await this.first<ModelDetailRow>(
      `/* model:detail */ SELECT m.id, ${MODEL_COLUMNS}, m.release_source_url AS source_url,
        COALESCE((
          SELECT json_group_array(alias.name) FROM (
            SELECT ma.name FROM model_aliases ma
            WHERE ma.model_id = m.id ORDER BY ma.normalized_name, ma.id
          ) alias
        ), '[]') AS aliases
       FROM models m JOIN companies c ON c.id = m.company_id WHERE m.id = ?`,
      [targetId],
    );
    if (row === null) throw new Error("Redirect target is missing.");
    const filters = resultFilters(params, "r.model_id = ?", [targetId], "benchmarks");
    const total = await this.count(
      `/* model-results:count */ SELECT count(*) AS total ${RESULT_JOINS} WHERE ${filters.sql}`,
      filters.bindings,
    );
    const results = await this.all<ResultDbRow>(
      `/* model-results:list */ SELECT ${RESULT_COLUMNS} ${RESULT_JOINS}
       WHERE ${filters.sql} ORDER BY ${resultOrder(params)} LIMIT ? OFFSET ?`,
      [...filters.bindings, params.limit, (params.page - 1) * params.limit],
    );
    return {
      data: {
        model: { ...modelFromRow(row), source_url: row.source_url, aliases: parseJsonArray(row.aliases) },
        redirected_from: redirect?.redirected_from ?? null,
        results: results.map(resultFromRow),
        result_page: pageMetadata(params.page, params.limit, total),
      },
    };
  }

  async benchmarks(params: ParsedListParams) {
    const bindings: BindValue[] = [];
    let where = "";
    if (params.q !== undefined) {
      where = `WHERE instr(b.normalized_name, ?) > 0 OR EXISTS (
        SELECT 1 FROM benchmark_aliases ba
        WHERE ba.benchmark_id = b.id AND instr(ba.normalized_name, ?) > 0
      )`;
      bindings.push(params.q, params.q);
    }
    const total = await this.count(
      `/* benchmarks:count */ SELECT count(*) AS total FROM benchmarks b ${where}`,
      bindings,
    );
    const order = direction(params.order);
    const explicit: Record<string, string> = {
      name: `normalized_name ${order}, benchmark_slug ${order}`,
      released: `latest_release_key ${order}, benchmark_slug ${order}`,
      version: `latest_version ${order}, benchmark_slug ${order}`,
    };
    const orderBy = params.sort === undefined
      ? "normalized_name ASC, benchmark_slug ASC"
      : explicit[params.sort];
    const rows = await this.all<BenchmarkListRow>(
      `/* benchmarks:list */ WITH ranked_versions AS (
        SELECT bv.*,
          ${BENCHMARK_VERSION_KEY} AS release_key,
          row_number() OVER (
            PARTITION BY bv.benchmark_id
            ORDER BY ${BENCHMARK_VERSION_KEY} DESC, bv.version ASC, bv.id ASC
          ) AS position
        FROM benchmark_versions bv
      )
      SELECT b.canonical_name AS benchmark_name, b.slug AS benchmark_slug,
        ${BENCHMARK_ALIASES} AS benchmark_aliases,
        b.normalized_name, rv.version AS latest_version,
        rv.release_at AS latest_released_at,
        rv.release_precision AS latest_release_precision,
        rv.release_key AS latest_release_key
      FROM benchmarks b
      JOIN ranked_versions rv ON rv.benchmark_id = b.id AND rv.position = 1
      ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      [...bindings, params.limit, (params.page - 1) * params.limit],
    );
    return {
      data: rows.map((row) => ({
        benchmark: {
          name: row.benchmark_name,
          slug: row.benchmark_slug,
          aliases: parseJsonArray(row.benchmark_aliases),
        },
        latest_version: row.latest_version,
        latest_released_at: row.latest_released_at,
        latest_release_precision: row.latest_release_precision,
      })),
      page: pageMetadata(params.page, params.limit, total),
    };
  }

  async benchmark(slug: string) {
    const benchmark = await this.first<BenchmarkFamilyRow>(
      `/* benchmark:detail */ SELECT b.id, b.canonical_name AS benchmark_name,
        b.slug AS benchmark_slug,
        ${BENCHMARK_ALIASES} AS aliases
       FROM benchmarks b WHERE b.slug = ?`,
      [slug],
    );
    if (benchmark === null) throw new ApiError(404, "not_found", "Benchmark not found.");
    const versions = await this.all<BenchmarkVersionRow>(
      `/* benchmark:versions */ SELECT bv.id, b.canonical_name AS benchmark_name,
        b.slug AS benchmark_slug, ${BENCHMARK_ALIASES} AS benchmark_aliases,
        bv.version, bv.version_slug, bv.release_at,
        bv.release_precision, metric.name AS metric_name, metric.key AS metric_key,
        metric.unit AS metric_unit, metric.storage_kind, metric.display_precision,
        bv.source_url, '[]' AS evaluator_names
       FROM benchmark_versions bv
       JOIN benchmarks b ON b.id = bv.benchmark_id
       JOIN metrics metric ON metric.id = bv.metric_id
       WHERE bv.benchmark_id = ?
       ORDER BY ${BENCHMARK_VERSION_KEY} DESC, bv.version ASC, bv.id ASC`,
      [benchmark.id],
    );
    return {
      data: {
        benchmark: {
          name: benchmark.benchmark_name,
          slug: benchmark.benchmark_slug,
          aliases: parseJsonArray(benchmark.aliases),
        },
        versions: versions.map(versionFromRow),
      },
    };
  }

  async benchmarkVersion(slug: string, versionSlug: string, params: ParsedListParams) {
    const version = await this.first<BenchmarkVersionRow>(
      `/* benchmark-version:detail */ SELECT bv.id,
        b.canonical_name AS benchmark_name, b.slug AS benchmark_slug,
        ${BENCHMARK_ALIASES} AS benchmark_aliases,
        bv.version, bv.version_slug, bv.release_at, bv.release_precision,
        metric.name AS metric_name, metric.key AS metric_key,
        metric.unit AS metric_unit, metric.storage_kind, metric.display_precision,
        bv.source_url,
        COALESCE((
          SELECT json_group_array(evaluator.name) FROM (
            SELECT eo.name
            FROM benchmark_version_evaluators bve
            JOIN evaluator_organizations eo ON eo.id = bve.evaluator_organization_id
            WHERE bve.benchmark_version_id = bv.id
            ORDER BY eo.normalized_name, eo.id
          ) evaluator
        ), '[]') AS evaluator_names
       FROM benchmark_versions bv
       JOIN benchmarks b ON b.id = bv.benchmark_id
       JOIN metrics metric ON metric.id = bv.metric_id
       WHERE b.slug = ? AND bv.version_slug = ?`,
      [slug, versionSlug],
    );
    if (version === null) throw new ApiError(404, "not_found", "Benchmark version not found.");
    const filters = resultFilters(params, "r.benchmark_version_id = ?", [version.id], "models");
    const total = await this.count(
      `/* benchmark-version-results:count */ SELECT count(*) AS total ${RESULT_JOINS} WHERE ${filters.sql}`,
      filters.bindings,
    );
    const results = await this.all<ResultDbRow>(
      `/* benchmark-version-results:list */ SELECT ${RESULT_COLUMNS} ${RESULT_JOINS}
       WHERE ${filters.sql} ORDER BY ${resultOrder(params)} LIMIT ? OFFSET ?`,
      [...filters.bindings, params.limit, (params.page - 1) * params.limit],
    );
    return {
      data: {
        version: versionFromRow(version),
        evaluator_names: parseJsonArray(version.evaluator_names),
        source_url: version.source_url,
        view: params.view ?? "latest",
        company: params.company ?? null,
        results: results.map(resultFromRow),
        result_page: pageMetadata(params.page, params.limit, total),
      },
    };
  }

  private latestModelsCte(): string {
    return `eligible_models AS (
      SELECT m.*,
        CASE
          WHEN m.release_precision = 'date' OR EXISTS (
            SELECT 1 FROM models date_peer
            WHERE date_peer.company_id = m.company_id
              AND substr(date_peer.release_at, 1, 10) = substr(m.release_at, 1, 10)
              AND date_peer.release_precision = 'date'
              AND NOT EXISTS (
                SELECT 1 FROM registry_redirects redirect_peer
                WHERE redirect_peer.source_model_id = date_peer.id
              )
          ) THEN substr(m.release_at, 1, 10)
          ELSE m.release_at
        END AS release_key
      FROM models m
      WHERE NOT EXISTS (
        SELECT 1 FROM registry_redirects redirect WHERE redirect.source_model_id = m.id
      )
    ), latest_models AS (
      SELECT eligible_models.*,
        row_number() OVER (
          PARTITION BY company_id
          ORDER BY release_key DESC, normalized_name ASC, id ASC
        ) AS position
      FROM eligible_models
    )`;
  }

  async companies(params: ParsedListParams) {
    const bindings: BindValue[] = [];
    let where = "";
    if (params.q !== undefined) {
      where = "WHERE c.normalized_name LIKE ? ESCAPE '\\'";
      bindings.push(likePattern(params.q));
    }
    const total = await this.count(
      `/* companies:count */ SELECT count(*) AS total FROM companies c ${where}`,
      bindings,
    );
    const order = direction(params.order);
    const explicit: Record<string, string> = {
      name: `c.normalized_name ${order}, c.slug ${order}`,
      established: `${COMPANY_ESTABLISHED_KEY} ${order}, c.slug ${order}`,
      latest_model: `lm.normalized_name ${order}, c.slug ${order}`,
    };
    const orderBy = params.sort === undefined
      ? "c.normalized_name ASC, c.slug ASC"
      : explicit[params.sort];
    const rows = await this.all<CompanyListRow>(
      `/* companies:list */ WITH ${this.latestModelsCte()}
       SELECT c.id, c.name AS company_name, c.slug AS company_slug,
        c.established_at, c.established_precision, c.provider_kind AS entity_kind,
        c.established_basis,
        lm.registry_no AS latest_registry_no,
        lm.canonical_name AS latest_model_name,
        c.name AS latest_company_name,
        c.slug AS latest_company_slug,
        lm.release_at AS latest_release_at,
        lm.release_precision AS latest_release_precision,
        lm.published_at AS latest_published_at,
        lm.status AS latest_status
       FROM companies c
       LEFT JOIN latest_models lm ON lm.company_id = c.id AND lm.position = 1
       ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...bindings, params.limit, (params.page - 1) * params.limit],
    );
    return {
      data: rows.map((row) => ({
        name: row.company_name,
        slug: row.company_slug,
        established_at: row.established_at,
        established_precision: row.established_precision,
        entity_kind: row.entity_kind ?? "company",
        established_basis: row.established_basis ?? "source",
        latest_model: latestModelFromCompany(row),
      })),
      page: pageMetadata(params.page, params.limit, total),
    };
  }

  async company(slug: string, params: ParsedListParams) {
    const row = await this.first<CompanyListRow>(
      `/* company:detail */ WITH ${this.latestModelsCte()}
       SELECT c.id, c.name AS company_name, c.slug AS company_slug,
        c.established_at, c.established_precision, c.provider_kind AS entity_kind,
        c.established_basis,
        lm.registry_no AS latest_registry_no,
        lm.canonical_name AS latest_model_name,
        c.name AS latest_company_name,
        c.slug AS latest_company_slug,
        lm.release_at AS latest_release_at,
        lm.release_precision AS latest_release_precision,
        lm.published_at AS latest_published_at,
        lm.status AS latest_status
       FROM companies c
       LEFT JOIN latest_models lm ON lm.company_id = c.id AND lm.position = 1
       WHERE c.slug = ?`,
      [slug],
    );
    if (row === null) throw new ApiError(404, "not_found", "Company not found.");
    const filters = resultFilters(params, "m.company_id = ?", [row.id], "both");
    const total = await this.count(
      `/* company-results:count */ SELECT count(*) AS total ${RESULT_JOINS} WHERE ${filters.sql}`,
      filters.bindings,
    );
    const results = await this.all<ResultDbRow>(
      `/* company-results:list */ SELECT ${RESULT_COLUMNS} ${RESULT_JOINS}
       WHERE ${filters.sql} ORDER BY ${resultOrder(params)} LIMIT ? OFFSET ?`,
      [...filters.bindings, params.limit, (params.page - 1) * params.limit],
    );
    return {
      data: {
        company: {
          name: row.company_name,
          slug: row.company_slug,
          established_at: row.established_at,
          established_precision: row.established_precision,
          entity_kind: row.entity_kind ?? "company",
          established_basis: row.established_basis ?? "source",
        },
        latest_model: latestModelFromCompany(row),
        results: results.map(resultFromRow),
        result_page: pageMetadata(params.page, params.limit, total),
      },
    };
  }

  async search(params: ParsedListParams) {
    // Only names/aliases/version identities leave D1. Matching stays in the
    // Worker; no catalogue is sent to the browser and no per-token SQL occurs.
    const rows = await this.all<SearchCatalogueRow>(`/* search:catalogue */
      SELECT 'model' AS entity_type, m.id, m.canonical_name, m.normalized_name,
        '/models/' || m.registry_no AS href,
        json_array(m.registry_no) AS registry_alias,
        COALESCE((SELECT json_group_array(json_object('name', name, 'normalized_name', normalized_name)) FROM (
          SELECT name, normalized_name FROM model_aliases WHERE model_id = m.id ORDER BY normalized_name
        )), '[]') AS aliases, '[]' AS versions
      FROM models m
      UNION ALL
      SELECT 'benchmark', b.id, b.canonical_name, b.normalized_name,
        '/benchmarks/' || b.slug, '[]',
        COALESCE((SELECT json_group_array(json_object('name', name, 'normalized_name', normalized_name))
          FROM (SELECT name, normalized_name FROM benchmark_aliases WHERE benchmark_id = b.id ORDER BY normalized_name)), '[]'),
        COALESCE((SELECT json_group_array(json_object('id', id, 'version', version, 'version_slug', version_slug))
          FROM (SELECT id, version, version_slug FROM benchmark_versions WHERE benchmark_id = b.id ORDER BY version_slug)), '[]')
      FROM benchmarks b
      UNION ALL
      SELECT 'company', c.id, c.name, c.normalized_name,
        '/companies/' || c.slug, '[]', '[]', '[]' FROM companies c`, []);
    const entities = rows.map((row) => {
      const aliases = JSON.parse(row.aliases) as { name: string; normalized_name: string }[];
      const registryAliases = parseJsonArray(row.registry_alias);
      return { ...row,
        aliases: [...aliases.map((alias) => alias.name), ...registryAliases],
        normalized_aliases: [...aliases.map((alias) => alias.normalized_name), ...registryAliases],
        versions: JSON.parse(row.versions) as SearchEntity["versions"],
      };
    });
    const { ranked, interpretations } = interpretSearch(params.q!, entities);
    let directHref: string | undefined;
    if (interpretations.length) {
      const relationships = await this.all<SearchRelationshipRow>(`/* search:relationships */
        SELECT r.model_id, bv.benchmark_id, bv.id AS version_id,
          bv.version, bv.version_slug, r.reasoning_level, r.result_key
        FROM results r JOIN benchmark_versions bv ON bv.id = r.benchmark_version_id
        WHERE r.model_id IN (SELECT value FROM json_each(?))
          AND bv.benchmark_id IN (SELECT value FROM json_each(?))
        ORDER BY r.result_key`, [
        JSON.stringify([...new Set(interpretations.map((i) => i.model.id))]),
        JSON.stringify([...new Set(interpretations.map((i) => i.benchmark.id))]),
      ]);
      const connected = relationships.flatMap((row) => {
        const intent = interpretations.find((i) => i.model.id === row.model_id
          && i.benchmark.id === row.benchmark_id && (i.versionId === undefined || i.versionId === row.version_id));
        if (!intent) return [];
        const href = `${intent.benchmark.href}/${row.version_slug}?view=history&result=${row.result_key}`;
        return [{ hit: {
          entity_type: "result" as const,
          canonical_name: `${intent.model.canonical_name} × ${intent.benchmark.canonical_name} ${row.version}`,
          matched_text: row.reasoning_level ? `Reasoning: ${row.reasoning_level}` : "Evaluation result",
          href,
        }, rank: intent.high ? 3 : 5 }];
      });
      ranked.push(...connected);
      if (interpretations.length === 1 && interpretations[0].high && connected.length === 1
        && !ranked.some((entry) => entry.rank < 3)) directHref = connected[0].hit.href;
    }
    const hits = orderSearch(ranked);
    return {
      data: hits.slice((params.page - 1) * params.limit, params.page * params.limit),
      page: pageMetadata(params.page, params.limit, hits.length),
      ...(params.page === 1 && directHref ? { direct_href: directHref } : {}),
    };
  }
}
