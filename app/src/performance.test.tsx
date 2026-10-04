// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { serializeInitialDocument, type InitialDocument } from "./bootstrap";
import { DocumentCache, parseBrowserDocument } from "./document-cache";
import { locallySortedDocument } from "./local-sort";
import { searchRegistry, setSearchGeneration, type LoadedRegistryRoute } from "./registry";
import type { BrowserDocument } from "./document-cache";

const token="a".repeat(32);
const model=(name:string,no:string)=>({name,registry_no:no,company:{name:"OpenAI",slug:"openai"},released_at:"2026-01-01",release_precision:"date" as const,published_at:"2026-01-01T00:00:00Z",status:"active" as const});
const initial:InitialDocument={revision:token,currentSearch:"",loaded:{kind:"models",payload:{data:[model("Alpha","10001"),model("Beta","10002")],page:{number:1,limit:50,total_items:2,total_pages:1}}}};
const doc=(loaded:LoadedRegistryRoute,search="")=>`<html><head><title>Next | Benchmark Registry</title><link rel="canonical" href="https://benchmarkregistry.org/benchmarks"></head><body><script id="registry-initial-document" type="application/json">${serializeInitialDocument({loaded,currentSearch:search,revision:token})}</script></body></html>`;
let root:Root|undefined;
let container:HTMLDivElement;
beforeEach(()=>{
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);
  window.matchMedia=vi.fn().mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()});
  window.scrollTo=vi.fn();history.replaceState(null,"","/models");
  document.head.innerHTML='<title>Models | Benchmark Registry</title><link rel="canonical" href="https://benchmarkregistry.org/models">';
  container=document.createElement("div");document.body.appendChild(container);
});
afterEach(async()=>{if(root) await act(()=>root?.unmount());root=undefined;document.body.replaceChildren();vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
async function mount(){root=createRoot(container);await act(()=>root?.render(<App initial={initial}/>));}
async function click(selector:string){await act(()=>container.querySelector(selector)!.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})));}

it("hydrates initial data without any startup network request",async()=>{
  const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
  container.innerHTML=renderToString(<App initial={initial}/>);
  const errors=vi.fn();await act(()=>{root=hydrateRoot(container,<StrictMode><App initial={initial}/></StrictMode>,{onRecoverableError:errors});});
  expect(fetcher).not.toHaveBeenCalled();expect(errors).not.toHaveBeenCalled();
});
it("sorts complete rows immediately with URL/hrefs and shell preserved",async()=>{
  const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);await mount();const shell=container.querySelector(".app-shell");
  await click('th a[href*="sort=name"]');
  expect(fetcher).not.toHaveBeenCalled();expect(window.location.search).toContain("sort=name");
  expect(container.querySelector(".app-shell")).toBe(shell);
  await click('th a[href*="sort=name"]');
  expect([...container.querySelectorAll("tbody tr")].map((row)=>row.textContent)).toEqual([expect.stringContaining("Beta"),expect.stringContaining("Alpha")]);
  expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow");
  expect(container.querySelector('a[href*="sort=name"]')).not.toBeNull();expect(container.querySelector(".skeleton")).toBeNull();
});
it("local model sorting applies Registry No only when the primary key ties",()=>{
  if(initial.loaded.kind!=='models') throw new Error('Expected model fixture');
  const current:BrowserDocument={...initial,loaded:{kind:'models',payload:{...initial.loaded.payload,data:[model('Beta','10001'),model('Alpha','10009')]}},href:'/models',head:'<title>Models</title>',time:1000};
  const sorted=locallySortedDocument(current,new URL('https://registry.invalid/models?sort=name&order=asc'));
  expect(sorted?.loaded.kind).toBe('models');
  if(sorted?.loaded.kind==='models') expect(sorted.loaded.payload.data.map(row=>row.name)).toEqual(['Alpha','Beta']);
});
it("navigation reuses documents on back/forward without replacing the shell",async()=>{
  const fetcher=vi.fn(async()=>new Response(doc({kind:"benchmarks",payload:{data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}}),{headers:{"X-Registry-Revision":token}}));
  vi.stubGlobal("fetch",fetcher);await mount();const shell=container.querySelector(".app-shell");
  await click('.primary-nav a[href="/benchmarks"]');expect(fetcher).toHaveBeenCalledTimes(1);
  expect(window.location.pathname).toBe("/benchmarks");expect(document.title).toBe("Next | Benchmark Registry");expect(container.querySelector(".app-shell")).toBe(shell);
  await act(()=>{history.replaceState(null,"","/models");window.dispatchEvent(new PopStateEvent("popstate"));});
  expect(container.textContent).toContain("Alpha");expect(fetcher).toHaveBeenCalledTimes(1);
  await click('.primary-nav a[href="/benchmarks"]');expect(fetcher).toHaveBeenCalledTimes(1);
});
it("preserves useful content and cancels a stale navigation",async()=>{
  const requests:{signal:AbortSignal;resolve:(response:Response)=>void}[]=[];
  const fetcher=vi.fn((_path:string,options:{signal:AbortSignal})=>new Promise<Response>((resolve)=>requests.push({signal:options.signal,resolve})));
  vi.stubGlobal("fetch",fetcher);await mount();await click('.primary-nav a[href="/benchmarks"]');
  expect(container.textContent).toContain("Alpha");expect(container.querySelector(".skeleton")).toBeNull();
  await click('.primary-nav a[href="/companies"]');expect(requests[0].signal.aborted).toBe(true);
  await act(()=>requests[1].resolve(new Response(doc({kind:"companies",payload:{data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}}))));
  await act(()=>requests[0].resolve(new Response(doc({kind:"benchmarks",payload:{data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}}))));
  expect(window.location.pathname).toBe("/companies");
});
it("shows a cold-route skeleton at 150 ms and never for cached navigation",async()=>{
  vi.useFakeTimers();const fetcher=vi.fn(()=>new Promise<Response>(()=>undefined));vi.stubGlobal("fetch",fetcher);
  await mount();await click('.primary-nav a[href="/benchmarks"]');
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  await act(()=>vi.advanceTimersByTime(149));expect(container.textContent).toContain("Alpha");
  await act(()=>vi.advanceTimersByTime(1));expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  expect(container.textContent).not.toContain("Alpha");
});
it("renders expired cached sorts before a slow revision response",async()=>{
  vi.useFakeTimers();vi.setSystemTime(1_000_000);
  const requests:{resolve:(response:Response)=>void}[]=[];
  const fetcher=vi.fn((_href:string,options?:RequestInit)=>new Headers(options?.headers).has("X-Registry-Prefetch") ? Promise.resolve(new Response(null,{status:204})) : new Promise<Response>((resolve)=>requests.push({resolve})));vi.stubGlobal("fetch",fetcher);
  await mount();await act(()=>vi.advanceTimersByTime(61_000));
  fetcher.mockClear();
  await click('th a[href*="sort=name"]');
  expect(window.location.search).toContain("sort=name");expect(container.textContent).toContain("Alpha");
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();expect(fetcher).toHaveBeenCalledTimes(1);
  await act(()=>requests[0].resolve(Response.json({revision:token})));
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("prepares main navigation from the edge so the first click uses browser data",async()=>{
  vi.useFakeTimers();
  const fetcher=vi.fn(async(href:string,options?:RequestInit)=>{
    expect(new Headers(options?.headers).get("X-Registry-Prefetch")).toBe("edge-only");
    return href === "/benchmarks" ? new Response(doc({kind:"benchmarks",payload:{data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}}),{headers:{"X-Registry-Cache":"hit","X-Registry-Revision":token}}) : new Response(null,{status:204});
  });
  vi.stubGlobal("fetch",fetcher);await mount();await act(()=>vi.advanceTimersByTime(400));
  expect(fetcher).toHaveBeenCalledTimes(3); // Current /models is loaded; benchmarks, organizations, and compare are prepared.
  await click('.primary-nav a[href="/benchmarks"]');
  expect(window.location.pathname).toBe("/benchmarks");expect(fetcher).toHaveBeenCalledTimes(3);
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
});
it("reuses repeated identical searches without storing persistent history",async()=>{
  const fetcher=vi.fn(async()=>Response.json({data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}));
  await searchRegistry("gpt",fetcher);await searchRegistry("gpt",fetcher);expect(fetcher).toHaveBeenCalledTimes(1);
  const controller=new AbortController();controller.abort();await expect(searchRegistry("gpt",fetcher,controller.signal)).rejects.toThrow("Aborted");
});
it('retires cached search responses when a new document generation is observed',async()=>{
  let generation=token;setSearchGeneration(generation);
  const fetcher=vi.fn(async()=>Response.json({data:[],page:{number:1,limit:50,total_items:0,total_pages:0}},{headers:{'X-Registry-Revision':generation}}));
  await searchRegistry('gpt',fetcher);await searchRegistry('gpt',fetcher);expect(fetcher).toHaveBeenCalledTimes(1);
  generation='b'.repeat(32);setSearchGeneration(generation);
  await searchRegistry('gpt',fetcher);expect(fetcher).toHaveBeenCalledTimes(2);
});

describe("bounded document cache",()=>{
  const cached=():BrowserDocument=>({...initial,href:"/models",head:"<title>Models</title>",time:1000});
  it("revision match renews without original data fetch; mismatch discards",async()=>{
    const cache=new DocumentCache();cache.put(cached());
    const fetcher=vi.fn(async()=>Response.json({revision:token}));
    expect(await cache.get("/models",fetcher,62000)).toMatchObject({loaded:initial.loaded});expect(fetcher).toHaveBeenCalledTimes(1);
    const changed=vi.fn(async()=>Response.json({revision:"b".repeat(32)}));expect(await cache.get("/models",changed,123000)).toBeUndefined();expect(cache.peek("/models",123000)).toBeUndefined();
    expect(()=>cache.put({...cached(),time:123001})).toThrow("older revision");
  });
  it("normalizes fetched absolute URLs so sorting and history retain scroll context",()=>{
    const parsed=parseBrowserDocument(doc(initial.loaded),"https://benchmarkregistry.org/models?sort=name");
    expect(parsed.href).toBe("/models?sort=name");
  });
  it("errors/malformed/stale revision cannot renew entries",async()=>{
    for (const response of [Response.json({revision:"bad"}),new Response("quota",{status:500}),Response.json({revision:token},{headers:{"X-Registry-Cache":"stale"}})]) {
      const cache=new DocumentCache();cache.put(cached());expect(await cache.get("/models",async()=>response,62000)).toBeUndefined();
    }
  });
  it("evicts old entries and treats parameter order as one object",()=>{
    const cache=new DocumentCache();cache.put({...cached(),href:"/models?sort=name&order=asc"});
    expect(cache.peek("/models?order=asc&sort=name",1001)).toBeDefined();
    for(let n=0;n<25;n++) cache.put({...cached(),href:`/models?page=${n}`});
    expect(cache.peek("/models?order=asc&sort=name",1001)).toBeUndefined();
  });
  it("refuses partial-table local sorting and preserves pagination totals",()=>{
    const full=cached();const sorted=locallySortedDocument(full,new URL("https://benchmarkregistry.org/models?sort=name&order=desc&limit=100"));
    expect(sorted?.loaded).toMatchObject({payload:{page:{limit:100,total_pages:1},data:[{name:"Beta"},{name:"Alpha"}]}});
    const partial={...full,loaded:{kind:"models",payload:{...initial.loaded.kind === "models" ? initial.loaded.payload : {},data:[model("Alpha","10001")],page:{number:1,limit:50,total_items:51,total_pages:2}}}} as BrowserDocument;
    expect(locallySortedDocument(partial,new URL("https://benchmarkregistry.org/models?sort=name"))).toBeUndefined();
    expect(locallySortedDocument(full,new URL("https://benchmarkregistry.org/models?sort=score"))).toBeUndefined();
  });
});

describe("static pages served for query URLs",()=>{
  const sorted={kind:"models" as const,payload:{data:[model("Beta","10002"),model("Alpha","10001")],page:{number:1,limit:50,total_items:2,total_pages:1}}};
  it("hydrates the prerendered page, then applies the query from static data and stays out of the index",async()=>{
    history.replaceState(null,"","/models?sort=name&order=desc");
    const fetcher=vi.fn(async(href:string)=>href.startsWith("/api/models") ? Response.json(sorted.payload) : new Response(null,{status:204}));
    vi.stubGlobal("fetch",fetcher);
    container.innerHTML=renderToString(<App initial={initial}/>);
    const errors=vi.fn();
    await act(async()=>{root=hydrateRoot(container,<StrictMode><App initial={initial}/></StrictMode>,{onRecoverableError:errors});});
    await act(async()=>{await Promise.resolve();});
    expect(errors).not.toHaveBeenCalled();
    expect(container.querySelector("tbody tr")?.textContent).toContain("Beta");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow");
    // StrictMode mounts effects twice; only the URL's own query is ever read.
    expect(new Set(fetcher.mock.calls.map(([href])=>href).filter(href=>href.startsWith("/api/")))).toEqual(new Set(["/api/models?sort=name&order=desc"]));
  });
  it("keeps the prerendered base page, noindexed, for unknown query parameters",async()=>{
    history.replaceState(null,"","/models?utm_source=newsletter");
    vi.stubGlobal("fetch",vi.fn(async()=>Response.json({error:{code:"invalid_query",message:"Unknown parameter."}},{status:400})));
    container.innerHTML=renderToString(<App initial={initial}/>);
    await act(async()=>{root=hydrateRoot(container,<App initial={initial}/>);});
    await act(async()=>{await Promise.resolve();});
    expect(container.querySelector("tbody tr")?.textContent).toContain("Alpha");
    expect(container.textContent).not.toContain("Unable to load");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow");
  });
  it("applies a link's query when the static page returns the unqueried document",async()=>{
    vi.useFakeTimers();
    const fetcher=vi.fn(async(href:string)=>href==="/benchmarks?sort=name&order=desc"
      ? new Response(doc({kind:"benchmarks",payload:{data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}}))
      : href.startsWith("/api/benchmarks") ? Response.json({data:[],page:{number:1,limit:50,total_items:0,total_pages:0}}) : new Response(null,{status:204}));
    vi.stubGlobal("fetch",fetcher);await mount();
    const link=document.createElement("a");link.href="/benchmarks?sort=name&order=desc";container.querySelector("main")!.appendChild(link);
    await act(async()=>{link.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));});
    await act(async()=>{await vi.runAllTimersAsync();});
    expect(window.location.pathname+window.location.search).toBe("/benchmarks?sort=name&order=desc");
    expect(fetcher.mock.calls.map(([href])=>href)).toContain("/api/benchmarks?sort=name&order=desc");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, follow");
  });
});
