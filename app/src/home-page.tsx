import type { ModelSummary } from "../worker/api";
import { formatRegistryDate, type HomePageResponse } from "./registry";
import { EmptyState, PageContainer } from "./ui/components";

const HOMEPAGE_MODEL_LIMIT = 5;

export function HomeLoadingState() {
  return (
    <PageContainer className="registry-page home-page home-page--loading">
      <div role="status" aria-busy="true" aria-label="Loading homepage data">
        <span className="visually-hidden">Loading homepage data</span>
        <div className="home-loading__intro" />
        <div className="home-loading__sections">
          <div /><div />
        </div>
        <div className="home-loading__directory" />
      </div>
    </PageContainer>
  );
}

function ModelList({
  models,
  dateKind,
}: {
  models: ModelSummary[];
  dateKind: "released" | "published";
}) {
  if (models.length === 0) {
    return (
      <EmptyState
        title="No models found"
        description="The registry does not contain any published models."
      />
    );
  }

  return (
    <ol className="home-model-list">
      {models.slice(0, HOMEPAGE_MODEL_LIMIT).map((model) => {
        const date = dateKind === "released"
          ? formatRegistryDate(model.released_at, model.release_precision)
          : formatRegistryDate(model.published_at, "timestamp");

        return (
          <li key={model.registry_no}>
            <span className="home-model-list__identity">
              <a href={`/models/${model.registry_no}`}>{model.name}</a>
              <a href={`/companies/${model.company.slug}`}>{model.company.name}</a>
            </span>
            <span className="home-model-list__metadata">
              <time dateTime={dateKind === "released" ? model.released_at : model.published_at}>
                {date}
              </time>
              <a className="registry-number" href={`/models/${model.registry_no}`}>
                {model.registry_no}
              </a>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function HomePage({ response }: { response: HomePageResponse }) {
  const { benchmark_results: resultCount, models: modelCount, benchmarks: benchmarkCount,
    versions: versionCount } = response.stats.data;
  const count = (value: number) => new Intl.NumberFormat("en-US").format(value);
  const modelGroups = new Map<string, ModelSummary[]>();
  for (const model of response.all_models) {
    const initial = /^[a-z]$/iu.test(model.name.charAt(0))
      ? model.name.charAt(0).toLocaleUpperCase("en-US")
      : "#";
    modelGroups.set(initial, [...(modelGroups.get(initial) ?? []), model]);
  }

  return (
    <PageContainer className="registry-page home-page">
      <header className="home-intro">
        <h1>Benchmark Registry</h1>
        <div className="home-scale" aria-label="Registry size">
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
        <section className="home-section" aria-labelledby="recent-models-heading">
          <header className="home-section__header">
            <div>
              <h2 id="recent-models-heading">Recent Models</h2>
              <p>Ordered by release date</p>
            </div>
            <a href="/models">View all models</a>
          </header>
          <ModelList models={response.recent_models.data} dateKind="released" />
        </section>

        <section className="home-section" aria-labelledby="recently-added-heading">
          <header className="home-section__header">
            <div>
              <h2 id="recently-added-heading">Recently Added</h2>
              <p>Ordered by Registry publication date</p>
            </div>
            <a href="/models?sort=published&order=desc">View all additions</a>
          </header>
          <ModelList models={response.recently_added.data} dateKind="published" />
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
                <ul>
                  {models.map((model) => (
                    <li key={model.registry_no}>
                      <a className="home-directory__model" href={`/models/${model.registry_no}`}>
                        {model.name}
                      </a>
                      <span className="home-directory__provider">{model.company.name}</span>
                      <span className="registry-number">{model.registry_no}</span>
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
