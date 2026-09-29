// @vitest-environment jsdom
import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { App, RegistryDocument } from "./App";
import { accessibilityRoutes } from "./accessibility-fixtures";
import { AppShell, GlobalSearch, LoadingState, NotFoundState } from "./ui/components";
import { serializeInitialDocument } from "./bootstrap";
import { Header, Pagination } from "./ui/components";
import { HomeLoadingState } from "./home-page";
import { RouteLoadingState } from "./ui/route-loading";
import { readFileSync } from "node:fs";
import { navigationNotice } from "./navigation-accessibility";

let container: HTMLDivElement;
let root: Root | undefined;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  window.scrollTo = vi.fn();
  document.documentElement.lang = "en";
  document.head.innerHTML = "<title>Registry test</title>";
  container = document.createElement("div"); document.body.appendChild(container);
});
afterEach(async () => {
  if (root) await act(() => root?.unmount()); root = undefined;
  document.body.replaceChildren(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});
async function mount(node: React.ReactNode) { root = createRoot(container); await act(() => root?.render(node)); }
async function click(element: Element) { await act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))); }

it.each(accessibilityRoutes)("has sound initial and hydrated semantics on $path", async ({ path, loaded }) => {
  history.replaceState(null, "", path);
  const initial = { loaded, currentSearch: "" };
  container.innerHTML = renderToString(<App initial={initial} />);
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  const errors = vi.fn();
  await act(() => { root = hydrateRoot(container, <App initial={initial} />, { onRecoverableError: errors }); });
  expect(errors).not.toHaveBeenCalled();
  expect(container.querySelectorAll("main")).toHaveLength(1);
  expect(container.querySelectorAll("footer")).toHaveLength(1);
  expect(container.querySelector("main")?.getAttribute("tabindex")).toBe("-1");
  for (const th of container.querySelectorAll("thead th")) expect(th.getAttribute("scope")).toBe("col");
  for (const table of container.querySelectorAll("table")) expect(table.querySelector("caption")?.textContent).toBeTruthy();
  for (const el of container.querySelectorAll("[aria-controls]")) expect(document.getElementById(el.getAttribute("aria-controls")!)).not.toBeNull();
  const ids = [...container.querySelectorAll("[id]")].map(el => el.id);
  expect(new Set(ids).size).toBe(ids.length);
  const result = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
});

it("exposes exactly the current primary sort, including benchmark name default", () => {
  for (const kind of ["models", "benchmarks", "companies"] as const) {
    const loaded = accessibilityRoutes.find(x => x.loaded.kind === kind)!.loaded;
    container.innerHTML = renderToString(<RegistryDocument loaded={loaded} currentSearch="?sort=name&order=asc" />);
    expect(container.querySelectorAll("[aria-sort]")).toHaveLength(1);
    expect(container.querySelector("[aria-sort]")?.textContent).toMatch(/Model|Benchmark|Organization/);
  }
  container.innerHTML = renderToString(<RegistryDocument loaded={accessibilityRoutes[3].loaded} currentSearch="" />);
  expect(container.querySelector("[aria-sort]")?.textContent).toBe("Benchmark");
});

it("keeps Support's name and icon semantic, and navigates legal documents with heading focus", async () => {
  history.replaceState(null, "", "/legal");
  const initial = { loaded: { kind: "legal" as const }, currentSearch: "" };
  const fetcher = vi.fn(async (input: RequestInfo | URL) => { expect(input).toBe("/privacy"); return new Response(`<html><head><title>Privacy Policy | Benchmark Registry</title></head><body><script id="registry-initial-document" type="application/json">${serializeInitialDocument({ loaded: { kind: "privacy" }, currentSearch: "" })}</script></body></html>`); });
  vi.stubGlobal("fetch", fetcher);
  await mount(<App initial={initial} />);
  const support = container.querySelector('a[href="mailto:support@benchmarkregistry.org"]')!;
  expect(support.textContent).toBe("Support");
  expect(support.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  expect(support.querySelector("svg")?.getAttribute("stroke")).toBe("currentColor");
  expect(support.hasAttribute("target")).toBe(false);
  expect(container.querySelector('.primary-nav [aria-current]')).toBeNull();
  const privacy = container.querySelector<HTMLAnchorElement>('main a[href="/privacy"]')!;
  privacy.focus(); await click(privacy);
  expect(container.querySelector("h1")?.textContent).toBe("Privacy Policy");
  expect(document.activeElement).toBe(container.querySelector("h1"));
  expect(document.title).toBe("Privacy Policy | Benchmark Registry");
  expect(container.querySelector('[data-route-status]')?.textContent).toContain("Privacy Policy");
  expect(fetcher).toHaveBeenCalled();
  expect(fetcher.mock.calls.every(([input]) => input === "/privacy")).toBe(true);
});

it("moves the skip link's keyboard focus to main", async () => {
  await mount(<AppShell navigation={[]}><h1>Registry</h1></AppShell>);
  const skip = container.querySelector<HTMLAnchorElement>(".skip-link")!;
  expect(skip.textContent?.trim()).toBe("Skip to main content");
  skip.focus(); await click(skip);
  expect(document.activeElement).toBe(container.querySelector("main"));
});

it("uses ordinary labeled search controls and a persistent restrained status", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: [], page: { number: 1, limit: 50, total_items: 0, total_pages: 0 } })));
  await mount(<GlobalSearch />);
  const input = container.querySelector<HTMLInputElement>("input")!;
  expect(input.hasAttribute("aria-expanded")).toBe(false);
  const status = container.querySelector('[role="status"]'); expect(status).not.toBeNull();
  input.value = "a11y-no-match";
  await act(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(container.querySelector('[role="status"]')).toBe(status);
  expect(status?.textContent).toContain("No registry entries");
  expect(container.querySelector("form")?.getAttribute("aria-label")).toBe("Global registry search");
});

it("keeps decorative loading geometry outside the accessibility tree", () => {
  container.innerHTML = renderToString(<LoadingState />);
  expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
  for (const bar of container.querySelectorAll(".skeleton")) expect(bar.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(container.querySelector('[aria-hidden="true"] [tabindex]')).toBeNull();
});

it("keeps the real 404 identity at heading level one", () => {
  container.innerHTML = renderToString(<NotFoundState />);
  expect(container.querySelector("h1")?.textContent).toBe("Registry entry not found");
});

it("focuses new page identity even on cached navigation and retains a sort control on same-page updates", async () => {
  const initial = { loaded: accessibilityRoutes[1].loaded, currentSearch: "" };
  history.replaceState(null, "", "/models");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(`<html><head><title>GPQA | Benchmark Registry</title></head><body><script id="registry-initial-document" type="application/json">${serializeInitialDocument({ loaded: accessibilityRoutes[4].loaded, currentSearch: "" })}</script></body></html>`)));
  await mount(<App initial={initial} />);
  const sort = container.querySelector<HTMLAnchorElement>('th a[href*="sort=name"]')!; sort.focus(); await click(sort);
  expect(document.activeElement?.getAttribute("data-focus-key")).toBe("sort-Model");
  expect(container.querySelector('[data-route-status]')?.textContent).toContain("ascending");
  const link = container.querySelector<HTMLAnchorElement>('.primary-nav a[href="/benchmarks"]')!; link.focus(); await click(link);
  expect(document.activeElement).toBe(container.querySelector("h1"));
  expect(container.querySelector('[data-route-status]')?.textContent).toContain("GPQA");
  await act(() => { history.replaceState(null, "", "/models"); window.dispatchEvent(new PopStateEvent("popstate")); });
  expect(document.activeElement?.textContent).toBe("Models");
});

it("names every icon-only control and exposes the footer toggle state", async () => {
  await mount(<AppShell navigation={[]}><h1>Registry</h1></AppShell>);
  expect(container.querySelector(".github-link")?.getAttribute("aria-label")).toBe("Benchmark Registry on GitHub");
  const updated = container.querySelector(".last-updated")!;
  expect(updated.getAttribute("aria-pressed")).toBe("false");
  await click(updated); expect(updated.getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector("legend")?.textContent).toBe("Color theme");
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(1);
});

it("uses a level-two navigation error while retaining the current primary heading", async () => {
  const loaded = accessibilityRoutes[1].loaded;
  container.innerHTML = renderToString(<RegistryDocument loaded={loaded} currentSearch="" navigationError="Unavailable" />);
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  expect(container.querySelector('[role="alert"] h2')).not.toBeNull();
});

it("hides closed mobile controls and restores focus on Escape without closing search and menu together", async () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  await mount(<Header navigation={[{ href: "/models", label: "Models" }]} />);
  const toggle = container.querySelector<HTMLButtonElement>(".mobile-menu-toggle")!;
  const menu = container.querySelector("#header-menu")!;
  expect(menu.hasAttribute("inert")).toBe(true);
  await click(toggle); expect(menu.hasAttribute("inert")).toBe(false);
  expect(toggle.getAttribute("aria-label")).toBe("Close menu");
  expect(menu.querySelector(".header-menu__body")?.firstElementChild?.className).toBe("global-search-shell");
  const input = container.querySelector<HTMLInputElement>("#global-search-input")!; input.focus();
  await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
});

it("uses native disabled pagination and meaningful page link names", () => {
  container.innerHTML = renderToString(<Pagination page={1} totalPages={2} getHref={page => `?page=${page}`} />);
  expect(container.querySelector<HTMLButtonElement>("button")?.disabled).toBe(true);
  expect(container.querySelector("a")?.getAttribute("aria-label")).toBe("Next page");
  expect(container.querySelector("a")?.getAttribute("data-focus-key")).toBe("page-next");
});

it("provides one exposed loading status per route, with no exposed geometry", () => {
  for (const route of accessibilityRoutes.slice(0,8)) {
    container.innerHTML = renderToString(route.path === "/" ? <HomeLoadingState /> : <RouteLoadingState route={route.loaded.kind === "model" ? { kind: "model", registryNo: "10001" } : route.loaded.kind === "company" ? { kind: "company", slug: "openai" } : route.loaded.kind === "benchmark" ? { kind: "benchmark", slug: "gpqa" } : route.loaded.kind === "benchmark-version" ? { kind: "benchmark-version", slug: "gpqa", version: "diamond" } : { kind: route.loaded.kind as "models" | "benchmarks" | "companies" }} />);
    expect([...container.querySelectorAll('[role="status"]')].filter(el => !el.closest('[aria-hidden="true"]'))).toHaveLength(1);
    for (const bar of container.querySelectorAll(".skeleton")) expect(bar.closest('[aria-hidden="true"]')).not.toBeNull();
  }
});

it("does not steal focus if the user moves to the footer while a document is in flight", async () => {
  await mount(<AppShell navigation={[]}><h1>Registry</h1><a href="/models">Models</a></AppShell>);
  const origin = container.querySelector("main a")!;
  container.querySelector<HTMLButtonElement>(".last-updated")!.focus();
  const update = navigationNotice({ loaded: accessibilityRoutes[1].loaded, currentSearch: "", href: "/models", head: "<title>Models</title>", time: Date.now() }, false, false, origin);
  expect(update.focus).toBe("none");
  expect(update.message).toContain("Models");
});

it("hydrates a read-layer failure with a primary heading and working shell controls", async () => {
  history.replaceState(null, "", "/benchmarks/gpqa");
  const initial = { loaded: { kind: "not-found" as const }, currentSearch: "", failure: "Temporarily unavailable" };
  container.innerHTML = renderToString(<App initial={initial} />);
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  const errors = vi.fn(); await act(() => { root = hydrateRoot(container, <App initial={initial} />, { onRecoverableError: errors }); });
  expect(errors).not.toHaveBeenCalled();
  expect(container.querySelector("h1")?.textContent).toContain("Unable to load");
  expect(container.querySelector(".state-message__action a")?.getAttribute("href")).toBe("");
  expect((await axe.run(document,{rules:{"color-contrast":{enabled:false}}})).violations).toEqual([]);
});

it("keeps reduced motion and forced-color focus/selected cues explicit", () => {
  const css = readFileSync("src/styles.css", "utf8");
  expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
  expect(css).toContain("transition: none; animation: none");
  expect(css).toContain("scroll-behavior: auto");
  expect(css).toContain("@media (forced-colors: active)");
  expect(css).toContain("outline-color: Highlight");
});
