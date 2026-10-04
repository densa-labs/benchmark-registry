import { apiParameters } from "../worker/request-policy";
import { normalizeSearch } from "../worker/params";
import type { LoadedRegistryRoute } from "./registry";
import type { BrowserDocument } from "./document-cache";

const compare = (a: string | null, b: string | null) => {
  if(a === b) return 0;
  if(a === null) return -1;
  if(b === null) return 1;
  const left=Array.from(a), right=Array.from(b);
  for(let i=0;i<Math.min(left.length,right.length);i++) {
    const difference=left[i].codePointAt(0)!-right[i].codePointAt(0)!;
    if(difference) return difference;
  }
  return left.length-right.length;
};
const text = (value: string) => normalizeSearch(value);

// Only a complete set can be reordered/paginated without changing server semantics.
export function locallySortedDocument(current: BrowserDocument, destination: URL): BrowserDocument | undefined {
  const from = new URL(current.href, destination.origin);
  if (from.pathname !== destination.pathname || current.currentSearch !== from.search) return undefined;
  try {const api=new URL(destination);api.pathname="/api"+api.pathname.replace(/\/$/u,"");apiParameters(api);} catch {return undefined;}
  const before = new URLSearchParams(from.search), after = new URLSearchParams(destination.search);
  for (const key of ["sort","order","page","limit"]) {before.delete(key);after.delete(key);}
  before.sort();after.sort();
  if (before.toString() !== after.toString()) return undefined;
  const params = destination.searchParams;
  if ([...params.keys()].some((key) => params.getAll(key).length !== 1)) return undefined;
  const sort = params.get("sort");
  const order = params.get("order") ?? "asc";
  if (!sort || !["asc","desc"].includes(order)) return undefined;
  const limit = Number(params.get("limit") ?? 50) as 50 | 100 | 500;
  const number = Number(params.get("page") ?? 1);
  if (![50,100,500].includes(limit) || !/^[1-9][0-9]*$/u.test(params.get("page") ?? "1") || !Number.isSafeInteger(number)) return undefined;
  const loaded = current.loaded;
  let result: LoadedRegistryRoute | undefined;
  const factor = order === "desc" ? -1 : 1;
  if (loaded.kind === "models") {
    const payload = loaded.payload;
    if (payload.page.number !== 1 || payload.data.length !== payload.page.total_items) return undefined;
    if (!["name","company","registry_no","published","released"].includes(sort)) return undefined;
    if (sort === "released" && payload.data.some((row) => row.release_precision !== "date")) return undefined;
    const rows = [...payload.data].sort((a,b) => {
      const key = (row: typeof a) => sort === "name" ? text(row.name) : sort === "company" ? text(row.company.name) : sort === "published" ? row.published_at : sort === "released" ? row.released_at.slice(0,10) : row.registry_no;
      return factor * compare(key(a),key(b)) || (sort === "published" ? 1 : factor) * compare(a.registry_no,b.registry_no);
    });
    result = {...loaded,payload:{...payload,data:rows.slice((number-1)*limit,number*limit),page:{...payload.page,number,limit,total_pages:Math.ceil(payload.page.total_items/limit)}}};
  } else if (loaded.kind === "companies") {
    const payload=loaded.payload;
    if (payload.page.number !== 1 || payload.data.length !== payload.page.total_items || !["name","established","latest_model"].includes(sort)) return undefined;
    // Establishment precision peers can live outside a filtered result set.
    if (sort === "established" && params.has("q")) return undefined;
    const establishment=(row:typeof payload.data[number]):string|null => {
      if (row.established_at === null) return null;
      if (row.established_precision === "year" || payload.data.some((peer)=>peer.established_precision === "year" && peer.established_at?.slice(0,4) === row.established_at?.slice(0,4))) return row.established_at.slice(0,4);
      if (row.established_precision === "date" || payload.data.some((peer)=>peer.established_precision === "date" && peer.established_at?.slice(0,10) === row.established_at?.slice(0,10))) return row.established_at.slice(0,10);
      return row.established_at;
    };
    const rows=[...payload.data].sort((a,b)=>{
      const key=(row:typeof a)=>sort === "name" ? text(row.name) : sort === "established" ? establishment(row) : row.latest_model ? text(row.latest_model.name) : null;
      return factor * (compare(key(a),key(b)) || compare(a.slug,b.slug));
    });
    result={...loaded,payload:{...payload,data:rows.slice((number-1)*limit,number*limit),page:{...payload.page,number,limit,total_pages:Math.ceil(payload.page.total_items/limit)}}};
  } else if (loaded.kind === "benchmarks") {
    const payload=loaded.payload;
    if (payload.page.number !== 1 || payload.data.length !== payload.page.total_items || !["name","released","version"].includes(sort)) return undefined;
    if (sort === "released" && payload.data.some((row)=>row.latest_release_precision !== "date")) return undefined;
    const rows=[...payload.data].sort((a,b)=>{
      const key=(row:typeof a)=>sort === "name" ? text(row.benchmark.name) : sort === "version" ? row.latest_version : row.latest_released_at.slice(0,10);
      return factor * (compare(key(a),key(b)) || compare(a.benchmark.slug,b.benchmark.slug));
    });
    result={...loaded,payload:{...payload,data:rows.slice((number-1)*limit,number*limit),page:{...payload.page,number,limit,total_pages:Math.ceil(payload.page.total_items/limit)}}};
  } else if (loaded.kind === "model" || loaded.kind === "benchmark-version" || loaded.kind === "company") {
    // Model HTML paginates grouped observations; fetch its server document for sort changes.
    if (loaded.kind === "model" && loaded.payload.data.all_results) return undefined;
    const data = loaded.payload.data;
    if (data.result_page.number !== 1 || data.results.length !== data.result_page.total_items) return undefined;
    const allowed = loaded.kind === "model" ? ["benchmark","source"] : loaded.kind === "company" ? ["benchmark","model","registry_no","source"] : ["company","model","registry_no","source"];
    if (!allowed.includes(sort) || sort === "source") return undefined; // Normalized source identity is intentionally not duplicated in payloads.
    const rows = [...data.results].sort((a,b) => {
      const key = (row: typeof a) => sort === "benchmark" ? text(row.benchmark.name) : sort === "model" ? text(row.model.name) : sort === "company" ? text(row.model.company.name) : row.model.registry_no;
      return factor * (compare(key(a),key(b)) || compare(a.result_key,b.result_key));
    });
    result = {...loaded,payload:{...loaded.payload,data:{...data,results:rows.slice((number-1)*limit,number*limit),result_page:{...data.result_page,number,limit,total_pages:Math.ceil(data.result_page.total_items/limit)}}}} as LoadedRegistryRoute;
  }
  if (!result) return undefined;
  // Sort/page query states are controlled noindex, retaining the server's canonical.
  const head = current.head.replace(/<meta\b[^>]*name="robots"[^>]*>/gu, "") + '<meta name="robots" content="noindex, follow">';
  return {...current,loaded:result,href:destination.pathname+destination.search,currentSearch:destination.search,head,time:current.time};
}
