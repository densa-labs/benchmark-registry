import {
  AppShell,
  DataTable,
  MetadataRows,
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
      <PageContainer className="registry-page">
        <PageHeader title="Gemini 2.5 Pro" />

        <section className="entity-metadata" aria-label="Model metadata">
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

        <section className="results-section" aria-labelledby="table-heading">
          <div className="results-section__header">
            <div>
              <h2 id="table-heading">Benchmarks</h2>
              <p>3 results</p>
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
            caption="Benchmark results for Gemini 2.5 Pro"
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
      </PageContainer>
    </AppShell>
  );
}
