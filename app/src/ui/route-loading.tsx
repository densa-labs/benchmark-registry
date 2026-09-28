import type { RegistryRoute } from "../registry";
import { LoadingState, MetadataRows, PageContainer } from "./components";

const columns = {
  models: ["Model", "Provider", "Released", "Status", "Registry No."],
  model: ["Benchmark", "Score", "Source"],
  benchmarks: ["Benchmark", "Latest version", "Released"],
  benchmark: ["Version", "Released", "Metric", "Status"],
  "benchmark-version": ["Provider", "Model", "Score", "Source", "Registry No."],
  companies: ["Organization", "Established", "Latest model"],
  company: ["Model", "Benchmark", "Score", "Source", "Registry No."],
} as const;
const metadata = {
  model: ["Released", "Provider", "Source", "Registry No."],
  company: ["Established", "Latest model"],
  "benchmark-version": ["Benchmark", "Evaluated by", "Release date", "Version", "Metric"],
} as const;

export function RouteLoadingState({ route }: { route: RegistryRoute }) {
  if (route.kind === "home" || route.kind === "not-found") return null;
  const index = route.kind === "models" || route.kind === "benchmarks" || route.kind === "companies";
  const family = route.kind === "benchmark";
  const labels = route.kind in metadata ? metadata[route.kind as keyof typeof metadata] : [];
  return <PageContainer className="registry-page route-loading">
    <div role="status" aria-busy="true" aria-label="Loading registry results">
      <span className="visually-hidden">Loading registry results</span>
      <div aria-hidden="true">
        <header className="page-header">
          {index ? <h1>{route.kind === "companies" ? "Organizations" : route.kind === "models" ? "Models" : "Benchmarks"}</h1>
            : <h1><span className="skeleton skeleton--title" /></h1>}
          {index || family || route.kind === "benchmark-version" ? <p className="page-header__description"><span className="skeleton skeleton--subtitle" /></p> : null}
        </header>
        {labels.length ? <section className="entity-metadata"><MetadataRows items={labels.map((label) => ({ label, value: <span className="skeleton skeleton--value" /> }))} /></section> : null}
        {!family ? <div className="local-search"><div className="local-search__field"><span className="local-search__label skeleton skeleton--label" /><div className="local-search__controls loading-search"><span className="skeleton" /></div></div></div> : null}
        <section className="results-section">
          <div className="results-section__header"><div><h2><span className="skeleton skeleton--section" /></h2><p><span className="skeleton skeleton--label" /></p></div>{!family ? <span className="skeleton skeleton--control" /> : null}</div>
          {!index && !family ? <div className="tabs loading-tabs"><span className="skeleton" /><span className="skeleton" /></div> : null}
          <LoadingState labels={[...columns[route.kind]]} rows={6} />
        </section>
      </div>
    </div>
  </PageContainer>;
}
