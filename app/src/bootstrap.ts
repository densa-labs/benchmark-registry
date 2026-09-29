import type { LoadedRegistryRoute } from "./registry";

export interface InitialDocument {
  loaded: LoadedRegistryRoute;
  revision?: string;
  currentSearch: string;
}

// This belongs to the current HTML response only; it is not a browser data cache.
export function serializeInitialDocument(initial: InitialDocument): string {
  return JSON.stringify(initial).replace(/</gu, "\\u003c").replace(/\u2028/gu, "\\u2028").replace(/\u2029/gu, "\\u2029");
}

export function readInitialDocument(document: Pick<Document, "getElementById">): InitialDocument | undefined {
  const element = document.getElementById("registry-initial-document");
  if (!element?.textContent) return undefined;
  return JSON.parse(element.textContent) as InitialDocument;
}
