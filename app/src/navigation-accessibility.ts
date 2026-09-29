import type { BrowserDocument } from "./document-cache";

export interface NavigationNotice {
  focus: "heading" | "restore" | "none";
  element?: Element | null;
  id?: string;
  key?: string | null;
  message: string;
}

export function navigationNotice(next: BrowserDocument, samePage: boolean, pop: boolean, origin: Element | null): NavigationNotice {
  const active = document.activeElement;
  const moved = active !== origin && active !== document.body;
  const params = new URLSearchParams(next.currentSearch);
  const page = next.loaded.kind === "models" || next.loaded.kind === "benchmarks" || next.loaded.kind === "companies"
    ? next.loaded.payload.page
    : next.loaded.kind === "model" || next.loaded.kind === "benchmark-version" || next.loaded.kind === "company"
      ? next.loaded.payload.data.result_page : undefined;
  const title = new DOMParser().parseFromString(`<head>${next.head}</head>`, "text/html").title;
  return {
    focus: moved ? "none" : samePage && !pop ? "restore" : "heading",
    element: origin,
    id: origin?.id,
    key: origin?.closest("[data-focus-key]")?.getAttribute("data-focus-key"),
    message: [title, page ? `${page.total_items} ${next.loaded.kind === "models" ? "models" : next.loaded.kind === "benchmarks" ? "benchmark families" : next.loaded.kind === "companies" ? "organizations" : "results"}. Page ${page.number} of ${Math.max(1, page.total_pages)}.` : "",
      params.has("sort") ? `Sorted by ${params.get("sort")?.replaceAll("_", " ")}, ${params.get("order") === "desc" ? "descending" : "ascending"}.` : "",
      params.has("view") ? `${params.get("view")} view.` : "",
      params.has("company") ? `Provider: ${params.get("company")}.` : "",
      params.has("result") ? "Selected evaluation." : "",
    ].filter(Boolean).join(" "),
  };
}

export function focusNavigation(notice: NavigationNotice) {
  if (notice.focus === "none") return;
  const main = document.getElementById("main-content");
  const restored = notice.id ? document.getElementById(notice.id)
    : notice.key ? [...document.querySelectorAll<HTMLElement>("[data-focus-key]")].find(el => el.getAttribute("data-focus-key") === notice.key)
      : notice.element?.isConnected ? notice.element : undefined;
  const target = notice.focus === "restore" ? restored ?? main?.querySelector(".results-section h2") ?? main
    : main?.querySelector("h1") ?? main;
  if (target instanceof HTMLElement) {
    if (!target.matches("a[href],button,input,select,[tabindex]")) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
}
