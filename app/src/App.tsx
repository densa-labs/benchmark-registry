import {
  AppShell,
  DataTable,
  EmptyState,
  LoadingState,
  MetadataRows,
  NotFoundState,
  PageContainer,
  PageHeader,
  PageSizeSelector,
  Pagination,
  SourceLink,
  Tabs,
} from "./ui/components";
import { resultColumns, resultFixtures } from "./ui/fixtures";

const navigation = [
  { href: "/models", label: "Models" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/companies", label: "Companies" },
];

export function App() {
  return (
    <AppShell
      navigation={navigation}
      onSearchSubmit={(event) => event.preventDefault()}
    >
      <PageContainer className="foundation-page">
        <PageHeader
          kicker="UI foundation"
          title="Registry interface primitives"
          description="Reusable, accessible controls for source-backed model and benchmark data."
        />

        <section className="specimen" aria-labelledby="metadata-heading">
          <div className="specimen__header">
            <div>
              <h2 id="metadata-heading">Model metadata</h2>
              <p>Compact definition rows keep provenance next to each fact.</p>
            </div>
          </div>
          <MetadataRows
            items={[
              { label: "Released", value: "March 25, 2025" },
              { label: "Company", value: <a href="/companies/google">Google</a> },
              {
                label: "Source",
                value: (
                  <SourceLink href="https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-model-thinking-updates-march-2025/">
                    Release announcement
                  </SourceLink>
                ),
              },
              { label: "Registry No.", value: <span className="registry-number">30002</span> },
            ]}
          />
        </section>

        <section className="specimen" aria-labelledby="table-heading">
          <div className="specimen__header specimen__header--split">
            <div>
              <h2 id="table-heading">Results</h2>
              <p>3 fixture results</p>
            </div>
            <PageSizeSelector value={50} id="results-page-size" />
          </div>
          <Tabs
            label="Result view"
            items={[
              { href: "?view=latest", label: "Latest", active: true },
              { href: "?view=history", label: "History" },
            ]}
          />
          <DataTable
            caption="Benchmark result fixtures"
            columns={resultColumns}
            rows={resultFixtures}
            getRowKey={(row) => row.resultKey}
          />
          <Pagination
            page={2}
            totalPages={8}
            getHref={(page) => `?page=${page}&limit=50&view=latest`}
          />
        </section>

        <section className="specimen" aria-labelledby="states-heading">
          <div className="specimen__header">
            <div>
              <h2 id="states-heading">System states</h2>
              <p>Predictable feedback for every data-loading outcome.</p>
            </div>
          </div>
          <div className="state-grid">
            <div>
              <h3>Loading</h3>
              <LoadingState />
            </div>
            <div>
              <h3>Empty</h3>
              <EmptyState
                title="No matching results"
                description="Try a different search term or remove the active company filter."
                action={<a href="?">Clear filters</a>}
              />
            </div>
            <div>
              <h3>Not found</h3>
              <NotFoundState />
            </div>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
