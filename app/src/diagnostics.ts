import { BUILD_ID, BUILD_TIMESTAMP, IS_STAGING } from "./build";
import type { RegistryRoute } from "./registry";

// Route kinds are bounded identifiers. Never log URLs, search terms, or payloads.
export function identifyBuild(route: RegistryRoute["kind"]) {
  if (IS_STAGING) {
    console.info("[Benchmark Registry] STAGING", { build: BUILD_ID, timestamp: BUILD_TIMESTAMP });
    console.info("[Benchmark Registry] route", route);
  }
}

export function diagnoseTheme(preference: string, resolved: string) {
  if (IS_STAGING) console.info("[Benchmark Registry] theme", { preference, resolved });
}

export function diagnoseApiFailure(status: number) {
  if (IS_STAGING) console.warn("[Benchmark Registry] API request failed", { status });
}

export function installErrorDiagnostics(target: Window) {
  if (!IS_STAGING) return () => undefined;
  const onError = () => console.error("[Benchmark Registry] unexpected client error");
  const onRejection = () => console.error("[Benchmark Registry] unhandled client rejection");
  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);
  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}
