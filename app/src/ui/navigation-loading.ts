import { useEffect, useState } from "react";
import { resolveRegistryRoute, type RegistryRoute } from "../registry";

interface PendingNavigation { route: RegistryRoute; height: number }

export function navigationRoute(href: string, current: string) {
  const destination = new URL(href, current);
  const source = new URL(current);
  if (destination.origin !== source.origin) return null;
  if (destination.pathname === source.pathname && destination.search === source.search) return null;
  const route = resolveRegistryRoute(destination.pathname);
  return route.kind === "not-found" ? null : route;
}

// Visual feedback only: native anchors/GET forms still perform the navigation.
export function useNavigationLoading(enabled: boolean) {
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clearTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
    const reset = () => { clearTimer(); setPending(null); };
    const begin = (route: RegistryRoute | null) => {
      if (!route) return;
      clearTimer();
      timer = setTimeout(() => {
        setPending({ route, height: document.getElementById("main-content")?.getBoundingClientRect().height ?? 0 });
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 120);
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      begin(navigationRoute(link.href, window.location.href));
    };
    const submit = (event: SubmitEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;
      const form = event.target;
      if (form.method !== "get" || (form.target && form.target !== "_self")) return;
      const destination = new URL(form.action, window.location.href);
      destination.search = new URLSearchParams([...new FormData(form)].map(([key, value]) => [key, String(value)])).toString();
      begin(navigationRoute(destination.href, window.location.href));
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") reset(); };
    document.addEventListener("click", click);
    document.addEventListener("submit", submit);
    window.addEventListener("pagehide", clearTimer);
    window.addEventListener("pageshow", reset);
    window.addEventListener("keydown", escape);
    return () => {
      clearTimer();
      document.removeEventListener("click", click);
      document.removeEventListener("submit", submit);
      window.removeEventListener("pagehide", clearTimer);
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("keydown", escape);
    };
  }, [enabled]);
  return pending;
}
