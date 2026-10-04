import { SearchPage } from "./search-page";
import { CoveragePage } from "./coverage-page";
import { CorrectionsPage } from "./corrections-page";
import { BreadcrumbContext } from "./breadcrumb-context";
import { RecentPage } from "./recent-page";
import { StaticComparisonPage } from "./static-comparison-page";
import { VisibleBreadcrumbs } from "./breadcrumbs";
import { LegalPage } from "./legal-pages";
import { isLegalKind } from "./legal-content";
import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { InitialDocument } from "./bootstrap";
import { useDocumentNavigation } from "./navigation";
import { focusNavigation, type NavigationNotice } from "./navigation-accessibility";
import { RouteLoadingState } from "./ui/route-loading";

import {
  BenchmarkFamilyPage,
  BenchmarksPage,
  BenchmarkVersionPage,
} from "./benchmark-pages";
import { CompaniesPage, CompanyDetailPage } from "./company-pages";
import { HomeLoadingState, HomePage } from "./home-page";
import { ModelDetailPage, ModelsPage } from "./model-pages";
import { ComparePage } from "./compare-page";
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
  { href: "/compare", label: "Compare" },
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
    ? initial.failure ? { status: "error", message: initial.failure } : { status: "loaded", route: initial.loaded } : { status: "loading" });

  const [currentSearch, setCurrentSearch] = useState(initial?.currentSearch ?? location.search);
  const [navigationError, setNavigationError] = useState<string>();
  const [pendingRoute, setPendingRoute] = useState<RegistryRoute>();
  const [notice, setNotice] = useState<NavigationNotice>();
  useDocumentNavigation(initial, (document, update) => {
    setNavigationError(undefined);
    setCurrentSearch(document.currentSearch);
    setState({status:"loaded",route:document.loaded});
    if (update) setNotice(update);
  }, setNavigationError, setPendingRoute);

  useLayoutEffect(() => { if (notice) focusNavigation(notice); }, [notice]);

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
  if (state.status === "error") {
    content = <PageContainer className="registry-page"><ErrorState title="Unable to load registry data" description={state.message} primary /><p className="state-message__action"><a href="">Try again</a></p></PageContainer>;
  } else if (route.kind === "not-found") {
    content = (
      <PageContainer className="registry-page">
        <NotFoundState />
      </PageContainer>
    );
  } else if (state.status === "loading") {
    content = route.kind === "home" ? <HomeLoadingState /> : (
      <RouteLoadingState route={route} />
    );
  } else {
    return <RegistryDocument loaded={state.route} currentSearch={currentSearch} enhanced navigationError={navigationError} pendingRoute={pendingRoute} announcement={notice?.message} />;
  }

  return (
    <AppShell
      navigation={navigation}
      activeHref={state.status === "error" || route.kind === "home" || route.kind === "not-found" || isLegalKind(route.kind)
        ? undefined
        : route.kind === "compare" ? "/compare" : route.kind.startsWith("benchmark")
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
export function RegistryDocument({ loaded, currentSearch, enhanced = false, navigationError, pendingRoute, announcement }: { loaded: LoadedRegistryRoute; currentSearch: string; enhanced?: boolean; navigationError?: string; pendingRoute?: RegistryRoute; announcement?: string }) {
  let content;
  if (loaded.kind === "search") {
    content = <SearchPage response={loaded.payload} search={currentSearch} />;
  } else if (loaded.kind === "coverage") {
    content = <CoveragePage data={loaded.payload} />;
  } else if (loaded.kind === "corrections") {
    content = <CorrectionsPage />;
  } else if (loaded.kind === "home") {
    content = <HomePage response={loaded.payload} />;
  } else if (loaded.kind === "compare") {
    content = <ComparePage response={loaded.payload} currentSearch={currentSearch} />;
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
  } else if(loaded.kind==="recent") {
    content=<RecentPage records={loaded.payload} />;
  } else if (loaded.kind === "comparison") {
    content = <StaticComparisonPage response={loaded.payload} name={loaded.name} />;
  } else if (loaded.kind === "company") {
    content = (
      <CompanyDetailPage response={loaded.payload} currentSearch={currentSearch} />
    );
  } else if (isLegalKind(loaded.kind)) {
    content = <LegalPage kind={loaded.kind} />;
  } else {
    content = (
      <PageContainer className="registry-page">
        <NotFoundState />
      </PageContainer>
    );
  }

  if (pendingRoute) content=renderPendingRoute(pendingRoute);
  return (
    <AppShell dataUpdated={loaded.updated} navigation={navigation} announcement={announcement} busy={Boolean(pendingRoute)} renderPending={enhanced ? undefined : renderPendingRoute} activeHref={loaded.kind === "home" || loaded.kind === "not-found" || isLegalKind(loaded.kind)
      ? undefined : (loaded.kind === "compare" || loaded.kind === "comparison") ? "/compare" : loaded.kind.startsWith("benchmark") ? "/benchmarks"
      : loaded.kind === "companies" || loaded.kind === "company" ? "/companies" : "/models"}>
      {navigationError ? <PageContainer><ErrorState title="Unable to load registry data" description={navigationError} /></PageContainer> : null}
      <Fragment key={JSON.stringify([loaded.kind, currentSearch, loaded.kind === "model" ? loaded.payload.data.model.registry_no : loaded.kind === "company" ? loaded.payload.data.company.slug : loaded.kind === "benchmark" ? loaded.payload.data.benchmark.slug : loaded.kind === "benchmark-version" ? loaded.payload.data.version.benchmark.slug + loaded.payload.data.version.version_slug : ""])}>{loaded.kind==="not-found" && !pendingRoute ? <PageContainer><VisibleBreadcrumbs loaded={loaded} /></PageContainer> : null}<BreadcrumbContext.Provider value={pendingRoute ? undefined : loaded}>{content}</BreadcrumbContext.Provider></Fragment>
    </AppShell>
  );
}
