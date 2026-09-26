# P11.4 — Search Quality verification

Completed 2026-09-26. P11.5 was not started.

## Implementation

Global search remains `GET /api/search?q=` with one canonical interpretation in
`app/worker/search.ts`. The existing Worker/repository/frontend architecture and
public route families remain in place. The browser receives ranked hits, not a
copy of the entity catalogue. Each search performs one SQL catalogue read and,
when a combined interpretation exists, at most one bound relationship read.

Formatting lookup starts from stored NFKC/case-folded names and aliases. It
handles whitespace, hyphens, alphabet/number boundaries, apostrophes, and
non-decimal dots. Its compact signature retains numeric components, so `5`,
`5.5`, `55`, and `1.1` stay distinct. Slugs supply organization spellings;
`xAI` is a small deterministic spelling mapping for the existing SpaceXAI row.
No aliases or Registry data were added or changed.

Natural model suffixes such as `6 sol` and `opus 5.5` are derived from known
canonical names and require a numeric component plus a distinguishing word.
They are lookup forms, not stored aliases. Benchmark versions come from actual
version rows. A plain `4.0` supports `4` shorthand; collisions remain ambiguous.
Version route segments always come from stored `version_slug`.

Typo tolerance permits one inserted, deleted, substituted, or transposed
character in one token of at least four characters. Numeric tokens and benchmark
version labels are never fuzzy matched. Exact matches suppress fuzzy suggestions,
preventing an exact `MMMU` search from offering `MMLU` as a typo correction.

Ranking is deterministic: canonical exact, alias exact, normalized exact,
confident combined relationship, token/prefix/substring matches, then fuzzy
suggestions. Ties use entity type, folded canonical name, and stable URL. Benchmark
scores never participate.

Parsing indexes known entity forms and examines query spans in either order.
Candidate interpretations must cover the complete query with non-overlapping
model and benchmark/version spans. Known version spans take precedence over
family prefixes. Weak interpretations can provide suggestions but cannot direct
navigation. Company spans also come from the same catalogue.

A unique high-confidence interpretation with exactly one retained connecting
result supplies `direct_href`; submitting search opens it automatically. Multiple
models, versions, reasoning variants, or historical runs prevent that navigation.
Combined result links use the existing benchmark version page with
`?view=history&result=<immutable result_key>`. The API validates the key and binds
it as a scoped filter. This state survives reload and page-size changes and has
an explicit “Show all results” link. No new public route hierarchy was introduced.

The compact list labels Model, Benchmark, Company, and Result. Combined actions
show model, benchmark/version, and reasoning context. Arrow keys move focus,
Enter opens the focused link, and Escape closes results and returns input focus.

## Verification

Automated checks:

- `npm --prefix app run typecheck`: passed.
- `npm --prefix app run lint`: passed.
- `npm --prefix app test -- --reporter=dot`: 175 tests passed across 10 files.
- Staging and production builds and their environment verification scripts: passed.
- `git diff --check`: passed; the P11.4 diff was inspected against the initial
  workspace state. Existing P11.3 changes were preserved.
- Frozen contracts, numbering, data, migrations, scores, and canonical route
  families were unchanged.

Staging was deployed and verified before production. Final staging Worker version:
`a5054c03-27f7-4732-afbd-dfc1050c0f8c`.

Manual staging checks covered organization spacing, aliases, model abbreviations,
minor typos, model/company/benchmark links, both combined-query orders, explicit
versions, automatic navigation, result selection, reload, page-size persistence,
arrows/Enter/Escape/focus, loading/empty/error states, and desktop/mobile search
in light and dark modes. Desktop was checked at 1280 pixels; mobile at 390 pixels.
The final build was checked again for exact aliases, typo suggestions, combined
results, punctuation-only queries, and automatic navigation.

Unauthenticated staging API requests still returned Cloudflare Access redirects.
The staging build guard verified its separate D1 binding and crawler-protection
variable. Worker tests verified `X-Robots-Tag: noindex, nofollow, noarchive` and
`robots.txt` disallow behavior. The browser blocked a direct live `robots.txt`
navigation with `ERR_BLOCKED_BY_CLIENT`; live robots content was therefore not
manually read. Access policy and crawler-protection code/configuration were not
changed.

Production Worker version: `1e2fc2e7-3d3f-45c4-b322-d38238ddc238`.
The compiled Worker and frontend SHA-256 hashes matched the staging artifacts,
and source hashes also matched. Forty live production search queries passed,
including checks that selected-result API URLs return exactly the intended model,
version, and result key. Browser verification confirmed automatic navigation,
arrow/Enter selection, and selected-result reload. The first Python HTTP client
received a 403; the verification used curl, which returned successful public API
responses. No protection was disabled.

No database writes or migrations were performed. Production Registry totals were
unchanged: 92 models, 53 benchmark families, 104 versions, and 594 results.

Representative verified queries:

- `openai`, `open ai`, `OpenAI`, `z.ai`, `z ai`, `zai`, `deepseek`, `deep seek`, `x ai`.
- `opneai`, `antropic`, `gemni`, `cursor bench`.
- `gpt 6 sol`, `6 sol`, `GPT-6 Sol`, `gpt-6-sol`, `opus 5.5`.
- `MMMU`, its canonical expansion, `CursorBench 4`, `DeepSWE 1.1`, `AI2D TEST`.
- `cursorbench 4 opus 5.5`, `opus 5.5 cursorbench 4`,
  `cursorbench 4 claude opus 5.5`.
- `6 sol cursorbench`, `cursorbench 6 sol`.
- `DeepSWE 1.1 GPT-6 Sol`, `6 sol deepswe 1.1`, `deepswe 6 sol`.

Ambiguity and safety checks covered duplicate model names, model families,
multiple relevant benchmark versions, reasoning variants, historical reruns,
fuzzy combined text, unknown versions, unmatched extra words, punctuation-only
queries, and later search pages. These do not supply automatic navigation.

## Data limitations and deferred issues

- Claude Opus 5.5 has both max and medium CursorBench 4.0 results. Search offers
  both exact result links; it does not choose a reasoning level automatically.
- GPT-6 Sol has no CursorBench result in the current Registry. Both query orders
  return the model and benchmark choices without inventing a connection.
- Claude Opus 5.5 has no Terminal-Bench 2.0 result. Naming 2.0 does not route to
  its recorded 4.0 result.
- The existing version-like `OSWorld 2.0` family alias remains a deferred ingestor
  data correction/removal. It can still find its family, but cannot establish an
  exact combined version interpretation or trigger navigation. Data was untouched.
- The existing 50 UTF-8 byte search limit remains in force.

P11.4 complete: YES

P11.5 was not started. No P11.6 or later work was begun.
