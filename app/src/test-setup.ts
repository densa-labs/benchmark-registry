import { vi } from "vitest";

// UI tests stub `fetch` with API responses; route the static data layer straight
// to that stub. src/static-api.test.ts covers the real static layer.
vi.mock("./static-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./static-api")>();
  return { ...actual, staticFetch: ((...args: Parameters<typeof fetch>) => fetch(...args)) as typeof fetch };
});
