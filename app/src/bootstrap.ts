import type { LoadedRegistryRoute } from "./registry";

export interface InitialDocument {
  loaded: LoadedRegistryRoute;
  revision?: string;
  currentSearch: string;
  failure?: string;
}

// This belongs to the current HTML response only; it is not a browser data cache.
export function serializeInitialDocument(initial: InitialDocument): string {
  const loaded=initial.loaded;
  // Model pivots need complete observations, which also contain the current
  // page. Encode its duplicate rows as immutable keys, then restore on read.
  const compact=loaded.kind === "model" && loaded.payload.data.all_results ? {...initial,loaded:{...loaded,payload:{...loaded.payload,data:{...loaded.payload.data,results:loaded.payload.data.results.map(row=>row.result_key)}}}} : initial;
  return JSON.stringify(compact).replace(/</gu, "\\u003c").replace(/\u2028/gu, "\\u2028").replace(/\u2029/gu, "\\u2029");
}

export function readInitialDocument(document: Pick<Document, "getElementById">): InitialDocument | undefined {
  const element = document.getElementById("registry-initial-document");
  if (!element?.textContent) return undefined;
  return parseInitialDocument(element.textContent);
}

export function parseInitialDocument(text:string):InitialDocument {
  const initial=JSON.parse(text) as InitialDocument;
  if(initial.loaded?.kind==="model" && initial.loaded.payload.data.all_results && typeof initial.loaded.payload.data.results[0]==="string") {
    const data=initial.loaded.payload.data,rows=new Map(data.all_results!.map(row=>[row.result_key,row]));
    data.results=(data.results as unknown as string[]).map(key=>{const row=rows.get(key);if(!row) throw new Error("Invalid Registry result reference.");return row;});
  }
  return initial;
}
