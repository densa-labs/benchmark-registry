import { describe, expect, it, vi } from "vitest";

import worker, { type Env } from "./index";

function createEnv(assetResponse = new Response("asset")) {
  const fetch = vi.fn().mockResolvedValue(assetResponse);

  return {
    env: {
      ASSETS: { fetch } as unknown as Fetcher,
      DB: {} as D1Database,
    } satisfies Env,
    fetch,
  };
}

describe("Worker", () => {
  it("keeps unimplemented API routes out of the asset fallback", async () => {
    const { env, fetch } = createEnv();
    const response = await worker.fetch(
      new Request("https://registry.example/api/models"),
      env,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: "not_found", message: "API route not found." },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("serves frontend requests from the static asset binding", async () => {
    const assetResponse = new Response("frontend", { status: 200 });
    const { env, fetch } = createEnv(assetResponse);
    const request = new Request("https://registry.example/models");

    const response = await worker.fetch(request, env);

    expect(response).toBe(assetResponse);
    expect(fetch).toHaveBeenCalledWith(request);
  });
});
