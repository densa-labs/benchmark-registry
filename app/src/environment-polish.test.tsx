import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { faviconAssets } from "./branding";
import template from "../index.html?raw";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });
describe("P11.8 environment identity", () => {
  it.each([false, true])("gates banner, document title, and console identity when staging=%s", async (staging) => {
    vi.resetModules();
    vi.stubGlobal("__REGISTRY_STAGING__", staging);
    vi.stubGlobal("__REGISTRY_BUILD_TIMESTAMP__", "2026-09-28 03:00:00");
    vi.stubGlobal("__REGISTRY_BUILD_ID__", "abc123-test");
    const { Header } = await import("./ui/components");
    const { metadataHead } = await import("../worker/metadata");
    const { identifyBuild, diagnoseTheme, diagnoseApiFailure } = await import("./diagnostics");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const header = renderToStaticMarkup(<Header navigation={[]} />);
    const head = metadataHead({ title: "Models | Benchmark Registry", description: "AI models", canonical: "https://benchmarkregistry.org/models" }, new URL("https://benchmarkregistry.org/models"));
    identifyBuild("models"); diagnoseTheme("system", "dark"); diagnoseApiFailure(503);
    if (staging) {
      expect(header).toContain("STAGING | Last update:");
      expect(header).toContain("2026-09-28 03:00:00");
      expect(header).toContain("UTC+00:00");
      expect(header.indexOf('class="staging-banner"')).toBeLessThan(header.indexOf('<header'));
      expect(head).toContain("<title>STAGING | Benchmark Registry</title>");
      expect(info).toHaveBeenCalledWith("[Benchmark Registry] STAGING", { build: "abc123-test", timestamp: "2026-09-28 03:00:00" });
      expect(warn).toHaveBeenCalledWith("[Benchmark Registry] API request failed", { status: 503 });
    } else {
      expect(header).not.toContain("STAGING"); expect(head).not.toContain("STAGING");
      expect(head).toContain("<title>Models | Benchmark Registry</title>");
      expect(info).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled();
    }
    expect(head).toContain('href="https://benchmarkregistry.org/models"');
  });
  it("ships OS theme-aware production icons and only an always-red staging icon", () => {
    expect(Object.keys(faviconAssets(false))).toEqual(["favicon.svg", "favicon-light.svg", "favicon-dark.svg"]);
    expect(faviconAssets(false)["favicon.svg"]).toContain("prefers-color-scheme:dark");
    expect(faviconAssets(false)["favicon-light.svg"]).toContain("#18181b");
    expect(faviconAssets(false)["favicon-dark.svg"]).toContain("#f4f4f5");
    expect(faviconAssets(false)["favicon.svg"]).toContain('viewBox="188 246 887 738"');
    const staging = faviconAssets(true);
    expect(Object.keys(staging)).toEqual(["favicon-staging.svg"]);
    expect(staging["favicon-staging.svg"]).toContain("#d13636");
    expect(staging["favicon-staging.svg"]).not.toContain("prefers-color-scheme");
    expect(template).toContain('href="/favicon-light.svg" type="image/svg+xml" media="(prefers-color-scheme: light)"');
    expect(template).toContain('href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)"');
    expect(template.indexOf("registryTheme")).toBeLessThan(template.indexOf("</head>"));
  });
});
