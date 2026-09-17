import { describe, expect, it, vi } from "vitest";

import worker, { type Env } from "./index";

interface QueryCall {
  sql: string;
  bindings: unknown[];
}

type QueryResponder = (tag: string, sql: string, bindings: unknown[]) => unknown[];

function tagFor(sql: string): string {
  return /\/\* ([^*]+) \*\//u.exec(sql)?.[1] ?? "untagged";
}

const modelRow = {
  registry_no: "10002",
  model_name: "GPT-4.1",
  company_name: "OpenAI",
  company_slug: "openai",
  release_at: "2025-04-14",
  release_precision: "date",
  published_at: "2026-09-17T00:00:00Z",
  status: "active",
};

const resultRow = {
  ...modelRow,
  result_key: "a".repeat(64),
  benchmark_name: "SWE-bench Verified",
  benchmark_slug: "swe-bench-verified",
  benchmark_version: "2025-02-01",
  reasoning_level: "max",
  metric_name: "Resolved",
  metric_key: "resolved",
  metric_unit: "percent",
  storage_kind: "decimal",
  display_precision: 1,
  score_value: "54.6",
  score_raw: "54.6%",
  evaluator_names: '["OpenAI","SWE-bench"]',
  primary_source_url: "https://example.com/result",
  reported_at: "2025-04-14",
  reported_precision: "date",
};

const versionRow = {
  id: 7,
  benchmark_name: "SWE-bench Verified",
  benchmark_slug: "swe-bench-verified",
  version: "2025-02-01",
  version_slug: "2025-02-01",
  release_at: "2025-02-01",
  release_precision: "date",
  metric_name: "Resolved",
  metric_key: "resolved",
  metric_unit: "percent",
  storage_kind: "decimal",
  display_precision: 1,
  source_url: "https://example.com/benchmark",
  evaluator_names: '["SWE-bench"]',
};

const companyRow = {
  id: 3,
  company_name: "OpenAI",
  company_slug: "openai",
  established_at: "2015-12-11",
  established_precision: "date",
  latest_registry_no: modelRow.registry_no,
  latest_model_name: modelRow.model_name,
  latest_company_name: modelRow.company_name,
  latest_company_slug: modelRow.company_slug,
  latest_release_at: modelRow.release_at,
  latest_release_precision: modelRow.release_precision,
  latest_published_at: modelRow.published_at,
  latest_status: modelRow.status,
};

function defaultResponder(tag: string): unknown[] {
  if (tag.endsWith(":count")) return [{ total: 1 }];
  const responses: Record<string, unknown[]> = {
    "model-page:redirect": [],
    "models:list": [modelRow],
    "model:requested": [{ id: 2 }],
    "model:redirect": [],
    "model:detail": [{ id: 2, ...modelRow, source_url: "https://example.com/model", aliases: '["gpt-4.1-2025-04-14"]' }],
    "model-results:list": [resultRow],
    "benchmarks:list": [{
      benchmark_name: versionRow.benchmark_name,
      benchmark_slug: versionRow.benchmark_slug,
      latest_version: versionRow.version,
      latest_released_at: versionRow.release_at,
      latest_release_precision: versionRow.release_precision,
    }],
    "benchmark:detail": [{
      id: 5,
      benchmark_name: versionRow.benchmark_name,
      benchmark_slug: versionRow.benchmark_slug,
      aliases: '["SWE-bench"]',
    }],
    "benchmark:versions": [versionRow],
    "benchmark-version:detail": [versionRow],
    "benchmark-version-results:list": [resultRow],
    "companies:list": [companyRow],
    "company:detail": [companyRow],
    "company-results:list": [resultRow],
    "search:list": [{
      entity_type: "model",
      canonical_name: modelRow.model_name,
      matched_text: "gpt-4.1-2025-04-14",
      href: `/models/${modelRow.registry_no}`,
    }],
  };
  return responses[tag] ?? [];
}

function createEnv(responder: QueryResponder = (tag) => defaultResponder(tag)) {
  const calls: QueryCall[] = [];
  const db = {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          bindings = values;
          return this;
        },
        async first<T>() {
          calls.push({ sql, bindings });
          return (responder(tagFor(sql), sql, bindings)[0] ?? null) as T | null;
        },
        async all<T>() {
          calls.push({ sql, bindings });
          const results = responder(tagFor(sql), sql, bindings) as T[];
          return { success: true, results, meta: {} };
        },
      };
    },
  };
  const assetFetch = vi.fn().mockResolvedValue(new Response("asset"));
  return {
    env: { ASSETS: { fetch: assetFetch } as unknown as Fetcher, DB: db as unknown as D1Database } satisfies Env,
    calls,
    assetFetch,
  };
}

async function api(path: string, responder?: QueryResponder) {
  const context = createEnv(responder);
  const response = await worker.fetch(new Request(`https://registry.example${path}`), context.env);
  return { ...context, response, body: await response.json() as Record<string, unknown> };
}

describe("read API response contracts", () => {
  it("returns model summaries with pagination", async () => {
    const { response, body } = await api("/api/models");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: [{
        registry_no: "10002",
        name: "GPT-4.1",
        company: { name: "OpenAI", slug: "openai" },
        released_at: "2025-04-14",
        release_precision: "date",
        published_at: "2026-09-17T00:00:00Z",
        status: "active",
      }],
      page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
    });
  });

  it("returns model detail and exact score fields", async () => {
    const { body } = await api("/api/models/10002");
    expect(body).toMatchObject({
      data: {
        model: { registry_no: "10002", source_url: "https://example.com/model", aliases: ["gpt-4.1-2025-04-14"] },
        redirected_from: null,
        results: [{
          reasoning_level: "max",
          score: { raw: "54.6%", value: "54.6", display: "54.6%" },
          evaluator_names: ["OpenAI", "SWE-bench"],
        }],
        result_page: { number: 1, limit: 50, total_items: 1, total_pages: 1 },
      },
    });
  });

  it("returns benchmark family and version payloads", async () => {
    const family = await api("/api/benchmarks/swe-bench-verified");
    expect(family.body).toMatchObject({ data: {
      benchmark: { name: "SWE-bench Verified", slug: "swe-bench-verified", aliases: ["SWE-bench"] },
      versions: [{ version: "2025-02-01", version_slug: "2025-02-01" }],
    } });

    const version = await api("/api/benchmarks/swe-bench-verified/2025-02-01");
    expect(version.body).toMatchObject({ data: {
      version: { benchmark: { slug: "swe-bench-verified" }, metric: { key: "resolved" } },
      evaluator_names: ["SWE-bench"],
      source_url: "https://example.com/benchmark",
      view: "latest",
      company: null,
    } });
  });

  it("returns benchmark and company list payloads", async () => {
    const benchmarks = await api("/api/benchmarks");
    expect(benchmarks.body).toMatchObject({ data: [{
      benchmark: { slug: "swe-bench-verified" },
      latest_version: "2025-02-01",
    }] });
    const companies = await api("/api/companies");
    expect(companies.body).toMatchObject({ data: [{
      name: "OpenAI",
      established_at: "2015-12-11",
      latest_model: { registry_no: "10002" },
    }] });
  });

  it("returns company detail and null absence states", async () => {
    const responder: QueryResponder = (tag) => {
      if (tag === "company:detail") return [{ ...companyRow, established_at: null, established_precision: null, latest_registry_no: null, latest_model_name: null, latest_company_name: null, latest_company_slug: null, latest_release_at: null, latest_release_precision: null, latest_published_at: null, latest_status: null }];
      if (tag.endsWith(":count")) return [{ total: 0 }];
      return [];
    };
    const { body } = await api("/api/companies/openai", responder);
    expect(body).toEqual({ data: {
      company: { name: "OpenAI", slug: "openai", established_at: null, established_precision: null },
      latest_model: null,
      results: [],
      result_page: { number: 1, limit: 50, total_items: 0, total_pages: 0 },
    } });
  });
});

describe("query validation and pagination", () => {
  it.each([50, 100, 500])("accepts the supported limit %i", async (limit) => {
    const { response, body, calls } = await api(`/api/models?limit=${limit}`);
    expect(response.status).toBe(200);
    expect(body.page).toMatchObject({ limit });
    expect(calls.at(-1)?.bindings.at(-2)).toBe(limit);
  });

  it("returns empty out-of-range pages with accurate metadata", async () => {
    const responder: QueryResponder = (tag) => {
      if (tag === "models:count") return [{ total: 51 }];
      if (tag === "models:list") return [];
      return defaultResponder(tag);
    };
    const { body, calls } = await api("/api/models?page=3&limit=50", responder);
    expect(body).toEqual({ data: [], page: { number: 3, limit: 50, total_items: 51, total_pages: 2 } });
    expect(calls.at(-1)?.bindings.slice(-2)).toEqual([50, 100]);
  });

  it.each([
    ["/api/models?limit=10", "invalid_query"],
    ["/api/models?limit=050", "invalid_query"],
    ["/api/models?page=0", "invalid_query"],
    ["/api/models?page=1.5", "invalid_query"],
    ["/api/models?sort=score", "invalid_query"],
    ["/api/models?sort=name&order=sideways", "invalid_query"],
    ["/api/models?order=asc", "invalid_query"],
    ["/api/models?view=latest", "unsupported_parameter"],
    ["/api/models?unknown=yes", "unsupported_parameter"],
    ["/api/models?page=1&page=2", "invalid_query"],
    ["/api/models/10002?view=current", "invalid_query"],
    ["/api/benchmarks/swe-bench-verified?q=swe", "unsupported_parameter"],
  ])("rejects invalid query state on %s", async (path, code) => {
    const { response, body, calls } = await api(path);
    expect(response.status).toBe(400);
    expect(body).toMatchObject({ error: { code } });
    expect(calls).toHaveLength(0);
  });

  it("rejects missing, empty, and overlong global searches", async () => {
    for (const path of ["/api/search", "/api/search?q=%20%20", `/api/search?q=${"é".repeat(26)}`]) {
      const { response, body } = await api(path);
      expect(response.status).toBe(400);
      expect(body).toMatchObject({ error: { code: "invalid_query" } });
    }
  });
});

describe("filtering, sorting, latest/history, and search", () => {
  it("binds normalized searches and canonical company filters", async () => {
    const { calls } = await api("/api/models?q=Stra%C3%9Fe&company=openai");
    expect(calls[0].bindings).toEqual(["openai", "%strasse%", "%strasse%", "%strasse%"]);
    expect(calls[0].sql).toContain("LIKE ?");
    expect(calls[0].sql).not.toContain("strasse");
  });

  it("selects only allow-listed sort SQL and adds a stable tie-breaker", async () => {
    const { calls } = await api("/api/models?sort=company&order=desc");
    expect(calls.at(-1)?.sql).toMatch(/ORDER BY c\.normalized_name DESC, m\.registry_no DESC/u);
  });

  it("uses precision-aware date keys for deterministic default sorting", async () => {
    const { calls } = await api("/api/models");
    expect(calls.at(-1)?.sql).toContain("date_peer.release_precision = 'date'");
    expect(calls.at(-1)?.sql).toMatch(/m\.normalized_name ASC, m\.registry_no ASC/u);
  });

  it("defaults result endpoints to latest and supports history", async () => {
    const latest = await api("/api/benchmarks/swe-bench-verified/2025-02-01");
    expect(latest.calls.find((call) => tagFor(call.sql) === "benchmark-version-results:count")?.sql).toContain("row_number() OVER");

    const history = await api("/api/benchmarks/swe-bench-verified/2025-02-01?view=history");
    expect(history.body).toMatchObject({ data: { view: "history" } });
    expect(history.calls.find((call) => tagFor(call.sql) === "benchmark-version-results:count")?.sql).not.toContain("row_number() OVER");
  });

  it("binds benchmark-version company filters", async () => {
    const { body, calls } = await api("/api/benchmarks/swe-bench-verified/2025-02-01?company=openai");
    expect(body).toMatchObject({ data: { company: "openai" } });
    const count = calls.find((call) => tagFor(call.sql) === "benchmark-version-results:count");
    expect(count?.bindings).toEqual([7, "openai"]);
  });

  it("returns one global search candidate per entity and paginates it", async () => {
    const { body, calls } = await api("/api/search?q=%20GPT-4.1%20&page=2&limit=100");
    expect(body).toMatchObject({
      data: [{ entity_type: "model", canonical_name: "GPT-4.1", href: "/models/10002" }],
      page: { number: 2, limit: 100 },
    });
    expect(calls.at(-1)?.bindings.slice(-3)).toEqual(["gpt-4.1", 100, 100]);
    expect(calls.at(-1)?.sql).toContain("CROSS JOIN input");
    expect(calls.at(-1)?.sql.match(/UNION ALL/gu)).toHaveLength(2);
  });
});

describe("redirects, missing records, and failure isolation", () => {
  it("resolves Registry redirects in API detail without issuing HTTP redirects", async () => {
    const responder: QueryResponder = (tag) => {
      if (tag === "model:requested") return [{ id: 1 }];
      if (tag === "model:redirect") return [{ target_id: 2, redirected_from: "00001" }];
      return defaultResponder(tag);
    };
    const { response, body, calls } = await api("/api/models/00001", responder);
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ data: { model: { registry_no: "10002" }, redirected_from: "00001" } });
    expect(calls.find((call) => tagFor(call.sql) === "model:detail")?.bindings).toEqual([2]);
  });

  it("permanently redirects a stealth model page and preserves query state", async () => {
    const responder: QueryResponder = (tag) => {
      if (tag === "model-page:redirect") return [{ registry_no: "10002" }];
      return defaultResponder(tag);
    };
    const { env, assetFetch } = createEnv(responder);
    const response = await worker.fetch(
      new Request("https://registry.example/models/00001?view=history"),
      env,
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://registry.example/models/10002?view=history",
    );
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it.each([
    ["/api/models/99999", "model:requested"],
    ["/api/benchmarks/missing", "benchmark:detail"],
    ["/api/benchmarks/swe/missing", "benchmark-version:detail"],
    ["/api/companies/missing", "company:detail"],
  ])("returns the stable not-found error for %s", async (path, missingTag) => {
    const responder: QueryResponder = (tag) => tag === missingTag ? [] : defaultResponder(tag);
    const { response, body } = await api(path, responder);
    expect(response.status).toBe(404);
    expect(body).toMatchObject({ error: { code: "not_found" } });
  });

  it("returns a stable internal error without leaking database details", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { response, body } = await api("/api/models", () => { throw new Error("SQL secret_table token=abc"); });
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: { code: "internal_error", message: "The request could not be completed." } });
    expect(JSON.stringify(body)).not.toContain("secret_table");
    consoleError.mockRestore();
  });

  it("keeps unknown API routes and methods out of the asset fallback", async () => {
    const { env, assetFetch } = createEnv();
    for (const request of [
      new Request("https://registry.example/api/nope"),
      new Request("https://registry.example/api/models", { method: "POST" }),
    ]) {
      const response = await worker.fetch(request, env);
      expect(response.status).toBe(404);
    }
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it("serves frontend requests from the static asset binding", async () => {
    const { env, assetFetch } = createEnv();
    const request = new Request("https://registry.example/models");
    const response = await worker.fetch(request, env);
    expect(await response.text()).toBe("asset");
    expect(assetFetch).toHaveBeenCalledWith(request);
  });
});
