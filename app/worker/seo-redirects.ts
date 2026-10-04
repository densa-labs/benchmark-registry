import type { RegistryReader } from "./materialized-repository";
const nameSlug=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/gu,"");
/** Resolve only evidenced identities; retired unknown URLs return to a real hub. */
export async function legacyRedirect(url:URL,repository?:RegistryReader):Promise<string|null> {
  const oldVersion=/^\/benchmarks\/([^/]+)\/versions\/([^/]+)\/?$/u.exec(url.pathname);
  const oldModel=/^\/models\/([^/]+)\/?$/u.exec(url.pathname);
  const rootModel=/^\/([^/.]+)\/?$/u.exec(url.pathname);
  const knownRetiredModel=url.pathname==="/incai-ringflash20";
  if (!oldVersion && !(oldModel && !/^[0-9]+$/u.test(oldModel[1])) && !knownRetiredModel && !rootModel) return null;
  // Ordinary hubs/assets/legal paths do not need data to resolve.
  if(rootModel && ["models","benchmarks","companies","compare","legal","privacy","terms","recent"].includes(rootModel[1])) return null;
  if(!repository) return null;
  const snapshot=await repository.seoSnapshot();
  if(oldVersion) {
    let family:string,version:string;
    try {family=decodeURIComponent(oldVersion[1]);version=decodeURIComponent(oldVersion[2]);} catch {return null;}
    const parent=`/benchmarks/${encodeURIComponent(family)}`;
    const target=`${parent}/${encodeURIComponent(version)}`;
    return snapshot.pages[target] ? target : snapshot.pages[parent] ? parent : "/benchmarks";
  }
  let key:string;
  try {key=decodeURIComponent(oldModel?.[1] ?? rootModel?.[1] ?? "");} catch {return null;}
  const model=snapshot.models.find(model=>nameSlug(model.name)===nameSlug(key));
  return model ? `/models/${model.registry_no}` : knownRetiredModel ? "/models" : null;
}
