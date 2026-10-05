import { CORRECTIONS, parseCorrections, type Correction } from "../src/corrections";

interface CorrectionRow { result_key: string; kind: "correction" | "retraction"; expected: string; corrected: string; reason: string; recorded_at: string }

// /corrections lists the curated notes in data/corrections.json and every
// result correction or retraction the ingestor logged (migration 0015).
export async function recordedCorrections(db: D1Database): Promise<Correction[]> {
  const { results } = await db.prepare(`SELECT result_key, kind, expected, corrected, reason, recorded_at
    FROM result_corrections ORDER BY recorded_at DESC, id`).all<CorrectionRow>();
  return parseCorrections([...CORRECTIONS, ...results.map(row => {
    const before = JSON.parse(row.expected) as { score_raw?: string };
    const after = JSON.parse(row.corrected) as { score_raw?: string };
    return {
      date: row.recorded_at.slice(0, 10),
      record_number: `BR-${row.result_key}`,
      what_changed: row.kind === "retraction" ? "Result retracted" : `Score ${before.score_raw} → ${after.score_raw}`,
      reason: row.reason,
    };
  })]);
}
