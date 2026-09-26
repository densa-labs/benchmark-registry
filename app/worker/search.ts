import { normalizeSearch } from "./params";

export interface SearchEntity {
  entity_type: "model" | "benchmark" | "company";
  id: number;
  canonical_name: string;
  normalized_name: string;
  href: string;
  aliases: string[];
  normalized_aliases: string[];
  versions: { id: number; version: string; version_slug: string }[];
}
export interface SearchHit {
  entity_type: SearchEntity["entity_type"] | "result";
  canonical_name: string;
  matched_text: string;
  href: string;
  aliases?: string[];
}
interface NameKey { text: string; key: string; rank: number; high: boolean; tokens?: string[]; folded?: string }
interface Candidate {
  entity: SearchEntity;
  version?: SearchEntity["versions"][number];
  keys: NameKey[];
}
export interface Interpretation {
  model: SearchEntity;
  benchmark: SearchEntity;
  versionId?: number;
  high: boolean;
}
interface Span { candidate: Candidate; start: number; end: number; rank: number; high: boolean; text: string }

// Formatting lookup is separate from stored NFKC/case-fold identity. Decimal
// dots stay intact; number boundaries are retained in the lookup signature.
export function lookupTokens(value: string): string[] {
  return normalizeSearch(value)
    .replace(/['’]/gu, "")
    .replace(/(?<!\d)\.|\.(?!\d)/gu, "")
    .replace(/[-‐‑‒–—]/gu, " ")
    .replace(/(\p{L})(\d)/gu, "$1 $2")
    .replace(/(\d)(\p{L})/gu, "$1 $2")
    .trim().split(/\s+/u).filter(Boolean);
}
function signature(tokens: string[]): string {
  return `${tokens.join("")}\0${tokens.join(" ").match(/\d+(?:\.\d+)*/gu)?.join("|") ?? ""}`;
}
const numbers = (value: string) => value.match(/\d+(?:\.\d+)*/gu)?.join("|") ?? "";
const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

// One insertion/deletion/substitution or adjacent transposition, only for words
// of at least four characters. Numerical identifiers never participate.
function oneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  if (a.length === b.length) {
    return a.slice(i + 1) === b.slice(i + 1)
      || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
function fuzzy(query: string[], name: string[]): boolean {
  if (query.length > name.length) return false;
  // Allow one mistyped token in a contiguous name span, never several guesses.
  for (let start = 0; start <= name.length - query.length; start++) {
    if (numbers(query.join(" ")) !== numbers(name.slice(start, start + query.length).join(" "))) continue;
    let mistakes = 0;
    if (query.every((word, i) => {
      const target = name[start + i];
      if (word === target) return true;
      if (/\d/u.test(word + target) || !oneEdit(word, target)) return false;
      return ++mistakes <= 1;
    }) && mistakes === 1) return true;
  }
  return false;
}
function candidates(entities: SearchEntity[]): Candidate[] {
  return entities.flatMap<Candidate>((entity) => {
    const keys: NameKey[] = [
      { text: entity.canonical_name, key: signature(lookupTokens(entity.normalized_name)), rank: 0, high: true, folded: entity.normalized_name },
      ...entity.aliases.map((text, index) => ({ text, key: signature(lookupTokens(entity.normalized_aliases[index])), rank: 1, high: true, folded: entity.normalized_aliases[index] })),
    ];
    if (entity.entity_type === "company") {
      // Slugs are Registry identity, not an invented synonym list. xAI is the
      // documented organization spelling for the existing SpaceXAI provider.
      const slug = entity.href.split("/").at(-1)!;
      keys.push({ text: slug, key: signature(lookupTokens(slug)), rank: 2, high: true });
      if (slug === "spacexai") keys.push({ text: "xAI", key: signature(["xai"]), rank: 2, high: true });
    }
    if (entity.entity_type === "model") {
      const tokens = lookupTokens(entity.normalized_name);
      // Natural suffixes are derived from the canonical name, never persisted
      // as factual aliases. Require both a number and a distinguishing word.
      for (let i = 1; i < tokens.length - 1; i++) {
        const suffix = tokens.slice(i);
        if (suffix.some((t) => /\d/u.test(t)) && suffix.some((t) => /\p{L}/u.test(t))) {
          keys.push({ text: entity.canonical_name, key: signature(suffix), rank: 4, high: true });
        }
      }
    }
    const family = { entity, keys };
    if (entity.entity_type !== "benchmark") return [family];
    const versions = entity.versions.map((version) => ({
      entity, version,
      keys: keys.filter((key) => key.rank === 0 || !/\d/u.test(key.text)
        || numbers(key.text) === numbers(entity.normalized_name)).flatMap((key) => {
        const text = `${key.text} ${version.version}`;
        const labels = [version.version];
        // A whole-number shorthand is valid only for a plain .0 version and
        // remains ambiguous if another stored version has the same shorthand.
        if (/^\d+\.0$/u.test(version.version)) labels.push(version.version.slice(0, -2));
        return labels.map((label) => ({ text, key: signature(lookupTokens(`${key.folded ?? key.text} ${label}`)), folded: normalizeSearch(`${key.folded ?? key.text} ${version.version}`), rank: 2, high: true }));
      }),
    }));
    return [family, ...versions];
  }).map((candidate) => ({ ...candidate, keys: candidate.keys.map((key) => ({ ...key, tokens: lookupTokens(key.folded ?? key.text), folded: key.folded ?? normalizeSearch(key.text) })) }));
}
function match(candidate: Candidate, tokens: string[], raw: string): Omit<Span, "candidate" | "start" | "end"> | undefined {
  const key = signature(tokens);
  let best: { rank: number; high: boolean; text: string } | undefined;
  for (const name of candidate.keys) {
    let rank: number;
    let high = false;
    const nameTokens = name.tokens!;
    if (key === name.key) {
      rank = name.rank < 2 && name.folded !== raw ? 2 : name.rank;
      high = name.high;
    } else {
      if (candidate.version) continue; // Never fuzzy-match a version label.
      const normalizedName = nameTokens.join(" ");
      const normalizedQuery = tokens.join(" ");
      const numericCompatible = tokens.filter((t) => /\d/u.test(t)).every((t) => nameTokens.includes(t));
      if (numericCompatible && normalizedName.includes(normalizedQuery)) rank = 4;
      else if (tokens.length && numericCompatible && tokens.every((t) => nameTokens.some((n) => /\d/u.test(t) ? n === t : n.startsWith(t)))) rank = 4;
      else if (fuzzy(tokens, nameTokens)) rank = 5;
      else continue;
    }
    if (!best || rank < best.rank || (rank === best.rank && high && !best.high)) best = { rank, high, text: name.text };
  }
  return best;
}
function hit(candidate: Candidate, text: string): SearchHit {
  return {
    entity_type: candidate.entity.entity_type,
    canonical_name: candidate.version ? `${candidate.entity.canonical_name} ${candidate.version.version}` : candidate.entity.canonical_name,
    matched_text: text,
    href: candidate.version ? `${candidate.entity.href}/${candidate.version.version_slug}` : candidate.entity.href,
    ...(candidate.entity.entity_type === "benchmark" ? { aliases: candidate.version ? [] : candidate.entity.aliases } : {}),
  };
}

export function interpretSearch(query: string, entities: SearchEntity[]) {
  const tokens = lookupTokens(query);
  if (tokens.length === 0) return { ranked: [], interpretations: [] };
  const known = candidates(entities);
  const ranked = new Map<string, { hit: SearchHit; rank: number }>();
  const add = (candidate: Candidate, text: string, rank: number) => {
    const entry = hit(candidate, text);
    const previous = ranked.get(entry.href);
    if (!previous || rank < previous.rank) ranked.set(entry.href, { hit: entry, rank });
  };
  for (const candidate of known) {
    const found = match(candidate, tokens, query);
    if (found) add(candidate, found.text, found.rank);
  }
  const spans: Span[] = [];
  const exactIndex = new Map<string, Candidate[]>();
  for (const candidate of known) {
    for (const name of candidate.keys) {
      const indexed = exactIndex.get(name.key) ?? [];
      if (!indexed.includes(candidate)) indexed.push(candidate);
      exactIndex.set(name.key, indexed);
    }
  }
  for (let start = 0; start < tokens.length; start++) {
    for (let end = start + 1; end <= tokens.length; end++) {
      const part = tokens.slice(start, end);
      for (const candidate of exactIndex.get(signature(part)) ?? []) {
        const found = match(candidate, part, part.join(" "))!;
        spans.push({ candidate, start, end, ...found });
      }
    }
  }
  // For suggestions, try the uncovered span next to an identified entity once.
  // Exact span discovery uses the index; fuzzy work is bounded to complements.
  const complements = new Map<string, [number, number]>();
  for (const span of spans) {
    if (span.start === 0 && span.end < tokens.length) complements.set(`${span.end}:${tokens.length}`, [span.end, tokens.length]);
    if (span.end === tokens.length && span.start > 0) complements.set(`0:${span.start}`, [0, span.start]);
  }
  for (const [start, end] of complements.values()) {
    const part = tokens.slice(start, end);
    for (const candidate of known) {
      if (spans.some((s) => s.candidate === candidate && s.start === start && s.end === end)) continue;
      const found = match(candidate, part, part.join(" "));
      if (found) spans.push({ candidate, start, end, ...found });
    }
  }
  const pairs: { model: Span; benchmark: Span; score: number }[] = [];
  for (const model of spans.filter((s) => s.candidate.entity.entity_type === "model")) {
    for (const benchmark of spans.filter((s) => s.candidate.entity.entity_type === "benchmark")) {
      if (!((model.start === 0 && model.end === benchmark.start && benchmark.end === tokens.length)
        || (benchmark.start === 0 && benchmark.end === model.start && model.end === tokens.length))) continue;
      // A version-looking alias (OSWorld 2.0) must not be promoted to a version.
      const benchmarkText = tokens.slice(benchmark.start, benchmark.end).join(" ");
      if (!benchmark.candidate.version && /\d/u.test(benchmarkText)
        && numbers(benchmarkText) !== numbers(benchmark.candidate.entity.normalized_name)) continue;
      pairs.push({ model, benchmark, score: model.rank + benchmark.rank });
    }
  }
  // Prefer known exact spans over prefixes/fuzzy guesses; a valid version span
  // naturally consumes more tokens than its generic family.
  const bestScore = Math.min(...pairs.map((p) => p.score));
  const interpretations = new Map<string, Interpretation>();
  for (const pair of pairs.filter((p) => p.score === bestScore)) {
    const model = pair.model.candidate.entity;
    const benchmark = pair.benchmark.candidate.entity;
    const versionId = pair.benchmark.candidate.version?.id;
    interpretations.set(`${model.id}:${benchmark.id}:${versionId ?? ""}`, {
      model, benchmark, versionId, high: pair.model.high && pair.benchmark.high,
    });
    add(pair.model.candidate, pair.model.text, 4);
    add(pair.benchmark.candidate, pair.benchmark.text, 4);
  }
  const hasExact = [...ranked.values()].some((entry) => entry.rank < 3);
  return { ranked: [...ranked.values()].filter((entry) => !hasExact || entry.rank < 5), interpretations: [...interpretations.values()] };
}

export function orderSearch(entries: { hit: SearchHit; rank: number }[]) {
  return entries.sort((a, b) => a.rank - b.rank
    || compareText(a.hit.entity_type, b.hit.entity_type)
    || compareText(normalizeSearch(a.hit.canonical_name), normalizeSearch(b.hit.canonical_name))
    || compareText(a.hit.href, b.hit.href)).map((entry) => entry.hit);
}
