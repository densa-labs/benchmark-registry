import { expect, it, vi } from "vitest";
import template from "../index.html?raw";
import worker, { type Env } from "./index";

it("serves an accessible uncached failure document without a public D1 fallback", async () => {
  const prepare = vi.fn(() => { throw new Error("Public D1 is forbidden"); });
  const env = { DB: { prepare }, READ_ENVIRONMENT: "local", READ_STORE: { get: async () => null }, ASSETS: { fetch: async () => new Response(template, { headers: { "Content-Type": "text/html" } }) } } as unknown as Env;
  for (const method of ["GET", "HEAD"]) {
    const response = await worker.fetch(new Request("https://benchmarkregistry.org/models/10001", { method }), env);
    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-registry-d1-rows")).toBe("0");
    const body = await response.text();
    if (method === "HEAD") expect(body).toBe("");
    else {
      expect(body.match(/<h1\b/gu)).toHaveLength(1);
      expect(body).toContain("Unable to load registry data");
      expect(body).toContain('id="main-content" tabindex="-1"');
      expect(body).toContain('aria-label="Primary navigation"');
      expect(body).toContain('name="robots" content="noindex, follow"');
      expect(body).not.toContain('rel="canonical"');
      expect(body).toContain('"failure":');
    }
  }
  const response = await worker.fetch(new Request("https://benchmarkregistry.org/api/models"), env);
  expect(response.status).toBe(500);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(prepare).not.toHaveBeenCalled();
});
