import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";
import { applyStoredTheme } from "./theme";
import { readInitialDocument } from "./bootstrap";
import { identifyBuild, installErrorDiagnostics } from "./diagnostics";
import { resolveRegistryRoute } from "./registry";

try { applyStoredTheme(document.documentElement, window.localStorage); } catch { /* OS theme remains available through CSS. */ }
identifyBuild(resolveRegistryRoute(window.location.pathname).kind);
installErrorDiagnostics(window);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element was not found.");
}

const initial = readInitialDocument(document);
const application = <StrictMode><App initial={initial} /></StrictMode>;
if (initial) hydrateRoot(rootElement, application);
else createRoot(rootElement).render(application);
