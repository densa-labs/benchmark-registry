import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { BadgeSnippet } from "./badge-snippet";
import { result } from "./compare-fixtures";

it("links both badge snippets back to the model's page", () => {
  const row = result();
  const page = `https://benchmarkregistry.org/models/${row.model.registry_no}`;
  const badge = `https://benchmarkregistry.org/badge/${row.model.registry_no}/${row.benchmark.slug}.svg`;
  const html = renderToString(<BadgeSnippet result={row} />).replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">");
  expect(html).toContain(`[![${row.model.name}: ${row.benchmark.name}](${badge})](${page})`);
  expect(html).toContain(`<a href="${page}"><img src="${badge}"`);
  expect(html).toContain('height="24"></a>');
});
