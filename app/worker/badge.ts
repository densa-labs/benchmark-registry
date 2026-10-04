import type { ResultRow } from "./api";
import type { RegistryReader } from "./materialized-repository";
import { ApiError } from "./api";
const escapeXml=(value:string)=>value.replace(/[&<>"']/gu,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[character]!);
export function renderBadge(row:ResultRow):string {
  const label=row.benchmark.name,value=row.score.display;
  const left=Math.max(80,label.length*7+16),right=Math.max(42,value.length*7+16),width=left+right;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="24" viewBox="0 0 ${width} 24" role="img" aria-labelledby="title"><title id="title">${escapeXml(row.model.name)}: ${escapeXml(label)} | ${escapeXml(value)}</title><rect width="${width}" height="24" rx="3" fill="#1e3a5f"/><path fill="#18181b" d="M0 0h${left}v24H0z"/><g fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="12" text-anchor="middle"><text x="${left/2}" y="16">${escapeXml(label)}</text><text x="${left+right/2}" y="16">${escapeXml(value)}</text></g></svg>`;
}
export async function badgeResponse(request:Request,repository:RegistryReader):Promise<Response> {
  const url=new URL(request.url),match=/^\/badge\/([0-9]{5,6})\/([a-z0-9-]+)\.svg$/u.exec(url.pathname);
  if(!match || !["GET","HEAD"].includes(request.method)) return new Response("Badge not found.",{status:404});
  if(url.searchParams.size) return new Response("Badge does not accept query options.",{status:400});
  let latest:ResultRow|undefined;
  try {
    let pages=1;
    for(let page=1;page<=pages;page++) {
      const data=(await repository.model(match[1],{page,limit:500,view:"history"})).data;
      pages=data.result_page.total_pages;
      for(const row of data.results.filter(row=>row.benchmark.slug===match[2])) {
        const length=row.reported_precision==="date" || latest?.reported_precision==="date" ? 10 : undefined;
        if(!latest || row.reported_at.slice(0,length)>latest.reported_at.slice(0,length)
          || row.reported_at.slice(0,length)===latest.reported_at.slice(0,length) && row.result_key<latest.result_key) latest=row;
      }
    }
  } catch(error) {if(!(error instanceof ApiError && error.status===404)) throw error;}
  if(!latest) return new Response("Badge not found.",{status:404,headers:{"Cache-Control":"no-store"}});
  return new Response(request.method==="HEAD" ? null : renderBadge(latest),{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, max-age=60, stale-while-revalidate=300","X-Robots-Tag":"noindex"}});
}
