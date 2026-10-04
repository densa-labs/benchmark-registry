import type { RegistryReader } from "./materialized-repository";
import type { SeoSnapshot } from "./seo-data";
import type { ComparisonPair } from "../src/comparison-pairs";
import type { ModelDetailResponse } from "../src/registry";
export async function comparisonPayload(repository:RegistryReader,pair:ComparisonPair,snapshot:SeoSnapshot) {
  const selected=await Promise.all(pair.models.map(async no=>{
    const response=await repository.model(no,{page:1,limit:500,view:"latest"});
    for(let page=2;page<=response.data.result_page.total_pages;page++) response.data.results.push(...(await repository.model(no,{page,limit:500,view:"latest"})).data.results);
    return response;
  })) as [ModelDetailResponse,ModelDetailResponse];
  return {name:snapshot.pages[pair.path].name,payload:{models:[],selected,issues:[]}};
}
