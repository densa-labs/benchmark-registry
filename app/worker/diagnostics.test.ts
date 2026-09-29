import { afterEach, expect, it, vi } from "vitest";
import { diagnoseWorkerFailure } from "./diagnostics";

afterEach(() => vi.restoreAllMocks());

it("emits only a fixed failure classification and build, never an exception envelope", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
  diagnoseWorkerFailure("materialized-read");
  expect(log).toHaveBeenCalledExactlyOnceWith({ category: "materialized-read", build: "local" });
  diagnoseWorkerFailure("https://example.invalid/?q=private" as Parameters<typeof diagnoseWorkerFailure>[0]);
  expect(log).toHaveBeenCalledTimes(1);
});
