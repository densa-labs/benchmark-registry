import { ApiError, jsonError } from "../worker/api";
import { handleApi } from "../worker/api-router";
import { MaterializedRepository } from "../worker/materialized-repository";
import type { ReadData, ReadManifest } from "../worker/read-model";

/** Published by the static build: generation id plus content-hashed object files. */
export interface StaticDataManifest { generation: string; objects: Record<string, string> }
export const STATIC_MANIFEST_PATH = "/data/manifest.json";
export const staticObjectPath = (hash: string) => `/data/objects/${hash}.json`;

/**
 * Serves the former `/api/*` read routes in the browser from static, immutable
 * JSON. Every other request goes to the network unchanged.
 */
/** A static fetch that can also start loading named data objects before a route asks for them. */
export type StaticFetch = typeof fetch & { prefetch?: (keys: string[]) => void };

export function createStaticFetch(network: typeof fetch = (...args) => fetch(...args)): StaticFetch {
  let current: Promise<{ manifest: StaticDataManifest; repository: MaterializedRepository }> | undefined;
  const objects = new Map<string, Promise<unknown>>();
  const object = (manifest: StaticDataManifest, key: string) => {
    const hash = manifest.objects[key];
    if (!objects.has(hash)) objects.set(hash, network(staticObjectPath(hash), { headers: { Accept: "application/json" } }).then(async (response) => {
      if (!response.ok) throw new Error("Registry data file is unavailable.");
      return (await response.json() as { data: unknown }).data;
    }).catch((error: unknown) => { objects.delete(hash); throw error; }));
    return objects.get(hash)!;
  };
  const load = (manifest: StaticDataManifest) => new MaterializedRepository(
    { schema: 1, environment: "local", generation: manifest.generation, canonicalRevision: manifest.generation, watermark: 0, createdAt: "", objects: manifest.objects } satisfies ReadManifest,
    async <K extends keyof ReadData>(key: string) => object(manifest, key) as Promise<ReadData[K]>,
  );
  const generation = async (revalidate: boolean) => {
    if (!current || revalidate) {
      const pending = network(STATIC_MANIFEST_PATH, { headers: { Accept: "application/json" }, cache: revalidate ? "no-cache" : "default" }).then(async (response) => {
        if (!response.ok) throw new Error("Registry manifest is unavailable.");
        const manifest = await response.json() as StaticDataManifest;
        if (!/^[a-f0-9]{32}$/u.test(manifest.generation) || !manifest.objects) throw new Error("Invalid registry manifest.");
        return { manifest, repository: load(manifest) };
      });
      const previous = current;
      current = pending;
      pending.catch(() => { if (current === pending) current = previous; });
    }
    return current;
  };
  const staticFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), typeof window === "undefined" ? "https://registry.invalid" : window.location.origin);
    if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) return network(input, init);
    try {
      const revalidate = url.pathname === "/api/revision" || init?.cache === "no-cache";
      const { manifest, repository } = await generation(revalidate);
      const response = await handleApi(new Request(url, { method: init?.method ?? "GET" }), manifest.generation, repository);
      response.headers.set("X-Registry-Revision", manifest.generation);
      return response;
    } catch (error) {
      if (error instanceof ApiError) return jsonError(error.status, error.code, error.message);
      return jsonError(500, "internal_error", "The registry data could not be loaded.");
    }
  }) as StaticFetch;
  // Requests the objects in parallel; a later read of the same key reuses the pending request.
  staticFetch.prefetch = (keys) => {
    void generation(false).then(({ manifest }) => {
      for (const key of keys) if (manifest.objects[key]) object(manifest, key).catch(() => {});
    }).catch(() => {});
  };
  return staticFetch;
}

export const staticFetch = createStaticFetch();
