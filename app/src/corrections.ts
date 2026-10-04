import corrections from "../../data/corrections.json";
export interface Correction { date: string; record_number: string; what_changed: string; reason: string }
export function parseCorrections(input: unknown): Correction[] {
  if (!Array.isArray(input)) throw new Error("Corrections must be a list.");
  return input.map(value => {
    if (!value || typeof value !== "object" || Object.keys(value).sort().join(",") !== "date,reason,record_number,what_changed"
      || ![value.date, value.record_number, value.what_changed, value.reason].every(item => typeof item === "string" && item.trim())
      || !/^\d{4}-\d{2}-\d{2}$/u.test(value.date) || new Date(value.date).toISOString().slice(0,10) !== value.date) throw new Error("Invalid correction entry.");
    return value as Correction;
  }).sort((a,b) => b.date.localeCompare(a.date) || a.record_number.localeCompare(b.record_number));
}
export const CORRECTIONS = parseCorrections(corrections);
