# P11.10 — Accessibility

Status: complete, September 28, 2026. Only P11.10; P11.11 and P11.12 have not begun.

## Baseline and audit inventory

P11.9: 333 app tests, 89 Python tests, mobile Performance 97 and desktop 99; normal public page D1 reads = 0. Historical accessibility score 90, invalid ARIA, touch target and accessibility-tree failures. Fresh pre-change production Lighthouse on September 28: mobile 98/96/81/100, desktop 99/90/81/100 (Performance/Accessibility/Best Practices/SEO). Agentic Browsing: mobile 100, desktop 50 (one of two accessibility checks fails).

| Severity | Finding |
| --- | --- |
| Blocker | None found |
| Serious | `aria-expanded` on native searchbox, unsupported by that role; this is also the precise failing node in Agentic Browsing's accessibility-tree audit |
| Serious | Skip link below sticky header, non-focusable main destination |
| Serious | Client navigation does not update focus or announce identity; same-page replacement loses control focus |
| Serious | Adjacent homepage entity links below 24 px and without sufficient spacing |
| Serious | Materialized-store failure serves plain text without accessible application shell |
| Moderate | More than one primary aria-sort after choosing another column; benchmark index incorrectly exposes release instead of name as default |
| Moderate | Real 404 has h2 and no h1 |
| Moderate | Unnamed global/local search landmarks; some focus rings clip in scroll containers; desktop header DOM order differs from visual order |
| Moderate | Input/select control boundaries below 3:1; staging warning outside landmarks (first staging axe audit) |
| Moderate | Staging enlarged-text verification found page-size, pagination and theme-control minimum widths overflowing a 320 px viewport at 200% text size |
| Minor | Source/score/Registry No. context; Last updated state; persistent search announcements; Safari list semantics |

## Methodology

Read root/app instructions and frozen product/data/numbering contracts. Preserve the existing uncommitted P11.9 implementation. Audit initial SSR and hydrated presentation for home, all directories, model, family, version, organization, exact result, 404, loading, empty and error states. Use Chrome DOM/accessibility snapshots, rendered computed styles, actual keyboard events, development-only axe-core, deterministic Vitest regressions, bounded authenticated staging browser automation, and bounded production Lighthouse. No production crawl or D1-backed accessibility fix.

The browser audit is a fixed route list rather than link traversal. Staging uses the existing Cloudflare Access login; Access policy, robots/noindex, KV isolation and maintenance database configuration are preserved. Rendered Chrome accessibility-tree inspection complements DOM snapshots and axe. No physical screen-reader verification is claimed.

## Implementation

- Native header/nav/main/footer and one primary heading. Real 404 uses h1 with existing compact styling; nested empty states use h3 below their section h2. Same SSR and hydrated component tree.
- Native searchbox without unsupported aria-expanded; named search landmarks, real labels, ordinary result links. Persistent polite status updates on submit/results; errors remain alerts. Search ranking, query limits and exact-result behavior are unchanged. Nested Escape closes results before closing mobile navigation.
- Skip to main content appears above the sticky header and targets focusable main. Instant header reveal on focus. Desktop focus order matches left-to-right layout; mobile remains search-first. Collapsed menu stays inert/hidden; Escape restores its toggle.
- Route commits update document head and focus after React renders, including cached transitions. Cross-page changes focus h1; same-page sorting/filter/search/page updates restore a stable control identity or result heading. A restrained persistent status identifies title/result count/page/sort/view/provider/exact state. Background refresh does not refocus or reannounce; user movement to another control during a request is respected. History and scroll behavior stay intact.
- Native tables retain captions, thead/tbody and column-scoped headers; scroll wrappers are named keyboard-focusable regions. aria-sort is only on the current sortable th; Score remains display-only. Source/score links provide model/benchmark/reasoning context.
- Pagination uses native disabled buttons and labeled Previous/Next page links. Native theme fieldset/legend/radios retain System default and persistence, with an underline/weight cue and visible label focus.
- Decorative SVGs and skeleton geometry stay hidden. One exposed loading status per route; main aria-busy clears when complete. Reduced-motion shimmer/menu/scroll behavior is retained; forced-color focus/selection cues added.
- Mobile non-table controls use approximately 44 px areas, homepage links expand safely, table links meet the 24 px AA minimum within compact rows, and sort headers use 44 px. Focus outlines in scroll containers are inset. Controls use separate contrasting boundary colors; ordinary separator/brand colors remain unchanged.
- Enlarged-text correction allows page-size labels, footer theme options and metadata source links to wrap; pagination and footer grid tracks can shrink. Data-table overflow stays inside its named keyboard-scrollable container.
- Last updated remains a native keyboard-operable button with aria-pressed, an accessible description, focus outline, and unchanged quiet pointer/hover styling. GitHub stays labeled; Legal still points to the future /legal route.
- Read-store failures preserve HTTP 500/no-store/noindex with an SSR/hydrated accessible error shell, native retry/navigation and footer controls; no public D1 fallback.

## Verification

### Automated tests and checks

| Check | Result |
| --- | --- |
| Full app suite | 357 passed, 1 skipped; 1.38 s final run |
| Accessibility regressions | 24 tests passed, included in the full app suite; initial/hydrated axe across nine route states, keyboard/focus/controls/loading/error checks and Worker failure shell |
| Python suite | 89 passed, 1 skipped; 6.97 s |
| Offline link tests | 8 passed |
| Typecheck | Passed; also part of both environment builds |
| ESLint / Python Ruff | Passed |
| Staging / production builds | Passed |
| Staging / production configuration checks | Passed: branding, hydration, timestamps, isolated KV and no public D1 binding |
| Lighthouse performance gate | Passed: mobile >=90, desktop >=95, LCP/TBT/CLS limits |
| Diff checks and frozen-contract inspection | Passed; existing P11.9 changes preserved |

The skipped app test is the existing opt-in local D1 performance audit because `P119_AUDIT_FIXTURE` is absent. Python skips its remote write integration test because disposable credentials are absent. No remote database was provisioned for accessibility.

Development-only axe-core 4.13.0 and playwright-core support `npm run test:accessibility` and `npm run audit:accessibility`. No accessibility library ships in the public bundle. Production JS is 297.98 kB raw / 86.91 kB gzip, CSS 25.89 / 5.64 kB. The raw JS increase over the P11.9 294.19 kB artifact is approximately 3.8 kB, chiefly native navigation/focus and failure presentation.

For a quick repeat, `npm run test:accessibility` runs only the deterministic accessibility regressions; `npm run audit:accessibility -- --host staging.benchmarkregistry.org --cloudflared /path/to/cloudflared --output /tmp/accessibility.json --quick` runs the interactive/reflow/error checks without repeating the 40-route matrix. Omit `--quick` to run the full fixed staging sample. Production uses the same command with its host and a smaller six-route sample. Cloudflared must already have the existing staging Access login.

### Staging first

Final deployment: `ba64d9e5-60ce-4705-b666-d4628f1d85af`; build timestamp `2026-09-28 10:44:25 UTC`. Public Worker retains only staging READ_STORE, ASSETS and environment/protection variables, without D1. KV remains isolated from production. Cloudflare Access remains enabled; unauthenticated API access is rejected/redirected, robots disallows all, response noindex remains, and red banner/title/favicon/diagnostics retain staging identity.

Ten representative route states at desktop 1440 px and mobile 390 px in both Light and Dark produced **40 axe checks with zero violations**. This includes every directory/detail family, exact result and real 404. That run then found the enlarged-text overflow listed above. After the CSS correction, the targeted final run passed reflow and all interactive checks; the 40-route matrix was not repeated unnecessarily. Four additional final staging interaction/state axe checks passed. A few dynamic/scroll-clipped nodes produce axe contrast `incomplete` results, which are not counted as passes: resolved color-token measurements and visual inspection provide the complementary contrast evidence below.

Representative native keyboard checks passed:

- Skip link appears above the header and focuses main. Mobile toggle opens with Space; search, results and ordinary navigation follow Tab order. Nested Escape dismisses search before closing navigation; menu Escape restores toggle focus; closed content is excluded from Tab order.
- Sort links expose one correct `aria-sort`; focus restores to the activated control. Table containers scroll with ArrowRight. Pagination announces the new page and retains logical focus. Local search announces empty results and the clear action works.
- Cold and cached cross-page navigation focuses the new h1 with the updated title. Same-page controls retain focus. The deterministic test also verifies no focus theft when a user moves elsewhere during a pending request. Background refresh does not refocus.
- Native theme arrow keys, clickable labels, one checked radio, explicit persistence and System restoration work. Last updated toggles with Space/Enter; Legal, theme group and GitHub remain keyboard reachable in order.
- Reduced-motion menu/scrolling and skeleton animation checks pass. Injected staging-browser navigation failure retains a useful shell and one primary heading with an accessible alert. Initial materialized-store failure is independently covered by SSR/hydration and Worker HTTP tests, without breaking a live publication.

The bounded live server verification made **34 staging requests**, covering warm/cold routes and API/search/query/exact state, canonical/noindex rules, cache headers, 404/400, robots and Access. All measured normal route/API responses report **0 D1 queries and 0 D1 rows**.

### Production second

The same application source was built for production after staging passed. Deployment: `54ba9417-c3d2-46ff-ac44-1da431d9cdde`; timestamp `2026-09-28 10:48:41 UTC`. Production READ_STORE remains separate; there is no public D1 binding or fallback. No materialization, migration or data mutation was needed.

Six representative production route states (home, model, benchmark version, organization, exact result and 404) plus three interactive-state axe checks passed with **zero violations**. Mobile menu/search, sorting, pagination/local search, cached navigation, theme/footer and reflow checks passed. No client exceptions were observed. Lighthouse reports no browser console errors; app staging diagnostics/markers are absent.

The bounded live production verification made **32 requests**, confirming normal public D1 queries/rows = **0**, materialized cache hits, initial HTML/bootstrap, canonical/exact-result indexing rules, query noindex, production robots and real 404/400 statuses. This was a fixed sample, not a crawl. Sitemap generation/SEO and route contracts remain covered by the passing app suite.

### Contrast, touch, zoom and browser features

| Rendered contrast | Light | Dark |
| --- | ---: | ---: |
| Body text/background | 17.72:1 | 17.05:1 |
| Muted text/strong surface (lowest tested text pairing) | 5.20:1 | 6.05:1 |
| Link/strong surface | 10.46:1 | 7.18:1 |
| Focus/strong surface | 6.00:1 | 7.26:1 |
| Control boundary/surface | 3.55:1 | 4.03:1 |
| Staging banner white/red | 6.53:1 | 6.53:1 |

Muted metadata, placeholders and disabled pagination use the same passing text tokens. Error text inherits the normal text tokens. Skeletons are decorative and hidden, with static reduced-motion geometry. Underlines/shape/weight plus native selected, expanded, disabled and sort state provide non-color cues. Forced-color focus outlines use system Highlight and selected navigation/theme underlines remain visible; CSS regression coverage exists, without claiming a physical Windows high-contrast session.

Measured mobile controls include menu 44×44, Search approximately 68×44, nav links 358×44, Legal 44×44, GitHub 44×44 and Last updated approximately 198×44 CSS px. Theme labels and result tabs have 44 px minimum hit areas; table links retain 24 px minimum height, preserving compact data rows. Native table captions, scoped column headings and contextual source/score links remain in the accessibility tree; Score is non-sortable. Decorative icons are hidden, with names on their controls.

At 320 px with **200% text sizing**, the page has no horizontal overflow; table overflow remains contained. Header/menu, wrapping headings, pagination and footer remain usable. The oversized wordmark wraps at this deliberately severe combined setting. A separate **actual Chrome page zoom 200%** check used a disposable profile's native default zoom preference (Chromium's [zoom preference implementation](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc)). At the same 1280 px window, the layout viewport changed 1280→640 CSS px and DPR 1→2; document width equals viewport in both states, and mobile menu/search and footer remained usable. This is distinct from CSS text resize or device emulation. No user browser profile was modified.

### Lighthouse before and after

| Production homepage | Performance | Accessibility | Best Practices | SEO | Agentic Browsing |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before: mobile | 98 | 96 | 81 | 100 | 100 |
| Before: desktop | 99 | 90 | 81 | 100 | 50 |
| After: mobile | **98** | **100** | 81 | **100** | **100** |
| After: desktop | **97** | **100** | 81 | **100** | **100** |

After: mobile LCP 1422 ms / TBT 155 ms / CLS 0; desktop LCP 896 ms / TBT 58 ms / CLS 0. Both pass the existing P11.9 regression thresholds. The user-provided P11.9 Performance baseline was 97/99; the fresh pre-change pair was 98/99.

The known invalid-ARIA, target-size and malformed-tree audits now pass. Agentic Browsing scores **100**: its accessibility-tree check passes, and both scored checks pass (**2/2**, tree and CLS), compared with desktop 1/2 before. The second scored check is layout stability, not a separate screen-reader test. Chrome's native accessibility tree shows logical h1/h2/h3 hierarchy, main/header/footer and named sections/navigation, with no unnamed buttons in the inspected homepage state.

Performance results varied while Cloudflare's injected `cdn-cgi/challenge-platform/scripts/precursor/main.js` ran. Initial parallel audits scored 88/93; the first isolated mobile run scored 89 with a 488 ms challenge-script task/TBT 438 ms. The final isolated mobile run scored 98/TBT 155 ms, and desktop 97/TBT 58 ms. Those intermediate reports are retained in the evidence summary, rather than hidden. The app's measured mobile scripting changed approximately 68→77 ms; the large blocking task belongs to the injected script. No Cloudflare security settings were changed. Best Practices remains 81 because the same Cloudflare script uses two deprecated browser APIs (StorageType.persistent and Protected Audience); this is an existing external failure, unrelated to app semantic correctness.

### Evidence

- [Browser/axe, keyboard, contrast, tree and zoom evidence](p11-10-browser.json)
- [Lighthouse baseline/final/intermediate summaries](p11-10-lighthouse.json)
- [Staging server/cache/environment evidence](p11-10-staging-live.json)
- [Production server/cache/SEO/status evidence](p11-10-production-live.json)

## Limits and deferred work

No physical VoiceOver/NVDA session, physical mobile touch-device verification or complete multi-browser assistive-technology certification is claimed. Native Mac app inspection did not yield a practical screen-reader/zoom session; the actual zoom verification used the disposable Chrome profile described above. Browser accessibility snapshots and native semantics plus automated real-key events provide bounded screen-reader-oriented evidence. axe in jsdom cannot measure contrast or layout; those checks run in rendered Chrome. Safari list semantics were addressed through explicit list roles on styled native lists, but Safari/Firefox were not physically tested. Existing external Cloudflare deprecation warnings and automated contrast `incomplete` nodes are documented above.

P11.11 owns Legal/Privacy/Contact content, support behavior, invocation-log changes, observability/privacy hardening and retention disclosures. P11.12 owns the final launch audit. None is implemented here.

P11.10 complete: YES.
P11.11 was not started.
