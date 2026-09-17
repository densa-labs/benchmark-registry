import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the registry identity", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Benchmark Registry");
    expect(markup).toContain("source-backed registry");
  });
});
