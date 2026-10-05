import type { LoadedRegistryRoute } from "./registry";
import type { SeoSnapshot } from "../worker/seo-data";
import type { SeoContent } from "./seo-content";
export function enrichSeoContent(loaded:LoadedRegistryRoute,snapshot:SeoSnapshot,documentPath:string):LoadedRegistryRoute {
  const kind=loaded.kind;
  loaded={...loaded,updated:snapshot.pages[documentPath]?.updated};
  if(kind!=="model" && kind!=="benchmark" && kind!=="company") return loaded;
  const path=kind==="model" ? `/models/${loaded.payload.data.model.registry_no}` : kind==="benchmark" ? `/benchmarks/${loaded.payload.data.benchmark.slug}` : `/companies/${loaded.payload.data.company.slug}`;
  const page=snapshot.pages[path];if(!page) return loaded;
  const updated=page.updated?.slice(0,10);
  const ending=updated ? ` Updated ${updated}.` : "";
  const sentence=kind==="model" ? `${page.records} benchmark results for ${page.name} from primary sources, covering ${page.benchmarks} benchmarks.${ending}`
    : kind==="benchmark" ? `${page.name} results reported for ${page.models} ${page.models===1 ? "model" : "models"} across ${page.versions} ${page.versions===1 ? "version" : "versions"}.${ending}`
    : `Benchmark results for ${page.models} ${page.name} ${page.models===1 ? "model" : "models"} from official publications.${ending}`;
  const content:SeoContent={sentence,updated,links:page.coveredBenchmarks};
  if(kind==="model") {
    content.links=[...(content.links ?? []),...snapshot.comparisons.filter(pair=>pair.models.includes(loaded.payload.data.model.registry_no)).map(pair=>({path:pair.path,name:`Compare with ${snapshot.models.find(model=>model.registry_no===pair.models.find(no=>no!==loaded.payload.data.model.registry_no))!.name}`}))];
    const model=loaded.payload.data.model;
    // Closest published siblings by release date, with stable Registry No. ties.
    content.related=snapshot.models.filter(peer=>peer.company.slug===model.company.slug && peer.registry_no!==model.registry_no)
      .sort((a,b)=>Math.abs(Date.parse(a.released_at)-Date.parse(model.released_at))-Math.abs(Date.parse(b.released_at)-Date.parse(model.released_at)) || a.registry_no.localeCompare(b.registry_no,"en")).slice(0,6);
  } else if(kind==="company") content.related=snapshot.models.filter(model=>model.company.slug===loaded.payload.data.company.slug);
  else {
    content.top=page.topResults;content.latest=page.latestVersion;
    const family=`/benchmarks/${loaded.payload.data.benchmark.slug}/`;
    content.versionCounts=Object.fromEntries(Object.entries(snapshot.pages).filter(([key])=>key.startsWith(family) && !key.slice(family.length).includes("/"))
      .map(([key,version])=>[key.slice(family.length),{models:version.models,results:version.records}]));
  }
  return {...loaded,updated:page.updated,payload:{...loaded.payload,data:{...loaded.payload.data,seo:content}}} as LoadedRegistryRoute;
}
