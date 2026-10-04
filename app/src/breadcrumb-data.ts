export interface Breadcrumb {name:string;path:string}
export function breadcrumbsForPath(path:string,name?:string,parentName?:string):Breadcrumb[] {
  const parts=path.split("/").filter(Boolean);
  const crumbs:Breadcrumb[]=[{name:"Home",path:"/"}];
  if(!parts.length) return crumbs;
  const hub=parts[0];
  const labels:Record<string,string>={models:"Models",benchmarks:"Benchmarks",companies:"Organizations",compare:"Compare",recent:"Recently added",corrections:"Corrections",legal:"Legal",privacy:"Privacy",terms:"Terms"};
  crumbs.push({name:labels[hub] ?? "Page",path:`/${hub}`});
  if(parts.length>1) crumbs.push({name:parts.length>2 ? parentName ?? decodeURIComponent(parts[1]).replaceAll("-"," ") : name ?? decodeURIComponent(parts[1]),path:`/${hub}/${parts[1]}`});
  if(parts.length>2) crumbs.push({name:name ?? decodeURIComponent(parts[2]),path:path});
  return crumbs;
}
