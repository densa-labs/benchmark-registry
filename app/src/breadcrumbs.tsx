import type { LoadedRegistryRoute } from "./registry";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";
export interface Breadcrumb {name:string;path:string}
export function breadcrumbsForPath(path:string,name?:string,parentName?:string):Breadcrumb[] {
  const parts=path.split("/").filter(Boolean);
  const crumbs:Breadcrumb[]=[{name:"Home",path:"/"}];
  if(!parts.length) return crumbs;
  const hub=parts[0];
  const labels:Record<string,string>={models:"Models",benchmarks:"Benchmarks",companies:"Organizations",compare:"Compare",recent:"Recently added",legal:"Legal",privacy:"Privacy",terms:"Terms"};
  crumbs.push({name:labels[hub] ?? "Page",path:`/${hub}`});
  if(parts.length>1) crumbs.push({name:parts.length>2 ? parentName ?? decodeURIComponent(parts[1]).replaceAll("-"," ") : name ?? decodeURIComponent(parts[1]),path:`/${hub}/${parts[1]}`});
  if(parts.length>2) crumbs.push({name:name ?? decodeURIComponent(parts[2]),path:path});
  return crumbs;
}
export function VisibleBreadcrumbs({loaded}:{loaded:LoadedRegistryRoute}) {
  let path:string,name:string|undefined,parentName:string|undefined;
  switch(loaded.kind) {
    case "home":return null;
    case "comparison":path=`/compare/${loaded.name.toLowerCase().replace(/[^a-z0-9]+/gu,"-")}`;name=loaded.name;break;
    case "model":path=`/models/${loaded.payload.data.model.registry_no}`;name=loaded.payload.data.model.name;break;
    case "company":path=`/companies/${loaded.payload.data.company.slug}`;name=loaded.payload.data.company.name;break;
    case "benchmark":path=`/benchmarks/${loaded.payload.data.benchmark.slug}`;name=benchmarkDisplayName(loaded.payload.data.benchmark);break;
    case "benchmark-version":path=`/benchmarks/${loaded.payload.data.version.benchmark.slug}/${loaded.payload.data.version.version_slug}`;name=benchmarkVersionLabel(loaded.payload.data.version.benchmark,loaded.payload.data.version.version);parentName=benchmarkDisplayName(loaded.payload.data.version.benchmark);break;
    default:path=`/${loaded.kind}`;
  }
  const crumbs=breadcrumbsForPath(path,name,parentName);
  return <nav aria-label="Breadcrumb"><p>{crumbs.map((crumb,index)=><span key={crumb.path}>{index>0 ? " › " : ""}{index===crumbs.length-1 ? crumb.name : <a href={crumb.path}>{crumb.name}</a>}</span>)}</p></nav>;
}
