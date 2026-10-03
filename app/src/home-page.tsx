import { type ModelListEntry, type HomePageResponse } from "./registry";
import { ModelBenchmarkScore } from "./model-benchmark-score";
import { EmptyState, PageContainer, SourceLink } from "./ui/components";
import { BenchmarkLink } from "./benchmark-link";
import { ResultScoreLink } from "./result-score-link";
import { benchmarkVersionLabel } from "./benchmark-names";
import { HOME_PANEL_LIMIT, type HomePanels } from "../worker/home-panels";

export function HomeLoadingState() {
  return (
    <PageContainer className="registry-page home-page home-page--loading">
      <div role="status" aria-busy="true" aria-label="Loading homepage data">
        <span className="visually-hidden">Loading homepage data</span>
        <div aria-hidden="true">
          <header className="home-intro"><h1><span className="skeleton skeleton--title" /></h1><div className="home-scale"><p className="home-scale__primary"><span className="skeleton skeleton--section" /></p><p className="home-scale__support"><span className="skeleton skeleton--subtitle" /></p></div></header>
          <div className="home-sections">{[0, 1].map((section) => <section className="home-section" key={section}>
            <header className="home-section__header"><div><h2><span className="skeleton skeleton--section" /></h2><p><span className="skeleton skeleton--subtitle" /></p></div><span className="skeleton skeleton--label" /></header>
            <ol className="home-model-list" role="list">{Array.from({ length: 5 }, (_, row) => <li key={row}>
              <span className="home-model-list__identity"><span className="skeleton skeleton--value" /><span className="skeleton skeleton--label" /></span>
              <span className="home-model-list__metadata"><span className="skeleton skeleton--value" /><span className="skeleton skeleton--label" /></span>
            </li>)}</ol>
          </section>)}</div>
          <section className="home-directory"><header className="home-section__header"><div><h2><span className="skeleton skeleton--section" /></h2><p><span className="skeleton skeleton--subtitle" /></p></div></header>
            <div className="home-directory__group"><h3><span className="skeleton skeleton--initial" /></h3><ul role="list">{Array.from({ length: 9 }, (_, row) => <li key={row}><span className="skeleton skeleton--value" /><span className="home-directory__provider skeleton skeleton--label" /><span className="registry-number skeleton skeleton--label" /></li>)}</ul></div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

function ExploreBenchmarks({ benchmarks }: { benchmarks: HomePanels["explore_benchmarks"] }) {
  if (benchmarks.length === 0) return <EmptyState title="No benchmarks found" description="Benchmarks will appear here as they are published." />;
  return (
    <ul className="home-model-list home-benchmark-list" role="list">
      {benchmarks.slice(0, HOME_PANEL_LIMIT).map(({ benchmark, model_count, result_count }) => (
        <li key={benchmark.slug}>
          <span className="home-model-list__identity">
            <BenchmarkLink benchmark={benchmark} />
            <span className="home-panel-detail">{model_count.toLocaleString("en-US")} {model_count === 1 ? "model" : "models"} evaluated</span>
          </span>
          <span className="home-panel-count">{result_count.toLocaleString("en-US")} {result_count === 1 ? "result" : "results"}</span>
        </li>
      ))}
    </ul>
  );
}

function LatestAdditions({ results }: { results: HomePanels["latest_additions"] }) {
  if (results.length === 0) return <EmptyState title="No benchmark results yet" description="Newly added results will appear here with their sources." />;
  return (
    <ol className="home-model-list home-additions-list" role="list">
      {results.slice(0, HOME_PANEL_LIMIT).map(result => (
        <li key={result.result_key}>
          <span className="home-model-list__identity">
            <a href={`/models/${result.model.registry_no}`}>{result.model.name}{result.reasoning_level ? ` (${result.reasoning_level})` : ""}</a>
            <BenchmarkLink benchmark={result.benchmark} version={result.benchmark_version} versionSlug={result.benchmark_version_slug} />
          </span>
          <span className="home-model-list__metadata">
            <span className="home-addition-score"><ResultScoreLink result={result} /></span>
            <SourceLink href={result.primary_source_url} context={`${result.model.name} on ${benchmarkVersionLabel(result.benchmark, result.benchmark_version)}`} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function HomePage({ response }: { response: HomePageResponse }) {
  const { benchmark_results: resultCount, models: modelCount, benchmarks: benchmarkCount,
    versions: versionCount } = response.stats.data;
  const count = (value: number) => new Intl.NumberFormat("en-US").format(value);
  const modelGroups = new Map<string, ModelListEntry[]>();
  for (const model of response.all_models) {
    const initial = /^[a-z]$/iu.test(model.name.charAt(0))
      ? model.name.charAt(0).toLocaleUpperCase("en-US")
      : "#";
    modelGroups.set(initial, [...(modelGroups.get(initial) ?? []), model]);
  }

  return (
    <PageContainer className="registry-page home-page">
      <header className="home-intro">
        <h1 tabIndex={-1}>Benchmark Registry</h1>
        <div className="home-scale">
          <p className="home-scale__primary">
            <strong>{count(resultCount)}</strong> benchmark {resultCount === 1 ? "result" : "results"}
          </p>
          <p className="home-scale__support">
            <span>{count(modelCount)} {modelCount === 1 ? "model" : "models"}</span>
            <span>{count(benchmarkCount)} {benchmarkCount === 1 ? "benchmark" : "benchmarks"}</span>
            <span>{count(versionCount)} {versionCount === 1 ? "version" : "versions"}</span>
          </p>
        </div>
      </header>

      <div className="home-sections">
        <section className="home-section" aria-labelledby="explore-benchmarks-heading">
          <header className="home-section__header">
            <div>
              <h2 id="explore-benchmarks-heading">Explore Benchmarks</h2>
              <p>Browse evaluations across models</p>
            </div>
            <a href="/benchmarks">View all benchmarks</a>
          </header>
          <ExploreBenchmarks benchmarks={response.panels.explore_benchmarks} />
        </section>

        <section className="home-section" aria-labelledby="latest-additions-heading">
          <header className="home-section__header">
            <div>
              <h2 id="latest-additions-heading">Latest Additions</h2>
              <p>New benchmark results added to the Registry</p>
            </div>
          </header>
          <LatestAdditions results={response.panels.latest_additions} />
        </section>
      </div>

      <section className="home-directory" aria-labelledby="all-models-heading">
        <header className="home-section__header">
          <div>
            <h2 id="all-models-heading">All Models</h2>
            <p>Alphabetical directory</p>
          </div>
          <span>{count(response.all_models.length)} {response.all_models.length === 1 ? "model" : "models"}</span>
        </header>
        {response.all_models.length === 0 ? (
          <EmptyState
            title="No models found"
            description="The registry does not contain any published models."
          />
        ) : (
          <div className="home-directory__groups">
            {Array.from(modelGroups, ([initial, models]) => (
              <section className="home-directory__group" key={initial} aria-label={`${initial} models`}>
                <h3>{initial}</h3>
                <ul role="list">
                  {models.map((model) => (
                    <li key={model.registry_no}>
                      <a className="home-directory__model" href={`/models/${model.registry_no}`}>
                        {model.name}
                      </a>
                      <span className="home-directory__provider">{model.company.name}</span>
                      <ModelBenchmarkScore result={model.featured_result} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
