import { expect, it } from "vitest";
// @ts-expect-error The audit helper is plain JavaScript without type declarations.
import { cloudflareTimingOnly } from "../scripts/cloudflare-timing.mjs";

it("allows only Cloudflare's own Server-Timing metrics", () => {
  expect(cloudflareTimingOnly('cfCacheStatus;desc="HIT"\ncfEdge;dur=39,cfOrigin;dur=0\ncfExtPri')).toBe(true);
  expect(cloudflareTimingOnly("cfL4;desc=\"?proto=TCP&rtt=1\"")).toBe(true);
  expect(cloudflareTimingOnly('cfCacheStatus;desc="HIT", db;dur=12')).toBe(false);
  expect(cloudflareTimingOnly("registry;dur=4")).toBe(false);
  expect(cloudflareTimingOnly("cf;dur=1")).toBe(false);
  expect(cloudflareTimingOnly("")).toBe(false);
});
