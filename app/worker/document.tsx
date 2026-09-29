import { renderToString } from "react-dom/server";
import { serializeInitialDocument } from "../src/bootstrap";
import { RegistryDocument } from "../src/App";
import { loadRegistryRoute, resolveRegistryRoute } from "../src/registry";
import { ApiError } from "./api";

export async function renderDocument(url: URL, readApi: (input: string) => Promise<Response>, revision?: string) {
  const route = resolveRegistryRoute(url.pathname);
  let search = url.search;
  const fetcher = (async (input: RequestInfo | URL) => readApi(String(input))) as typeof fetch;
  let loaded;
  try {
    loaded = await loadRegistryRoute(route, search, fetcher);
  } catch (error) {
    // P11.6 serves malformed/unknown UI query states as noindex 200.
    // Render the base page there; preserve the API's strict validation.
    if (!(error instanceof ApiError) || error.status !== 400) throw error;
    search = "";
    loaded = await loadRegistryRoute(route, search, fetcher);
  }
  return renderInitialDocument(loaded, search, revision);
}

export function renderInitialDocument(loaded: import("../src/registry").LoadedRegistryRoute, currentSearch: string, revision?: string) {
  return {
    markup: renderToString(<RegistryDocument loaded={loaded} currentSearch={currentSearch} />),
    bootstrap: `<script id="registry-initial-document" type="application/json">${serializeInitialDocument({ loaded, currentSearch, revision })}</script>`,
  };
}
