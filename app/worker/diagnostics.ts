import { BUILD_ID } from "../src/build";

const categories = ["read-api", "model-redirect", "sitemap", "document", "materialized-read"] as const;
type FailureCategory = typeof categories[number];

// Fixed classifications only. Never accept a request, exception, URL, or payload.
// Final deployments use transient tail diagnostics, with log persistence disabled.
export function diagnoseWorkerFailure(category: FailureCategory) {
  if (!categories.includes(category)) return;
  console.error({ category, build: BUILD_ID });
}
