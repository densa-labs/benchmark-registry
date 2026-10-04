import { expect, it } from "vitest";
import { generateCitation, recordAnchor, recordCitation, recordPermalink } from "./citation";
import { accessibilityRoutes } from "./accessibility-fixtures";
it("generates plain text and BibTeX with real identifiers, canonical URL, license and access placeholder",()=>{
  const citation=generateCitation({title:"Model benchmark results",path:"/models/10001",registryNumber:"10001"});
  for(const text of ["Benchmark Registry","https://benchmarkregistry.org/models/10001","Registry No. 10001","CC BY 4.0","YYYY-MM-DD"]) {
    expect(citation.plain).toContain(text);expect(citation.bibtex).toContain(text);
  }
});
it("escapes BibTeX metacharacters and preserves the readable title",()=>{
  const citation=generateCitation({title:"Model {a} & 50%",path:"/models/10001"});
  expect(citation.plain).toContain("Model {a} & 50%");expect(citation.bibtex).toContain("Model \\{a\\} \\& 50\\%");
});
it("uses existing immutable keys for row anchors and history-safe permalinks",()=>{
  const loaded=accessibilityRoutes.find(route=>route.loaded.kind==="model")!.loaded;
  if(loaded.kind!=="model") throw new Error("Fixture");
  const row=loaded.payload.data.results[0];
  expect(recordAnchor(row)).toBe(`BR-${row.result_key}`);
  expect(recordPermalink(row)).toContain(`?view=history&result=${row.result_key}#BR-${row.result_key}`);
  const citation=generateCitation(recordCitation(row));expect(citation.plain).toContain(`Record No. ${row.result_key}`);expect(citation.plain).toContain(recordPermalink(row));
});
