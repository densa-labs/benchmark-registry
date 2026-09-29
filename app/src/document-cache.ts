import type { InitialDocument } from "./bootstrap";
import { setSearchGeneration } from './registry';

export interface BrowserDocument extends InitialDocument { href: string; head: string; time: number }
export const DOCUMENT_TTL = 60_000;
export const DOCUMENT_STALE_LIMIT = 300_000;
const MAX_ENTRIES = 24;

export function documentKey(href: string): string {
  const url = new URL(href, "https://registry.invalid");
  url.searchParams.sort();
  return url.pathname + url.search;
}

export class DocumentCache {
  private entries = new Map<string, BrowserDocument>();
  private revision?: string;
  private checked = 0;
  private checking?: Promise<string>;
  private retired = new Set<string>();

  private changeRevision(token: string) {
    if (this.retired.has(token)) throw new Error("The registry returned an older revision. Please retry shortly.");
    if (this.revision && this.revision !== token) {
      this.retired.add(this.revision);
      if (this.retired.size > MAX_ENTRIES) this.retired.delete(this.retired.values().next().value!);
      this.entries.clear();
    }
    this.revision=token;
    setSearchGeneration(token);
  }

  put(document: BrowserDocument) {
    if (document.revision && document.revision !== this.revision) {
      this.changeRevision(document.revision);
      this.checked = document.time;
    }
    const key = documentKey(document.href);
    this.entries.delete(key);
    this.entries.set(key,document);
    if (this.entries.size > MAX_ENTRIES) this.entries.delete(this.entries.keys().next().value!);
  }

  peek(href: string, now = Date.now()) {
    const entry = this.entries.get(documentKey(href));
    if (entry && now - entry.time < DOCUMENT_TTL) return entry;
  }

  display(href: string, now = Date.now()) {
    const entry = this.entries.get(documentKey(href));
    return entry && now - entry.time < DOCUMENT_STALE_LIMIT ? entry : undefined;
  }

  async get(href: string, fetcher: typeof fetch = fetch, now = Date.now()) {
    const fresh = this.peek(href,now);
    if (fresh) return fresh;
    const entry = this.entries.get(documentKey(href));
    if (!entry?.revision) return undefined;
    if (now - this.checked >= DOCUMENT_TTL) {
      this.checking ??= fetcher("/api/revision",{headers:{Accept:"application/json"},cache:"no-cache"})
        .then(async (response) => {
          if (!response.ok || response.headers.get("X-Registry-Cache") === "stale") throw new Error("Revision unavailable.");
          const body = await response.json() as {revision:string};
          if (!/^[a-f0-9]{32}$/u.test(body.revision)) throw new Error("Invalid revision.");
          return body.revision;
        });
      try {
        const token = await this.checking;
        this.checked = now;
        if (token !== this.revision) {this.changeRevision(token); return undefined;}
      } catch {return undefined;} finally {this.checking=undefined;}
    }
    if (entry.revision !== this.revision) return undefined;
    const renewed = {...entry,time:now};
    this.put(renewed);
    return renewed;
  }
}

export function parseBrowserDocument(html: string, href: string, revision?: string): BrowserDocument {
  const parsed = new DOMParser().parseFromString(html,"text/html");
  const text = parsed.getElementById("registry-initial-document")?.textContent;
  if (!text) throw new Error("The registry data could not be loaded.");
  const initial = JSON.parse(text) as InitialDocument;
  if (!initial.loaded || typeof initial.currentSearch !== "string" || !["home","models","model","benchmarks","benchmark","benchmark-version","companies","company","not-found"].includes(initial.loaded.kind)) throw new Error("Invalid Registry document.");
  if (initial.loaded.kind !== "not-found" && !("payload" in initial.loaded)) throw new Error("Invalid Registry payload.");
  const url=new URL(href,window.location.origin);
  return {...initial,revision:revision ?? initial.revision,href:url.pathname+url.search,head:readNavigationHead(parsed),time:Date.now()};
}

export function readNavigationHead(document: Document): string {
  return [...document.head.querySelectorAll('title, meta[name="description"], meta[name="robots"], meta[property^="og:"], link[rel="canonical"]')].map((element) => element.outerHTML).join("\n");
}
export function applyNavigationHead(head: string) {
  const parsed = new DOMParser().parseFromString(`<head>${head}</head>`,"text/html");
  document.head.querySelectorAll('title, meta[name="description"], meta[name="robots"], meta[property^="og:"], link[rel="canonical"]').forEach((element) => element.remove());
  [...parsed.head.children].forEach((element) => document.head.appendChild(document.importNode(element,true)));
}
