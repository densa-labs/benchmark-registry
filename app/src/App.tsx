import { Fragment, useEffect, useMemo, useState } from "react";
import type { InitialDocument } from "./bootstrap";
import { useDocumentNavigation } from "./navigation";
import { RouteLoadingState } from "./ui/route-loading";

import {
  BenchmarkFamilyPage,
  BenchmarksPage,
  BenchmarkVersionPage,
} from "./benchmark-pages";
import { CompaniesPage, CompanyDetailPage } from "./company-pages";
import { HomeLoadingState, HomePage } from "./home-page";
import { ModelDetailPage, ModelsPage } from "./model-pages";
import {
  loadRegistryRoute,
  RegistryClientError,
  resolveRegistryRoute,
  type LoadedRegistryRoute,
  type RegistryRoute,
} from "./registry";
import {
  AppShell,
  ErrorState,
  NotFoundState,
  PageContainer,
} from "./ui/components";

const navigation = [
  { href: "/models", label: "Models" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/companies", label: "Organizations" },
];

function renderPendingRoute(route: RegistryRoute) {
  return route.kind === "home" ? <HomeLoadingState /> : <RouteLoadingState route={route} />;
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; route: LoadedRegistryRoute }
  | { status: "error"; message: string };

function currentLocation() {
  if (typeof window === "undefined") return { pathname: "/models", search: "" };
  return { pathname: window.location.pathname, search: window.location.search };
}

export function App({ initial }: { initial?: InitialDocument }) {
  const location = currentLocation();
  const route = useMemo(
    () => resolveRegistryRoute(location.pathname),
    [location.pathname],
  );
  const [state, setState] = useState<LoadState>(() => initial
    ? { status: "loaded", route: initial.loaded } : { status: "loading" });

  const [currentSearch, setCurrentSearch] = useState(initial?.currentSearch ?? location.search);
  const [navigationError, setNavigationError] = useState<string>();
  const [pendingRoute, setPendingRoute] = useState<RegistryRoute>();
  useDocumentNavigation(initial, (document) => {
    setNavigationError(undefined);
    setCurrentSearch(document.currentSearch);
    setState({status:"loaded",route:document.loaded});
  }, setNavigationError, setPendingRoute);

  useEffect(() => {
    if (initial || route.kind === "not-found") return;

    const controller = new AbortController();
    void loadRegistryRoute(route, location.search, fetch, controller.signal)
      .then((loadedRoute) => setState({ status: "loaded", route: loadedRoute }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof RegistryClientError
          ? error.message
          : "The registry data could not be loaded.";
        setState({ status: "error", message });
      });
    return () => controller.abort();
  }, [route, location.search, initial]);

  let content;
  if (route.kind === "not-found") {
    content = (
      <PageContainer className="registry-page">
        <NotFoundState />
      </PageContainer>
    );
  } else if (state.status === "loading") {
    content = route.kind === "home" ? <HomeLoadingState /> : (
      <RouteLoadingState route={route} />
    );
  } else if (state.status === "error") {
    content = <PageContainer className="registry-page"><ErrorState title="Unable to load registry data" description={state.message} /></PageContainer>;
  } else {
    return <RegistryDocument loaded={state.route} currentSearch={currentSearch} enhanced navigationError={navigationError} pendingRoute={pendingRoute} />;
  }

  return (
    <AppShell
      navigation={navigation}
      activeHref={route.kind === "home" || route.kind === "not-found"
        ? undefined
        : route.kind.startsWith("benchmark")
        ? "/benchmarks"
        : route.kind === "companies" || route.kind === "company"
          ? "/companies"
          : "/models"}
    >
      {content}
    </AppShell>
  );
}

// Shared by the client and the Worker initial document; effects stay client-only.
export function RegistryDocument({ loaded, currentSearch, enhanced = false, navigationError, pendingRoute }: { loaded: LoadedRegistryRoute; currentSearch: string; enhanced?: boolean; navigationError?: string; pendingRoute?: RegistryRoute }) {
  let content;
  if (loaded.kind === "home") {
    content = <HomePage response={loaded.payload} />;
  } else if (loaded.kind === "models") {
    content = <ModelsPage response={loaded.payload} currentSearch={currentSearch} />;
  } else if (loaded.kind === "model") {
    content = <ModelDetailPage response={loaded.payload} currentSearch={currentSearch} />;
  } else if (loaded.kind === "benchmarks") {
    content = <BenchmarksPage response={loaded.payload} currentSearch={currentSearch} />;
  } else if (loaded.kind === "benchmark") {
    content = <BenchmarkFamilyPage response={loaded.payload} />;
  } else if (loaded.kind === "benchmark-version") {
    content = (
      <BenchmarkVersionPage
        response={loaded.payload}
        currentSearch={currentSearch}
      />
    );
  } else if (loaded.kind === "companies") {
    content = <CompaniesPage response={loaded.payload} currentSearch={currentSearch} />;
  } else if (loaded.kind === "company") {
    content = (
      <CompanyDetailPage response={loaded.payload} currentSearch={currentSearch} />
    );
  } else {
    content = (
      <PageContainer className="registry-page">
        <NotFoundState />
      </PageContainer>
    );
  }

  if (pendingRoute) content=renderPendingRoute(pendingRoute);
  return (
    <AppShell navigation={navigation} renderPending={enhanced ? undefined : renderPendingRoute} activeHref={loaded.kind === "home" || loaded.kind === "not-found"
      ? undefined : loaded.kind.startsWith("benchmark") ? "/benchmarks"
      : loaded.kind === "companies" || loaded.kind === "company" ? "/companies" : "/models"}>
      {navigationError ? <PageContainer><ErrorState title="Unable to load registry data" description={navigationError} /></PageContainer> : null}
      <Fragment key={JSON.stringify([loaded.kind, currentSearch, loaded.kind === "model" ? loaded.payload.data.model.registry_no : loaded.kind === "company" ? loaded.payload.data.company.slug : loaded.kind === "benchmark" ? loaded.payload.data.benchmark.slug : loaded.kind === "benchmark-version" ? loaded.payload.data.version.benchmark.slug + loaded.payload.data.version.version_slug : ""])}>{content}</Fragment>
    </AppShell>
  );
}
