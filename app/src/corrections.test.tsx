import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { parseCorrections } from "./corrections";
import { CorrectionsPage } from "./corrections-page";
import { issueHref } from "./issue-report";
import { accessibilityRoutes } from "./accessibility-fixtures";
it("renders the empty log and a correction issue template", () => {
  const html=renderToStaticMarkup(<CorrectionsPage entries={[]} />);
  expect(html).toContain("No corrections have been recorded yet.");
  expect(html).toContain("template=correct-a-result.yml");
});
it("validates corrections and renders newest first with escaped text", () => {
  const old={date:"2026-01-01",record_number:"abc",what_changed:"<script>",reason:"Primary evidence"};
  const entries=parseCorrections([old,{...old,date:"2026-02-02"}]);
  const html=renderToStaticMarkup(<CorrectionsPage entries={entries} />);
  expect(html.indexOf("2026-02-02")).toBeLessThan(html.indexOf("2026-01-01"));
  expect(html).toContain("&lt;script&gt;");
  expect(()=>parseCorrections([{...old,date:"2026-02-30"}])).toThrow();
  expect(()=>parseCorrections([{...old,reason:null}])).toThrow();
});
it("prefills encoded issue title and evidence for a specific record", () => {
  const loaded=accessibilityRoutes.find(route=>route.loaded.kind==="model")!.loaded;
  if(loaded.kind!=="model") throw new Error("Fixture");
  const result=loaded.payload.data.results[0];
  const url=new URL(issueHref({result,page:"/models/10001"}));
  const body=url.searchParams.get("body")!;
  for(const text of [result.result_key,result.model.name,result.benchmark.name,result.score.display,result.primary_source_url,"https://benchmarkregistry.org/models/10001"]) expect(body).toContain(text);
});
