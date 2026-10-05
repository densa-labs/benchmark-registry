import type { BenchmarkVersionSummary } from "../worker/api";

export interface VersionGroup {
  base: BenchmarkVersionSummary;
  variants: BenchmarkVersionSummary[];
}

// Require an exact, unique base and one spaced separator. Never infer a parent
// from a route slug, release date or similar-looking version number.
export function groupVersions(versions: BenchmarkVersionSummary[]): VersionGroup[] {
  const parents = new Map<string, BenchmarkVersionSummary>();
  for (const version of versions) {
    // A configuration row belongs under the unconfigured version its recorded
    // dataset label names exactly ("Science 0.1 — 6x verifier timeout").
    if (version.configuration && version.dataset_label) {
      const matches = versions.filter(candidate => !candidate.configuration && candidate.version === version.dataset_label);
      if (matches.length === 1) {
        parents.set(version.version_slug, matches[0]);
        continue;
      }
    }
    const parts = version.version.split(/\s+[—–-]\s+/u);
    if (parts.length !== 2 || !parts[0] || !parts[1]) continue;
    const matches = versions.filter(candidate => candidate.version === parts[0]);
    if (matches.length === 1) parents.set(version.version_slug, matches[0]);
  }
  const groups = new Map<string, VersionGroup>();
  for (const version of versions) {
    const base = parents.get(version.version_slug) ?? version;
    let group = groups.get(base.version_slug);
    if (!group) {
      group = { base, variants: [] };
      groups.set(base.version_slug, group);
    }
    if (base !== version) group.variants.push(version);
  }
  return [...groups.values()];
}
