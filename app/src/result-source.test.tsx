import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { sourceLabel } from "./source-label";
import { ResultDetails, ResultSource } from "./result-source";
import { accessibilityRoutes } from "./accessibility-fixtures";

it("labels citations using their recorded hostname without guessing publisher or source type", () => {
  expect(sourceLabel("https://www.anthropic.com/research/example")).toBe("anthropic.com");
  expect(sourceLabel("https://www-cdn.anthropic.com/123.pdf")).toBe("www-cdn.anthropic.com");
  expect(sourceLabel("")).toBe("Source");
});
it("shows known metric and report dates and omits absent values", () => {
  const loaded = accessibilityRoutes.find(route => route.loaded.kind === "model")!.loaded;
  if (loaded.kind !== "model") throw new Error("Missing fixture");
  const result = loaded.payload.data.results[0];
  const markup = renderToStaticMarkup(<ResultDetails result={result} />);
  expect(markup).toContain("Accuracy");
  expect(markup).toContain('dateTime="2026-01-01"');
  const missing = renderToStaticMarkup(<ResultDetails result={{ ...result, reported_at: "", metric: { ...result.metric, name: "" } }} />);
  expect(missing).not.toContain("Reported");
  expect(missing).not.toContain("Unknown");
});
it("renders populated provenance and an archived evidence link without inference", () => {
  const loaded = accessibilityRoutes.find(route => route.loaded.kind === "model")!.loaded;
  if (loaded.kind !== "model") throw new Error("Missing fixture");
  const result = loaded.payload.data.results[0];
  const markup = renderToStaticMarkup(<ResultSource result={{ ...result, evaluated_at:"2025-12-31",evaluated_precision:"date",source_type: "Developer system card", publisher: "Recorded publisher", reporting_basis: "self-reported", source_archive_url: "https://archive.org/example" }} />);
  for (const text of ["Evaluated", "December 31, 2025", "Developer system card", "Recorded publisher", "Self-reported", "Archived copy", 'rel="noopener noreferrer"']) expect(markup).toContain(text);
  expect(renderToStaticMarkup(<ResultSource result={result} />)).not.toMatch(/Self-reported|Independent|Unknown|Archived copy/u);
});
