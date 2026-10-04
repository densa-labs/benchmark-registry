import type { ResultRow } from "../worker/api";

export interface PivotRow {
  key: string;
  result: ResultRow;
  cells: Map<string, ResultRow[]>;
}

export function pivotResults(results: ResultRow[]) {
  const rows = new Map<string, PivotRow>();
  const labels = new Set<string>();
  for (const result of results) {
    const key = JSON.stringify([result.benchmark.slug, result.benchmark_version_slug, result.metric.key]);
    let row = rows.get(key);
    if (!row) {
      row = { key, result, cells: new Map() };
      rows.set(key, row);
    }
    const label = result.reasoning_level ?? "";
    labels.add(label);
    const cell = row.cells.get(label) ?? [];
    cell.push(result);
    row.cells.set(label, cell);
  }
  const known = ["low", "medium", "high", "xhigh", "max"];
  const variants = [...labels].sort((a, b) => {
    const x = known.indexOf(a), y = known.indexOf(b);
    if (x !== -1 || y !== -1) return (x === -1 ? known.length : x) - (y === -1 ? known.length : y);
    return a.localeCompare(b, "en");
  });
  return { rows: [...rows.values()], variants, multiple: [...rows.values()].some(row => row.cells.size > 1) };
}
