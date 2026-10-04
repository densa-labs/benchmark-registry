# UI clarity pass: results, effort comparison and source context

Model pages put compact release metadata beneath the title and align reasoning variants beside each benchmark. Benchmark families keep the SEO result preview first and group harness variants into native disclosures. Tables remain minimalist, with compact widths, readable source labels and contained mobile scrolling.

The branch is `ui/clarity-pass`, based on main 6ac1df6, which already includes `seo/site-wide` through merge 4277a76. There is one commit for each task. Canonical data, migrations, ingestion, scores, runtime dependencies, public routes, head metadata, canonicals, structured data and the sitemap are unchanged.

## Before / after by task

| Task | Before | After |
| --- | --- | --- |
| 1 | Flat versions with repeated metric and separate Status column. | Shared metric stated once; Latest badge beside its actual version; exact `base — variant` names grouped under the existing base, preserving every URL and release date. Groups of up to four variants open initially. SEO sentence and recent-result preview reused. |
| 2 | Four metadata rows and search/page-size controls on every model. | Inline, wrapping metadata directly under H1. Search appears above 25 displayed rows; active queries retain search/clear so an empty result never traps the user. Page size appears only above 50 results, auto-submits after hydration, and retains native Apply inside noscript. |
| 3 | Separate rows for each effort. | One row per benchmark version/metric with effort columns in low/medium/high/xhigh/max order, followed by untouched unknown labels alphabetically. Missing cells use an en dash. Every observation and citation is retained, including multiple evaluator series in a cell. Latest pivots; History stays a run list. Default model order is benchmark name. Copy counts results and distinct benchmark families separately. |
| 4 | Tables span the full page and long benchmark names truncate. | Shared 64rem cap, 48rem for compact tables; scores adjacent to names; existing numeric alignment, tabular digits, hover and thin dividers retained. Wrapping benchmark names and native scrolling with edge shadows prevent page overflow at 390px. |
| 5 | Repeated generic Source links. | Evidence-hostname labels, existing external arrow/rel behavior, known metric names and Reported dates. Pivot metrics appear once by the benchmark; each score has its own source and report date. |
| 6 | Exact-result anchors such as 89.9% underline while plain neighboring scores do not. | Table links use the existing accent, with no default underline and underline on hover/keyboard focus. Exact evaluation links remain legitimate. Existing muted and accent tokens pass AA, so their colors are retained. |
| 7 | SEO breadcrumbs/update copy already present; no direct preselected Compare link or numbering explanation. | Breadcrumbs and real checked dates reused; version date shown near its heading. Compare uses the existing URL serializer with this model selected. Registry No. has an accessible explanation and links to existing numbering documentation. |
| 8 | Existing captions, scoped headers, sort state and focus support. | All retained and verified. Announcements use pagination after pivoting and distinguish results from benchmark counts. Nested variant dates and long effort headers wrap. Offline browser, axe, keyboard and no-JS evidence saved. |

## Screenshots

Six matching before/after pairs use the same saved, read-only full Registry snapshot. Before screenshots are from main 6ac1df6, rendered in a temporary copy; after screenshots are the final UI. Screenshots show light mode; dark mode is covered by axe and contrast checks.

| Page | 1440px | 390px |
| --- | --- | --- |
| Terminal-Bench family | [Before](ui-clarity/before-terminal-bench-1440.png) · [After](ui-clarity/after-terminal-bench-1440.png) | [Before](ui-clarity/before-terminal-bench-390.png) · [After](ui-clarity/after-terminal-bench-390.png) |
| Claude Opus 5.5 | [Before](ui-clarity/before-claude-opus-5.5-1440.png) · [After](ui-clarity/after-claude-opus-5.5-1440.png) | [Before](ui-clarity/before-claude-opus-5.5-390.png) · [After](ui-clarity/after-claude-opus-5.5-390.png) |
| Terminal-Bench 2.1 version | [Before](ui-clarity/before-terminal-bench-2.1-1440.png) · [After](ui-clarity/after-terminal-bench-2.1-1440.png) | [Before](ui-clarity/before-terminal-bench-2.1-390.png) · [After](ui-clarity/after-terminal-bench-2.1-390.png) |

## Data gaps, skipped items and conservative decisions

- **Metric direction not stored.** Reused the SEO five-recent-results section and latest-version navigation; skipped rebuilding it, as requested. No score ranking is introduced. The section may contain fewer than five results if the latest version has fewer records.
- **Source type not stored.** No Self-reported/Independent tags. No publisher/document-category field on result records, so labels use recorded URL hostnames; evaluator names are never misrepresented as publishers.
- **No parent-version relationship.** Group only an exact unique base and one consistent spaced dash separator (hyphen/en dash/em dash). Unmatched, ambiguous and multi-separator names stay flat. A group's position is its first original occurrence, retaining latest-version visibility without inferring semantic version order.
- **Science 0.1 is a Terminal-Bench version**, including an existing verifier-timeout variant, in this data. No separate-family modeling question is triggered; nothing is relocated.
- Pivot identity includes version and metric. Different versions/metrics stay separate rather than implying equivalence. Multiple evaluator series are preserved as multiple observations in the same cell, with evaluator context when needed.
- HTML presentation obtains the full filtered observation set through existing paginated read endpoints, then pivots before pagination. API pagination and explicit sorting semantics are unchanged. This can require additional internal read requests on larger models; it introduces no D1 reads on public routes.
- The search threshold uses displayed rows after grouping. An active query remains editable below the threshold, including zero results. This preserves recovery and existing URLs.
- Sticky headers were skipped: the existing horizontal scroller has no vertical height constraint, so adding sticky headers would require additional layout changes. Existing dividers and hover already met task 4; they were reused.
- Report dates exist in the canonical records. They are labeled Reported, not evaluation dates. Update dates reuse source-checked timestamps. Missing values are omitted.
- Long effort tables may scroll horizontally even on desktop. The scroll remains inside the table, with a visible edge cue; no page scroll or score/source loss occurs.

## Verification

- App: **436 tests passed**, one pre-existing skipped test; TypeScript, ESLint and production build passed.
- Link-script unit suite: **8 passed**.
- Ingestor: **90 passed**, one remote test skipped because disposable D1 credentials are absent. No ingestor files changed.
- SEO checker: **38 seed sitemap URLs and 288 full-snapshot URLs passed**, including metadata/canonical/JSON-LD/noindex invariants and reachability. Existing SEO checker unchanged.
- Browser: **18 page/viewport/theme/JS combinations passed**. Exactly one H1, no skipped headings, scoped table headers/captions, and no horizontal page overflow at 1440px or 390px.
- Axe: **zero violations across 12 runs** (three pages × two widths × light/dark), covering WCAG A/AA, WCAG 2.1 AA and best-practice rules. No-JS pages received semantic and keyboard checks; axe requires page timers and was not run with scripts disabled.
- Keyboard, with JS on and off: native disclosures Enter/Space, visible focus, ArrowRight table scrolling, Latest/History navigation, benchmark/source sort and aria-sort, and Compare preselection passed. The native page-size submission enhancement and noscript fallback are covered by unit/SSR tests; no model in this snapshot exceeds 50 results.
- Contrast on the grey header surface: muted text **5.20:1 light / 6.05:1 dark**; accent links **10.46:1 light / 7.18:1 dark**. Tests also check body/secondary/link colors on normal and hover surfaces and focus contrast.
- Environment limitation: the pre-existing ingestor Ruff binary exits **137** before diagnostics, both inside and outside the sandbox. Python tests ran using the bundled Python 3.12 interpreter and the already installed repo pytest packages, because the venv interpreter symlink points to a missing Homebrew installation. App lint passed; Python lint could not be verified.

See [Phase 0 audit](ui-audit.md) and [browser evidence](ui-clarity/after-checks.json).

## Reproduce locally

```sh
cd app
npm test
npm run typecheck
npm run lint
npm run build
npm run test:links
npm run test:seo
cd ..
node scripts/seo_check.mjs --db=/private/tmp/benchmark-seo-full.sqlite --serve=4200 --report=/private/tmp/ui-after-seo.json
```

The saved snapshot path is specific to this workspace; substitute an existing complete Registry SQLite snapshot. The checker opens it read-only. Leave the preview running, then in another terminal:

```sh
cd app
node scripts/ui-clarity-audit.mjs --phase=after --base=http://127.0.0.1:4200
```

Chrome defaults to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; override with `--chrome=/absolute/path/to/chrome`. Run `--phase=before` against an unchanged baseline preview to reproduce the six before captures. Both commands use installed Playwright Core and axe-core without runtime dependencies or external accessibility services.

Exact Python test command used in this workspace:

```sh
cd ingestor
PYTHONPATH=.venv/lib/python3.12/site-packages:src /Users/ivan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m pytest
```
