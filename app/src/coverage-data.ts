export interface CoverageOptions { models: number; benchmarks: number; days: number }
export interface CoverageData {
  options: CoverageOptions;
  updated: string | null;
  models: {registry_no:string; name:string; provider:string; provider_slug:string}[];
  benchmarks: {slug:string; name:string; records:number}[];
  cells: {registry_no:string; slug:string; result_key:string; version_slug:string}[];
  providers: {slug:string; name:string; models:number; benchmarks:number; records:number}[];
  stale: {slug:string; name:string; newest:string}[];
}
