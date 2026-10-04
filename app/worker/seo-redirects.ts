import type { RegistryReader } from "./materialized-repository";
import { LEGACY_ROOT_SLUGS } from "./legacy-root-slugs";
const nameSlug=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/gu,"");
/** Resolve only evidenced identities; retired identities with no equivalent return 404. Mirrors `redirectRules`. */
export async function legacyRedirect(url:URL,repository?:RegistryReader):Promise<string|null> {
  const oldVersion=/^\/benchmarks\/([^/]+)\/versions\/([^/]+)\/?$/u.exec(url.pathname);
  const oldModel=/^\/models\/([^/]+)\/?$/u.exec(url.pathname);
  const rootModel=/^\/([^/.]+)\/?$/u.exec(url.pathname);
  if(rootModel && !oldVersion && !oldModel) {
    let slug:string;
    try {slug=decodeURIComponent(rootModel[1]);} catch {return null;}
    return Object.hasOwn(LEGACY_ROOT_SLUGS,slug) ? `/models/${LEGACY_ROOT_SLUGS[slug]}` : null;
  }
  if (!oldVersion && !(oldModel && !/^[0-9]+$/u.test(oldModel[1]))) return null;
  if(!repository) return null;
  const snapshot=await repository.seoSnapshot();
  if(oldVersion) {
    let family:string,version:string;
    try {family=decodeURIComponent(oldVersion[1]);version=decodeURIComponent(oldVersion[2]);} catch {return null;}
    const parent=`/benchmarks/${encodeURIComponent(family)}`;
    const target=`${parent}/${encodeURIComponent(version)}`;
    return snapshot.pages[target] ? target : version==="default" && snapshot.pages[parent] ? parent : null;
  }
  let key:string;
  try {key=decodeURIComponent(oldModel![1]);} catch {return null;}
  const model=snapshot.models.find(model=>nameSlug(model.name)===nameSlug(key));
  return model ? `/models/${model.registry_no}` : null;
}
