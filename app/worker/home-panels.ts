import type { BenchmarkRef, ResultRow } from "./api";

export const HOME_PANEL_LIMIT = 5;

export interface HomePanels {
  explore_benchmarks: Array<{
    benchmark: BenchmarkRef;
    model_count: number;
    result_count: number;
  }>;
  latest_additions: ResultRow[];
}
