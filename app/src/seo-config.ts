/** Public URL policy. Preview/staging documents always point to production. */
export const CANONICAL_ORIGIN = "https://benchmarkregistry.org";
export const CANONICAL_HOST = new URL(CANONICAL_ORIGIN).hostname;
export const ALTERNATE_HOST = `www.${CANONICAL_HOST}`;
/** Retained record count required before indexing model/version documents. */
export const MIN_INDEXABLE_RECORDS = 3;
