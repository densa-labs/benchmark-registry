export const CONTENT_METADATA = {
  coverage: {title:"Coverage",description:"Coverage gaps across recent AI models, benchmark families and providers, with stale result dates."},
  corrections: {title:"Corrections", description:"Recorded corrections to Benchmark Registry results, with changes and reasons."},
} as const;
export const CONTENT_PATHS = Object.keys(CONTENT_METADATA).map(kind=>`/${kind}`);
export type ContentKind = keyof typeof CONTENT_METADATA;
export function contentKind(path: string): ContentKind | undefined { return (Object.keys(CONTENT_METADATA) as ContentKind[]).find(kind=>path === `/${kind}` || path === `/${kind}/`); }
