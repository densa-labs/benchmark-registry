import type { Effort, ResultRow } from "../worker/api";

// Order and display names follow the effort_levels table (migration 0013).
export const EFFORT_LEVELS: readonly Effort[] = ["none", "low", "medium", "high", "xhigh", "max"];
const EFFORT_DISPLAY: Record<Effort, string> = { none: "None", low: "Low", medium: "Medium", high: "High", xhigh: "xHigh", max: "Max" };
export function effortDisplay(effort: Effort): string {
  return EFFORT_DISPLAY[effort];
}
export function effortRank(result: Pick<ResultRow, "effort">): number {
  return result.effort ? EFFORT_LEVELS.indexOf(result.effort) : EFFORT_LEVELS.length;
}
// The provider's own label, when it says something the effort does not. Labels
// without a reviewed effort are only ever shown this way, never mapped here.
export function providerLabel(result: Pick<ResultRow, "reasoning_level" | "effort">): string | null {
  const label = result.reasoning_level?.trim();
  if (!label || label.toLowerCase() === result.effort) return null;
  return label;
}

/** Column key for results without a reviewed effort. */
export const OTHER_SETTINGS = "other";
export type PivotColumn = Effort | typeof OTHER_SETTINGS;

export interface PivotRow {
  key: string;
  result: ResultRow;
  cells: Map<PivotColumn, ResultRow[]>;
}

export function pivotResults(results: ResultRow[]) {
  const rows = new Map<string, PivotRow>();
  const columns = new Set<PivotColumn>();
  for (const result of results) {
    // Tool and harness configurations never share a row.
    const key = JSON.stringify([result.benchmark.slug, result.benchmark_version_slug, result.metric.key, result.configuration?.key ?? ""]);
    let row = rows.get(key);
    if (!row) {
      row = { key, result, cells: new Map() };
      rows.set(key, row);
    }
    const column = result.effort ?? OTHER_SETTINGS;
    columns.add(column);
    const cell = row.cells.get(column) ?? [];
    cell.push(result);
    row.cells.set(column, cell);
  }
  const ordered: PivotColumn[] = [...EFFORT_LEVELS, OTHER_SETTINGS];
  const variants = ordered.filter(column => columns.has(column));
  // Offered only when a row has two or more reviewed effort levels.
  const multiple = [...rows.values()].some(row => [...row.cells.keys()].filter(column => column !== OTHER_SETTINGS).length > 1);
  return { rows: [...rows.values()], variants, multiple };
}

/** The effort layout applies to the Latest view, on request, when it is offered. */
export function usesEffortLayout(search: string, pivot: { multiple: boolean }): boolean {
  const params = new URLSearchParams(search);
  return params.get("view") !== "history" && params.get("layout") === "effort" && pivot.multiple;
}
