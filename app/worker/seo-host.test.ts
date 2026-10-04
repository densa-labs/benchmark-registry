import { expect, it } from "vitest";
import worker from "./index";
import { CANONICAL_ORIGIN } from "../src/seo-config";
import type { Env } from "./index";
it.each(["https://www.benchmarkregistry.org", "http://benchmarkregistry.org"])("301 redirects %s before any data reads", async origin => {
  const response = await worker.fetch(new Request(`${origin}/models/20015?q=opus`), {} as Env);
  expect(response.status).toBe(301);
  expect(response.headers.get("Location")).toBe(`${CANONICAL_ORIGIN}/models/20015?q=opus`);
});
