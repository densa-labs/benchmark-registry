import { expect, it } from "vitest";
import { parseInitialDocument, serializeInitialDocument } from "./bootstrap";
import { accessibilityRoutes } from "./accessibility-fixtures";
it("deduplicates model page results and restores the identical observations",()=>{
  const loaded=accessibilityRoutes.find(route=>route.loaded.kind==="model")!.loaded;
  if(loaded.kind!=="model") throw new Error("Fixture");
  const data=loaded.payload.data;
  const initial={loaded:{...loaded,payload:{data:{...data,all_results:data.results}}},currentSearch:""};
  const serialized=serializeInitialDocument(initial);
  expect(serialized.length).toBeLessThan(JSON.stringify(initial).length);
  expect(parseInitialDocument(serialized)).toEqual(initial);
});
