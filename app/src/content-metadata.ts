export const CONTENT_METADATA = {
  corrections: {title:"Corrections", description:"Recorded corrections to Benchmark Registry results, with changes and reasons."},
} as const;
export const CONTENT_PATHS = Object.keys(CONTENT_METADATA).map(kind=>`/${kind}`);
