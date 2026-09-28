# P11.8 — UI & Responsive Polish

P11.8 complete: YES

P11.9 was not started.

## Scope and initial audit

Inspected the existing shared shell, typography, metadata, tables, pagination,
loading states, Worker initial documents, and client startup before changing them.
Browser inspection covered the homepage, Models, model detail, Benchmarks,
benchmark family/version, Organizations, organization detail, and selected exact
results, at desktop/mobile widths and in Light/Dark themes. Staging was also
inspected through the existing authenticated Cloudflare Access session.

The main issues were the compressed mobile header with a hidden wordmark,
generic five-column loaders on unrelated pages, the homepage's large static
loading blocks, first-column mobile stickiness, platform-dependent arrow glyphs,
and replacement of the Worker-rendered page during client startup. Fixes use the
shared components/styles rather than separate page-specific visual systems.

## Implementation

- Body/UI typography uses the system stack; technical values retain
  `ui-monospace`. The shared content gap is 56 px on desktop and 40 px on mobile.
  Models, Benchmarks, and Organizations have identical heading/subtitle/search/
  primary-table rhythm. Browser measurements at 1280 px were heading y=117,
  subtitle y=166.398, and table y=381.484 for all three indexes.
- Route loaders reproduce their page header, metadata labels, local search,
  results controls, tabs, column count/order, primary-column widths, and numeric
  alignment. Homepage loading uses the actual intro, two model lists, and
  directory structure. All skeletons share a subdued two-second shimmer, gated
  by `prefers-reduced-motion: no-preference`. Removed the old override that
  changed its appearance and geometry. Loading headings, metadata labels, and
  table headers now also use silhouette placeholders; only visually hidden status
  announcements contain loading text.
- Worker documents now use React's hydratable server renderer and include
  escaped, request-local initial data. The client hydrates the same loaded page
  components without replacing them with a loader or repeating the startup read.
  Missing entities use the same visible not-found shell with real HTTP 404.
  Malformed-query normalization remains consistent between server and client.
  Initial content, ordinary anchors, tables, metadata, and pagination remain
  visible/crawlable; no hidden SEO-only text was added.
- The mobile header preserves the full mark/wordmark and expands a search-first
  menu: Search, Models, Benchmarks, Organizations. SVG hamburger/close controls,
  44 px targets, subtle active-section treatment, navigation dismissal, global
  Escape dismissal with focus return, and reduced-motion handling are shared.
  The expansion does not move the main content. Its link region can accept
  future navigation items without changing the shell. Opening and closing use
  restrained 200 ms grid/slide transitions with a short fade. Mobile header inset
  is 16 px. Navigation and result tabs retain their previous bottom-edge active
  indicators; the temporary text-underline changes were reverted on request.
- The shared sticky header uses cumulative direction thresholds (32 px down,
  10 px up), clamps elastic overscroll, and resets on resize/page restoration.
  An open menu or keyboard-focused header stays visible. The staging banner is
  a separate layer in the sticky shell and remains visible while the header hides.
- Sort indicators are 12 px `currentColor` SVGs: paired chevrons when unsorted,
  one up/down chevron when active. The full header link remains the target and
  existing `aria-sort` semantics remain intact. Score remains non-sortable.
- Organization detail tables now use
  `Model | Benchmark | Score | Source | Registry No.` with existing links and
  sorting preserved. Removed mobile sticky cells and negative table margins.
  Tables scroll within their container; header and cell positions match after
  horizontal scrolling, while page-level scroll remains zero. Narrow result
  tabs no longer show an accidental one-pixel vertical scrollbar.
- Shared metadata wraps long values within its grid. Source links retain a
  restrained underline and use a small diagonal SVG. Pagination preserves
  50/100/500, default 50, native GET navigation, and existing disabled semantics;
  mobile controls are consistently 44 px tall. Empty/error wording remains
  factual and the existing real-404 behavior remains intact.
- The single footer theme control has Light, Dark, and System radio choices.
  Explicit choices persist; System removes the explicit root theme and follows
  OS CSS media queries. System is the fresh-session default in either OS palette.
  An early head script applies saved choices before paint.
  The hydrating control synchronizes its selected state without mismatches.
- Header and favicon marks share one small SVG path. Production provides
  `/favicon.svg`, `/favicon-light.svg`, and `/favicon-dark.svg`, with OS media
  links and an adaptive fallback. Staging emits only `/favicon-staging.svg`,
  always red and independent of the page theme. The final favicon uses the
  previously approved size; the requested temporary shrink was reverted.
- Desktop footer balances copyright/data date on the left, Legal in the center,
  and theme/GitHub controls on the right. Mobile puts Legal at the upper right,
  themes at the lower left, and GitHub at the lower right. Legal links
  to `/legal`; the center link region can later accept Documentation and API.
  GitHub is an accessible, monochrome SVG-only link to
  `https://github.com/densa-labs/benchmark-registry`.
- Last updated defaults to `September 26, 2026`. Its unobtrusive native button
  toggles to the environment's fixed build timestamp and back, including
  keyboard activation. It has no pointer cursor, underline, icon, or hover
  treatment. The value is compiled at build time, never calculated from the
  visitor's clock. Both the footer timestamp and staging banner display that
  same injected UTC instant in the viewer's timezone, with an explicit UTC
  offset. Hydration starts with the matching UTC server snapshot before resolving
  the local zone. The date-only Registry data date is preserved as recorded.
- Staging alone displays an always-sticky thin red timestamp banner and exactly
  `STAGING | Benchmark Registry` as its document title. Limited console messages
  identify staging, build timestamp/commit identity, route kind, theme resolution,
  failed API status, and unexpected client errors. They do not include URLs,
  query strings, payloads, credentials, request bodies, or visitor identifiers.
  Production excludes the visible staging identity and diagnostic messages.

## Deployment and verification

D1 quota recovery was confirmed before deployment verification with bounded
`SELECT registry_no FROM models LIMIT 1` checks against both environments.
Each succeeded with **one row read and zero writes**. A further one-row
production check succeeded immediately before the production gate. No production
crawl, sitemap enumeration, integrity audit, or remote data write was performed.

Final staging deployment:

- Worker version: `01086cc1-1f6c-403c-94e0-8b494e0e4c30`
- Build timestamp: `2026-09-28 04:56:48` UTC
- Exact staging title/banner timestamp verified in the browser.
- Red favicon configuration, startup console identity, persisted themes,
  timestamp toggle, mobile menu, global Escape, result tabs, organization order,
  SVG sorting, and horizontal table alignment verified.
- Representative direct routes included every page type and an exact result.
  No hydration errors or unexpected browser warnings were observed.
- Unauthenticated homepage/API/robots remained behind Access redirects. Build
  configuration and Worker tests confirm isolated staging D1, protective noindex
  headers, and robots `Disallow: /`. The in-app browser blocked navigation to
  robots.txt itself, so authenticated live robots content was not re-read there.

Final production deployment, after the staging gate:

- Worker version: `73e45f83-488a-48bd-8c3b-821966213ac4`
- Build timestamp: `2026-09-28 04:57:31` UTC
- Same application source, with production environment definitions/assets.
- No staging banner/title/red favicon/console identification appeared.
- All page types, exact-result state, desktop/mobile Light/Dark/System controls,
  persistence, footer/date toggle, organization order, and both SVG sort
  directions were verified in the browser. Production console was quiet.
- During the initial polish verification, a bounded set of **16 HTTP checks** passed: 11 documents including an
  empty filtered result and a real entity 404, three SVG favicons, robots, and
  one 50-row API response. Existing titles, canonical/indexing policy, initial
  content/bootstrap, API noindex header, and status behavior were retained.
- Browser inspection confirmed production media matching for the current light
  OS scheme and successful SVG responses. Dark favicon contrast/media behavior
  is also covered by deterministic asset/configuration tests. Physical iOS/
  Android devices and changing the host OS scheme were not part of this run.

Normal direct entry/reloads and a local proxy delaying JavaScript startup by
2.5 seconds were checked across all nine representative page states. Each kept
one visible primary title and the loaded page during startup, with no loader
replacement or hydration warning. A separate local-only preview delayed API
responses and omitted bootstrap markup to exercise each fallback skeleton in
Light/Dark. Desktop 1280 px and mobile 390/320 px checks found no page overflow.

Fast server-rendered pages already contain loaded content, so they do not show
an artificial loader. During a real pending native navigation, after 120 ms the
shared shell shows the destination route skeleton without intercepting navigation
or fetching extra data. The 120 ms threshold delays only the indicator, never
requests or page loading; no artificial loading duration exists in the app.
A local eight-second document delay verified 36 visible
skeleton elements before the Models document arrived. Global search also shows
shimmer rows while its request is pending. Page restoration/Escape clears the
navigation feedback. No navigation/cache/performance architecture was changed.

The P11.8 deployments were checked for 320 px banner fit,
16 px mobile branding inset, sticky banner/hide/reveal behavior, footer geometry,
localized stable timestamps, System persistence, Light/Dark switching, menu
navigation, desktop layout, and quiet production console. At Asia/Manila the
production build displays `2026-09-28 12:57:31 UTC+08:00`; its UTC instant remains
`2026-09-28 04:57:31`. Earlier bounded 16-check production runs passed.

The underline/silhouette follow-up restored the previous navigation/tab bottom
indicators and removed visible text from every route loader. Eight deterministic
route cases and actual light/dark static previews confirm silhouette-only loading.
The native GET submission test confirms navigation is never canceled or delayed
by the indicator threshold. A single-row production D1 read succeeded before
verification. Final staging/production checks used representative browser pages;
no production crawl or repeat integrity audit was performed. These corrections
were verified/deployed from an isolated checkout to exclude concurrent work.

## Automated evidence

- `npm test`: **290 tests across 15 files passed**.
- `npm run test:links`: **8 offline fixture tests passed**; no live audit invoked.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- Staging and production builds: passed.
- `verify:staging` / `verify:production`: environment/database isolation,
  favicon selection, exact staging title, fixed timestamp parity, hydration
  bootstrap, early theme application, and production identity exclusion passed.
- `git diff --check`: passed; final diff reviewed for frozen-contract changes.

New deterministic cases cover menu states/navigation/global Escape, three-state
themes/persistence/hydration, footer links and timestamp toggle, SVG sort states,
loaded organization column order, loader structures/reduced-motion CSS,
environment gating, favicon assets, staging diagnostics, JSON escaping, and
server/client markup compatibility through actual Worker routes (including 404).
Additional cases cover timezone offsets/DST, cumulative scroll thresholds,
overscroll/menu pinning, and native GET navigation feedback with restoration.

Raw local evidence is in `/private/tmp/p118-underline-tests-isolated.log`,
`/private/tmp/p118-underline-staging.log`,
`/private/tmp/p118-underline-production.log`, and
`/private/tmp/p118-production-representative.json`. Production screenshots are
saved in the Codex visualization directory for this task.

## Deliberate boundaries

No unresolved major visual issue remains from this pass. No runtime icon,
animation, shimmer, or component library was introduced. Lighthouse was not
re-run and no new performance score is claimed.

The Legal footer link is present; `/legal` content/routes remain P11.11 work.
The future Support link must use `mailto:support@benchmarkregistry.org` with the
same diagonal SVG handoff convention. No legal documents were implemented here.

Keyboard menu/theme behavior, icon labels, focus visibility, and reduced motion
were addressed within P11.8. The comprehensive ARIA, screen-reader, contrast,
touch-target, and 404-heading review remains P11.10.

P11.9 query plans, caching, invalidation, capacity/read-efficiency calculations,
pagination/sorting speed architecture, and dedicated bundle/performance work
were not started. Pagination still uses its existing native navigation.
