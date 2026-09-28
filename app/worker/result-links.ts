// P11.6 eligibility: all retained runs/configurations count; redirects are excluded.
// Used by document canonicals, the sitemap, and table navigation.
export const EXACT_RESULT_ELIGIBLE_SQL = `(
  (SELECT count(*) FROM results peers WHERE peers.model_id = r.model_id
    AND peers.benchmark_version_id = r.benchmark_version_id) = 1
  AND NOT EXISTS (SELECT 1 FROM registry_redirects rr WHERE rr.source_model_id = r.model_id)
)`;

export function exactResultPath(slug: string, versionSlug: string, key: string): string {
  return `/benchmarks/${slug}/${versionSlug}?view=history&result=${key}`;
}
