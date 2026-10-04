import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { faviconAssets } from "./src/branding";

const staging = process.env.CLOUDFLARE_ENV === "staging";
// UTC commit time (or SOURCE_DATE_EPOCH), so rebuilding a commit gives identical bytes.
const epoch = process.env.SOURCE_DATE_EPOCH ?? execFileSync("git", ["show", "-s", "--format=%ct", "HEAD"], { encoding: "utf8" }).trim();
const timestamp = new Date(Number(epoch) * 1000).toISOString().slice(0, 19).replace("T", " ");
const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() ? "-dirty" : "";

export default defineConfig({
  define: {
    __REGISTRY_STAGING__: JSON.stringify(staging),
    __REGISTRY_BUILD_TIMESTAMP__: JSON.stringify(timestamp),
    __REGISTRY_BUILD_ID__: JSON.stringify(commit + dirty),
  },
  plugins: [react(), cloudflare(), {
    name: "registry-environment-branding",
    transformIndexHtml(html) {
      return staging ? html.replace(/<link rel="icon"[^>]+>/gu, "")
        .replace("<title>Benchmark Registry</title>", '<link rel="icon" href="/favicon-staging.svg" type="image/svg+xml"><title>STAGING | Benchmark Registry</title>') : html;
    },
    generateBundle() {
      if (this.environment.name === "client") {
        this.emitFile({ type:"asset",fileName:"assets/Benchmark-Registry-B-Logo-Dark.png",source:readFileSync(new URL("../assets/Benchmark-Registry-B-Logo-Dark.png",import.meta.url)) });
        for (const [fileName, source] of Object.entries(faviconAssets(staging))) this.emitFile({ type: "asset", fileName, source });
      }
    },
  }],
});
