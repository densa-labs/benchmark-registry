import type { LoadedRegistryRoute } from "./registry";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";
import { breadcrumbsForPath } from "./breadcrumb-data";
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
  return <nav aria-label="Breadcrumb"><p className="page-header__description">{crumbs.map((crumb,index)=><span key={crumb.path}>{index>0 ? " › " : ""}{index===crumbs.length-1 ? crumb.name : <a href={crumb.path}>{crumb.name}</a>}</span>)}</p></nav>;
}
