import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { sourceLabel } from "./source-label";
import { ResultDetails } from "./result-source";
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
