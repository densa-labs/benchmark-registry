import { IS_STAGING } from "./build";
import { useEffect, useRef } from "react";
import type { InitialDocument } from "./bootstrap";
import { applyNavigationHead, DocumentCache, parseBrowserDocument, readNavigationHead, type BrowserDocument } from "./document-cache";
import { locallySortedDocument } from "./local-sort";
import { resolveRegistryRoute, type RegistryRoute } from "./registry";
import { navigationNotice, type NavigationNotice } from "./navigation-accessibility";

export function navigateRegistry(href: string) {
  if (window.dispatchEvent(new CustomEvent("registry:navigate",{detail:href,cancelable:true}))) window.location.assign(href);
}

export function useDocumentNavigation(initial: InitialDocument | undefined, onLoad: (document: BrowserDocument, notice?: NavigationNotice) => void, onError: (message: string) => void, onPending: (route?: RegistryRoute) => void) {
  const callbacks = useRef({onLoad,onError,onPending});
  useEffect(() => {callbacks.current={onLoad,onError,onPending};},[onLoad,onError,onPending]);
  useEffect(() => {
    const cache = new DocumentCache();
    let current: BrowserDocument | undefined = initial ? {...initial,href:window.location.pathname+window.location.search,head:readNavigationHead(document),time:Date.now()} : undefined;
    if (current && !initial?.failure) cache.put(current);
    let controller: AbortController | undefined;
    let sequence = 0;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    let intentTimer: ReturnType<typeof setTimeout> | undefined;
    const prefetchController=new AbortController();
    const preparing=new Map<string,Promise<void>>();
    const attempted=new Set<string>();
    const clearLoading = () => {if(loadingTimer) clearTimeout(loadingTimer);loadingTimer=undefined;callbacks.current.onPending(undefined);};
    const scrolls = new Map<string,number>();
    const supported = (url: URL) => url.origin === window.location.origin && resolveRegistryRoute(url.pathname).kind !== "not-found";
    const prepare = (url: URL) => {
      const href=url.pathname+url.search;
      if (!supported(url) || url.hash || url.searchParams.has("q") || cache.display(href) || attempted.has(href) || attempted.size >= 24 || preparing.size >= 3) return;
      attempted.add(href);
      const pending=fetch(href,{headers:{Accept:"text/html","X-Registry-Prefetch":"edge-only"},signal:prefetchController.signal,cache:"no-cache"})
        .then(async(response)=>{
          if (response.status !== 200 || !["hit","miss"].includes(response.headers.get("X-Registry-Cache") ?? "")) return;
          const next=parseBrowserDocument(await response.text(),response.url || href,response.headers.get("X-Registry-Revision") ?? undefined);
          if (!prefetchController.signal.aborted) cache.put(next);
        }).catch(()=>undefined).finally(()=>preparing.delete(href));
      preparing.set(href,pending);
    };
    const intent=(event: Event) => {
      if (!(event.target instanceof Element)) return;
      const link=event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || link.target && link.target !== "_self") return;
      if(intentTimer) clearTimeout(intentTimer);
      const url=new URL(link.href);
      if(event.type === "pointerover") intentTimer=setTimeout(()=>prepare(url),75);
      else prepare(url);
    };
    const warmTimer=setTimeout(()=>document.querySelectorAll<HTMLAnchorElement>('.primary-nav a[href]').forEach((link)=>prepare(new URL(link.href))),400);
    const navigate = async (url: URL, pop = false) => {
      const originFocus = document.activeElement;
      const id = ++sequence;
      const started=performance.now();
      controller?.abort();clearLoading();controller=new AbortController();
      const signal=controller.signal;
      const oldHref=current?.href;
      if (oldHref) scrolls.set(oldHref,window.scrollY);
      try {
        const href=url.pathname+url.search;
        let next = cache.display(href);
        if (!next && current && cache.display(current.href)) next=locallySortedDocument(current,url);
        let cached = next;
        const commit = (next: BrowserDocument, refresh = false) => {
          if (signal.aborted || id !== sequence) return;
          clearLoading();cache.put(next);current=next;
          if (!refresh && !pop) history.pushState(null,"",next.href);
          else if (refresh && new URL(next.href,window.location.origin).href !== window.location.href) history.replaceState(null,"",next.href);
          const samePage=oldHref?.split("?")[0] === new URL(next.href,window.location.origin).pathname;
          applyNavigationHead(next.head);callbacks.current.onLoad(next, refresh ? undefined : navigationNotice(next, samePage, pop, originFocus));
          if (!refresh) {
            window.dispatchEvent(new Event("registry:navigated"));
            if (IS_STAGING) requestAnimationFrame(()=>requestAnimationFrame(()=>console.info("[registry] navigation",JSON.stringify({route:next.loaded.kind,cache:cached ? "browser" : "network",duration_ms:Math.round(performance.now()-started)}))));
            if (pop) window.scrollTo({top:scrolls.get(next.href) ?? 0,behavior:"instant"});
            else if (!samePage) window.scrollTo({top:0,behavior:"instant"});
          }
        };
        const retrieve = async () => {
          const response=await fetch(href,{headers:{Accept:"text/html"},signal,cache:cached ? "no-cache" : "default"});
          if (response.headers.get("X-Registry-Cache") === "stale") throw new Error("The registry is temporarily unavailable. Showing previously loaded data.");
          if (!response.ok && response.status !== 404) throw new Error("The registry data could not be loaded.");
          return parseBrowserDocument(await response.text(),response.url || href,response.headers.get("X-Registry-Revision") ?? undefined);
        };
        if (cached) {
          commit(cached);
          // Stable known content wins the first frame; expiry checks run quietly.
          if (!cache.peek(href)) {
            const validated=await cache.get(href);
            if (signal.aborted || id !== sequence) return;
            if (validated) {current=validated;return;}
            commit(await retrieve(),true);
          }
          return;
        }
        clearLoading();
        loadingTimer=setTimeout(()=>{if(!signal.aborted && id === sequence) callbacks.current.onPending(resolveRegistryRoute(url.pathname));},150);
        await preparing.get(href);
        if(signal.aborted || id !== sequence) return;
        cached=cache.peek(href);
        next=await cache.get(href) ?? await retrieve();
        commit(next);
      } catch (error) {
        if (!signal.aborted && id === sequence) {clearLoading();callbacks.current.onError(error instanceof Error ? error.message : "The registry data could not be loaded.");}
      }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link=event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || link.target && link.target !== "_self") return;
      const url=new URL(link.href);
      if (!supported(url) || url.hash || url.href === window.location.href) return;
      event.preventDefault();void navigate(url);
    };
    const submit = (event: SubmitEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;
      const form=event.target;
      if (form.method !== "get" || form.target && form.target !== "_self") return;
      const url=new URL(form.action);
      if (!supported(url)) return;
      url.search=new URLSearchParams([...new FormData(form)].map(([key,value])=>[key,String(value)])).toString();
      // Blank optional search is equivalent to clearing the field, not API q=''.
      if (url.searchParams.get("q") === "") url.searchParams.delete("q");
      event.preventDefault();void navigate(url);
    };
    const pop = () => {const url=new URL(window.location.href);if(supported(url)) void navigate(url,true);};
    const custom = (event: Event) => {
      const url=new URL((event as CustomEvent<string>).detail,window.location.href);
      if (!supported(url)) return;
      event.preventDefault();void navigate(url);
    };
    document.addEventListener("click",click);document.addEventListener("submit",submit);
    document.addEventListener("pointerover",intent);document.addEventListener("focusin",intent);document.addEventListener("touchstart",intent,{passive:true});
    window.addEventListener("popstate",pop);window.addEventListener("registry:navigate",custom);
    const oldRestoration=history.scrollRestoration;history.scrollRestoration="manual";
    return () => {
      sequence++;controller?.abort();prefetchController.abort();clearTimeout(warmTimer);if(intentTimer) clearTimeout(intentTimer);if(loadingTimer) clearTimeout(loadingTimer);history.scrollRestoration=oldRestoration;
      document.removeEventListener("click",click);document.removeEventListener("submit",submit);
      document.removeEventListener("pointerover",intent);document.removeEventListener("focusin",intent);document.removeEventListener("touchstart",intent);
      window.removeEventListener("popstate",pop);window.removeEventListener("registry:navigate",custom);
    };
  },[initial]);
}
