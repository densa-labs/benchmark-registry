import type { ModelSummary } from "../worker/api";
import { formatRegistryDate, type HomePageResponse } from "./registry";
import { EmptyState, PageContainer, PageHeader } from "./ui/components";

const HOMEPAGE_MODEL_LIMIT = 5;

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
  const modelCount = response.recent_models.page.total_items;
  const recordLabel = `${new Intl.NumberFormat("en-US").format(modelCount)} ${
    modelCount === 1 ? "record" : "records"
  }`;

  return (
    <PageContainer className="registry-page home-page">
      <PageHeader
        title="Benchmark Registry"
        description={recordLabel}
      />

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
    </PageContainer>
  );
}
