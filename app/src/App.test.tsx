import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import {
  DataTable,
  EmptyState,
  LoadingState,
  MetadataRows,
  NotFoundState,
  PageSizeSelector,
  Pagination,
  SourceLink,
  Tabs,
} from "./ui/components";
import { resultColumns, resultFixtures } from "./ui/fixtures";

describe("UI foundation fixture gallery", () => {
  it("renders the application shell, navigation, search, and container", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Skip to content");
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('role="search"');
    expect(markup).toContain('maxLength="50"');
    expect(markup).toContain("Models");
    expect(markup).toContain("Benchmarks");
    expect(markup).toContain("Companies");
    expect(markup).toContain('id="main-content"');
  });

  it("renders metadata and source links with external-link treatment", () => {
    const markup = renderToStaticMarkup(
      <MetadataRows
        items={[
          { label: "Registry No.", value: "30002" },
          {
            label: "Source",
            value: <SourceLink href="https://example.com/evidence">Evidence</SourceLink>,
          },
        ]}
      />,
    );

    expect(markup).toContain("<dl");
    expect(markup).toContain("Registry No.");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
    expect(markup).toContain("opens in a new tab");
  });

  it("renders a scrollable data table with sortable headers and a display-only score", () => {
    const markup = renderToStaticMarkup(
      <DataTable
        caption="Fixture results"
        columns={resultColumns}
        rows={resultFixtures}
        getRowKey={(row) => row.resultKey}
      />,
    );

    expect(markup).toContain('class="table-scroll"');
    expect(markup).toContain('aria-sort="ascending"');
    expect(markup).toContain("Sort by Model descending");
    expect(markup).toContain('?sort=model&amp;order=desc');
    expect(markup).toContain("Gemini 2.5 Pro");
    expect(markup).toContain(">Score<");
    expect(markup).not.toContain("Sort by Score");
  });

  it("renders only the frozen page-size options", () => {
    const markup = renderToStaticMarkup(<PageSizeSelector value={100} />);

    expect(markup).toContain('<option value="50">50</option>');
    expect(markup).toContain('<option value="100" selected="">100</option>');
    expect(markup).toContain('<option value="500">500</option>');
    expect(markup).not.toContain("All");
  });

  it("renders tabs and pagination with shareable links and active semantics", () => {
    const markup = renderToStaticMarkup(
      <>
        <Tabs
          label="Result view"
          items={[
            { href: "?view=latest", label: "Latest", active: true },
            { href: "?view=history", label: "History" },
          ]}
        />
        <Pagination page={2} totalPages={4} getHref={(page) => `?page=${page}&limit=50`} />
      </>,
    );

    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('?view=history');
    expect(markup).toContain('?page=1&amp;limit=50');
    expect(markup).toContain('?page=3&amp;limit=50');
    expect(markup).toContain("Page <strong>2</strong> of <strong>4</strong>");
  });

  it("renders loading, empty, and not-found states", () => {
    const markup = renderToStaticMarkup(
      <>
        <LoadingState rows={2} />
        <EmptyState title="No matching results" description="Clear the filter." />
        <NotFoundState />
      </>,
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Loading registry results");
    expect(markup).toContain("No matching results");
    expect(markup).toContain("Registry entry not found");
    expect(markup).toContain('href="/models"');
  });

  it("renders every P6 primitive in the fixture gallery", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Registry interface primitives");
    expect(markup).toContain("Model metadata");
    expect(markup).toContain("3 fixture results");
    expect(markup).toContain("Latest");
    expect(markup).toContain("History");
    expect(markup).toContain("Rows per page");
    expect(markup).toContain("System states");
  });
});
