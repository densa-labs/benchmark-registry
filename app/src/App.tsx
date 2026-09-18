import { useEffect, useMemo, useState } from "react";

import {
  BenchmarkFamilyPage,
  BenchmarksPage,
  BenchmarkVersionPage,
} from "./benchmark-pages";
import { CompaniesPage, CompanyDetailPage } from "./company-pages";
import { ModelDetailPage, ModelsPage } from "./model-pages";
import {
  loadRegistryRoute,
  RegistryClientError,
  resolveRegistryRoute,
  type LoadedRegistryRoute,
} from "./registry";
import {
  AppShell,
  ErrorState,
  LoadingState,
  NotFoundState,
  PageContainer,
} from "./ui/components";

const navigation = [
  { href: "/models", label: "Models" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/companies", label: "Companies" },
];

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; route: LoadedRegistryRoute }
  | { status: "error"; message: string };

function currentLocation() {
  if (typeof window === "undefined") return { pathname: "/models", search: "" };
  return { pathname: window.location.pathname, search: window.location.search };
}

export function App() {
  const location = currentLocation();
  const route = useMemo(
    () => resolveRegistryRoute(location.pathname),
    [location.pathname],
  );
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (route.kind === "not-found") return;

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
  }, [route, location.search]);

  let content;
  if (route.kind === "not-found") {
    content = (
      <PageContainer className="registry-page">
        <NotFoundState />
      </PageContainer>
    );
  } else if (state.status === "loading") {
    content = (
      <PageContainer className="registry-page">
        <LoadingState columns={5} rows={6} />
      </PageContainer>
    );
  } else if (state.status === "error") {
    content = (
      <PageContainer className="registry-page">
        <ErrorState title="Unable to load registry data" description={state.message} />
      </PageContainer>
    );
  } else if (state.route.kind === "models") {
    content = <ModelsPage response={state.route.payload} currentSearch={location.search} />;
  } else if (state.route.kind === "model") {
    content = <ModelDetailPage response={state.route.payload} currentSearch={location.search} />;
  } else if (state.route.kind === "benchmarks") {
    content = <BenchmarksPage response={state.route.payload} currentSearch={location.search} />;
  } else if (state.route.kind === "benchmark") {
    content = <BenchmarkFamilyPage response={state.route.payload} />;
  } else if (state.route.kind === "benchmark-version") {
    content = (
      <BenchmarkVersionPage
        response={state.route.payload}
        currentSearch={location.search}
      />
    );
  } else if (state.route.kind === "companies") {
    content = <CompaniesPage response={state.route.payload} currentSearch={location.search} />;
  } else if (state.route.kind === "company") {
    content = (
      <CompanyDetailPage response={state.route.payload} currentSearch={location.search} />
    );
  } else {
    content = (
      <PageContainer className="registry-page">
        <NotFoundState />
      </PageContainer>
    );
  }

  return (
    <AppShell
      navigation={navigation}
      activeHref={route.kind.startsWith("benchmark")
        ? "/benchmarks"
        : route.kind === "companies" || route.kind === "company"
          ? "/companies"
          : "/models"}
      onSearchSubmit={(event) => event.preventDefault()}
    >
      {content}
    </AppShell>
  );
}
