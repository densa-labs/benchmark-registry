import { RecordCite } from "./cite";
import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { ResultRow } from "../worker/api";
import { BenchmarkLink } from "./benchmark-link";
import { benchmarkDisplayName, benchmarkVersionLabel } from "./benchmark-names";
import { ANY_REASONING, buildComparisonRows, comparisonHref, comparisonPage, parseComparisonState, reasoningSelection, suggestedComparisons, type ComparisonResponse, type ComparisonRow, type ComparisonState } from "./compare";
import { formatRegistryDate, type ModelDetailResponse } from "./registry";
import { navigateRegistry } from "./navigation";
import { staticFetch, type StaticFetch } from "./static-api";
import { RelatedLinks } from "./seo-content";
import { EmptyState, MetadataRows, PageContainer, PageHeader, PageSizeSelector, Pagination, SourceLink, Tabs } from "./ui/components";

// What tells one side's results apart: only the fields that vary are shown under each score,
// so several runs read as "43.0% low", "53.2% high" instead of repeating the shared context.
function distinguishing(results: ResultRow[], showContext: boolean): (result: ResultRow) => string {
  const fields: ((result: ResultRow) => string)[] = [
    result => result.reasoning_level ?? "",
    result => result.configuration?.label ?? "",
    result => result.benchmark_version,
    result => result.evaluator_names.join(", "),
  ];
  const varying = fields.filter((field, index) => new Set(results.map(field)).size > 1 || (showContext && index >= 2));
  return result => varying.map(field => field(result)).filter(Boolean).join(" · ");
}

function ScoreCell({ results, showContext }: { results: ResultRow[]; showContext: boolean }) {
  if (!results.length) return <span className="compare-unavailable" aria-label="Not available">—</span>;
  const context = distinguishing(results, showContext);
  return <ul className="compare-scores" role="list">{results.map(result => <li key={result.result_key}>
    <span className="compare-score">{result.score.display}</span>
    {context(result) ? <span className="compare-score-context">{context(result)}</span> : null}
  </li>)}</ul>;
}

function EvaluationDetails({ results, name }: { results: ResultRow[]; name: string }) {
  return <div className="compare-evaluation-side"><p className="compare-evaluation-name">{name}</p>
    {results.length ? results.map(result => <div className="compare-evaluation" key={result.result_key}>
      <MetadataRows items={[
        { label: "Score", value: result.score.display },
        { label: "Evaluator", value: result.evaluator_names.join(", ") || "Not recorded" },
        { label: "Version", value: <BenchmarkLink benchmark={result.benchmark} version={result.benchmark_version} versionSlug={result.benchmark_version_slug} /> },
        { label: "Metric", value: `${result.metric.name} (${result.metric.unit})` },
        { label: "Reasoning", value: result.reasoning_level ?? "Not specified" },
        { label: "Configuration", value: result.configuration?.label ?? "Not specified" },
        { label: "Reported", value: formatRegistryDate(result.reported_at, result.reported_precision) },
        { label: "Source", value: <SourceLink href={result.primary_source_url} context={`${name} on ${benchmarkVersionLabel(result.benchmark, result.benchmark_version)}`}>Evaluation source</SourceLink> },
      ]} /><RecordCite result={result} />
    </div>) : <p className="compare-note">No result is available for this selection.</p>}
  </div>;
}

function BenchmarkRows({ rows, names }: { rows: ComparisonRow[]; names: [string, string] }) {
  return <>{rows.map(row => {
    const results = row.results.flat();
    const first = results[0];
    const sameVersion = results.every(result => result.benchmark_version_slug === first.benchmark_version_slug);
    const label = sameVersion ? benchmarkVersionLabel(row.benchmark, first.benchmark_version) : benchmarkDisplayName(row.benchmark);
    return <Fragment key={row.key}>
      <tr className="compare-result-row" role="row">
        <th scope="row" role="rowheader"><div className="compare-benchmark-name"><BenchmarkLink benchmark={row.benchmark} version={sameVersion ? first.benchmark_version : undefined} versionSlug={sameVersion ? first.benchmark_version_slug : undefined} />
          {row.differences.length ? <span className="compare-context-warning" title={row.differences.join(" ")}><span aria-hidden="true">ⓘ</span><span className="visually-hidden">Potentially non-equivalent: {row.differences.join(" ")}</span></span> : null}
        </div></th>
        {row.results.map((side, index) => <td className="numeric" role="cell" key={index}><ScoreCell results={side} showContext={row.differences.length > 0} /></td>)}
      </tr>
      <tr className="compare-detail-row" role="row"><td colSpan={3} role="cell"><details className="compare-details">
        <summary><span>{row.differences.length ? "Potentially non-equivalent · " : ""}Evaluation details<span className="visually-hidden"> for {label}</span></span></summary>
        <div className="compare-details-body">
          <p className="compare-details-context">{row.differences.length ? row.differences.join(" ") : row.shared ? "The recorded benchmark version, metric, and evaluator sets match." : "A result is available for only one selection."} Evaluation methodology is not recorded by the registry.</p>
          <div className="compare-evaluations">{row.results.map((side, index) => <EvaluationDetails key={index} results={side} name={names[index]} />)}</div>
        </div>
      </details></td></tr>
    </Fragment>;
  })}</>;
}

// Explicit table roles keep row and column semantics when phone styles turn rows into grids.
export function BenchmarkSection({ title, rows, names, level = 3 }: { title: string; rows: ComparisonRow[]; names: [string, string]; level?: 2 | 3 }) {
  if (!rows.length) return null;
  const Heading = level === 2 ? "h2" : "h3";
  const id = title === "Shared benchmarks" ? "shared-benchmarks" : "other-benchmarks";
  return <section className="compare-benchmark-section" aria-labelledby={id}>
    <div className="compare-section-heading"><Heading id={id}>{title}</Heading><span>{rows.length}</span></div>
    <div className="compare-table-scroll" role="region" tabIndex={0} aria-label={`${title}, scrollable`}>
      <table className="compare-table" role="table"><caption className="visually-hidden">{title} for {names.join(" and ")}</caption>
        <colgroup><col className="compare-label-col" /><col /><col /></colgroup>
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Benchmark</th>{names.map((name, index) => <th scope="col" role="columnheader" className="numeric" key={index}>{name}</th>)}</tr></thead>
        <tbody role="rowgroup"><BenchmarkRows rows={rows} names={names} /></tbody>
      </table>
    </div>
  </section>;
}

function Information({ selected, names }: { selected: ComparisonResponse["selected"]; names: [string, string] }) {
  const fields: { label: string; value: (response: ModelDetailResponse) => ReactNode }[] = [
    { label: "Organization", value: ({ data: { model } }) => <a href={`/companies/${model.company.slug}`}>{model.company.name}</a> },
    { label: "Released", value: ({ data: { model } }) => formatRegistryDate(model.released_at, model.release_precision) },
    { label: "Registry No.", value: ({ data: { model } }) => <a className="registry-number" href={`/models/${model.registry_no}`}>{model.registry_no}</a> },
    { label: "Status", value: ({ data: { model } }) => <span className="model-status">{model.status}</span> },
    { label: "Source", value: ({ data: { model } }) => <SourceLink href={model.source_url} context={model.name} /> },
  ];
  return <section className="compare-information" aria-labelledby="compare-information-heading">
    <h2 id="compare-information-heading">Information</h2>
    <div className="compare-table-scroll" role="region" tabIndex={0} aria-label="Model information, scrollable">
      <table className="compare-table compare-information-table" role="table"><caption className="visually-hidden">Model information</caption>
        <colgroup><col className="compare-label-col" /><col /><col /></colgroup>
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader"><span className="visually-hidden">Information</span></th>{names.map((name, index) => <th scope="col" role="columnheader" key={index}>{name}</th>)}</tr></thead>
        <tbody role="rowgroup">{fields.map(field => <tr key={field.label} role="row"><th scope="row" role="rowheader">{field.label}</th>{selected.map((response, index) => <td key={index} role="cell">{response ? field.value(response) : <span className="compare-unavailable" aria-label="Not available">—</span>}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function CopyLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(new URL(href, window.location.origin).href); setCopied(true); }
    catch { window.location.assign(href); }
  };
  return <>
    <button type="button" className="copy-link" onClick={() => void copy()}>{copied ? "Link copied" : "Copy link"}</button>
    <span className="visually-hidden" role="status">{copied ? "Comparison link copied" : ""}</span>
  </>;
}

export function ComparePage({ response, currentSearch }: { response: ComparisonResponse; currentSearch: string }) {
  let state: ComparisonState;
  try { state = parseComparisonState(currentSearch); } catch { state = parseComparisonState(""); }
  const selections = response.selected.map((model, index) => reasoningSelection(model, state.reasoning[index]));
  const effective: ComparisonState = { ...state, models: response.selected.map((model, index) => model?.data.model.registry_no ?? state.models[index]) as ComparisonState["models"], reasoning: selections.map((selection, index) => response.selected[index] ? selection.value : undefined) as ComparisonState["reasoning"] };
  const names: [string, string] = [response.selected[0]?.data.model.name ?? "Model A", response.selected[1]?.data.model.name ?? "Model B"];
  const rows = buildComparisonRows(selections[0].results, selections[1].results);
  const page = comparisonPage(rows, state);
  const ready = response.selected.every(Boolean);
  // The page preloads the shared data files; reading them now makes the first pick fast.
  useEffect(() => { (staticFetch as StaticFetch).prefetch?.(["models", "featured", "redirects"]); }, []);
  const groups = [...new Set(response.models.map(model => model.company.name))].sort((a, b) => a.localeCompare(b, "en"));
  const update = (change: Partial<ComparisonState>) => navigateRegistry(comparisonHref({ ...effective, ...change, page: 1 }));
  const chooseModel = (side: number, value: string) => {
    const models: ComparisonState["models"] = [...effective.models]; models[side] = value;
    const reasoning: ComparisonState["reasoning"] = [...effective.reasoning]; reasoning[side] = undefined;
    update({ models, reasoning });
  };
  const chooseReasoning = (side: number, value: string) => {
    const reasoning: ComparisonState["reasoning"] = [...effective.reasoning]; reasoning[side] = value === ANY_REASONING ? undefined : value; update({ reasoning });
  };
  const queryFields = (exclude: string[]) => [...new URLSearchParams(comparisonHref(effective).split("?")[1])].filter(([key]) => !exclude.includes(key)).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />);
  const submitSelection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = parseComparisonState(new URLSearchParams([...data].map(([key, value]) => [key, String(value)])).toString());
    navigateRegistry(comparisonHref(next));
  };
  return <PageContainer className="registry-page compare-page">
    <PageHeader title="Compare models" description="Model information and benchmark results, side by side." />
    {response.issues.length ? <div className="compare-query-error" role="alert">{response.issues.map(issue => <p key={issue}>{issue}</p>)}<a href="/compare">Reset comparison</a></div> : null}
    <form className="compare-selectors" method="get" action="/compare" onSubmit={submitSelection} aria-label="Select models to compare">
      {queryFields(["models", "reasoning", "page"])}
      <p className="compare-selector-intro" aria-hidden="true">Models</p>
      {([0, 1] as const).map(side => {
        const label = side === 0 ? "A" : "B";
        const model = response.selected[side]?.data.model;
        const selection = selections[side];
        return <div className="compare-selector" key={side}>
          <label htmlFor={`compare-model-${side}`}>Model {label}</label>
          <select id={`compare-model-${side}`} name={`model_${side === 0 ? "a" : "b"}`} value={effective.models[side]} onChange={event => chooseModel(side, event.target.value)}>
            <option value="">Select a model</option>
            {effective.models[side] && !response.models.some(item => item.registry_no === effective.models[side]) ? <option value={effective.models[side]}>{model?.name ?? `Unavailable model (${effective.models[side]})`}</option> : null}
            {groups.map(group => <optgroup label={group} key={group}>{response.models.filter(item => item.company.name === group).map(item => <option value={item.registry_no} key={item.registry_no}>{item.name}</option>)}</optgroup>)}
          </select>
          <div className="compare-reasoning"><label htmlFor={`compare-reasoning-${side}`}>Reasoning<span className="visually-hidden"> level for Model {label}</span></label>
            <select id={`compare-reasoning-${side}`} name={`reasoning_${side === 0 ? "a" : "b"}`} value={selection.available.length ? selection.value ?? ANY_REASONING : ""} disabled={!model || !selection.available.length} onChange={event => chooseReasoning(side, event.target.value)}>
              {!selection.available.length ? <option value="">{model ? "No results" : "Select a model first"}</option> : null}
              {selection.available.length ? <option value={ANY_REASONING}>Any</option> : null}
              {selection.unavailable ? <option value={selection.value ?? ""}>{selection.value || "Not specified"} (unavailable)</option> : null}
              {selection.available.map(level => <option value={level} key={level}>{level || "Not specified"}</option>)}
            </select>
          </div>
          {selection.unavailable ? <p className="compare-selection-note" role="status">No results at this reasoning level. Choose an available level.</p> : null}
        </div>;
      })}
      <noscript><button type="submit" className="compare-apply">Compare</button></noscript>
    </form>
    {!ready ? <><h2 className="visually-hidden">Comparison</h2><EmptyState title="Choose two models to compare" description="Pick a model on each side. Each one's recorded reasoning levels then appear below it." /><RelatedLinks links={suggestedComparisons(response)} label="Suggested comparisons" /></> : <>
      <Information selected={response.selected} names={names} />
      <section className="results-section compare-benchmarks" aria-labelledby="compare-benchmarks-heading">
        <div className="results-section__header">
          <div><h2 id="compare-benchmarks-heading">Benchmarks</h2><p>{page.total} {page.total === 1 ? "benchmark" : "benchmarks"}</p></div>
          <CopyLink href={comparisonHref(effective)} />
        </div>
        <div className="compare-results-controls">
          <form className="compare-search" role="search" aria-label="Search comparison benchmarks" method="get" action="/compare">
            {queryFields(["q", "page"])}
            <label className="visually-hidden" htmlFor="compare-benchmark-search">Search benchmarks</label>
            <input id="compare-benchmark-search" name="q" type="search" maxLength={50} defaultValue={state.query} placeholder="Search benchmarks" />
            <button type="submit">Search</button>
            {state.query ? <a href={comparisonHref({ ...effective, query: "", page: 1 })}>Clear</a> : null}
          </form>
          <Tabs label="Benchmarks to compare" items={[
            { label: "Shared only", href: comparisonHref({ ...effective, sharedOnly: true, page: 1 }), active: state.sharedOnly },
            { label: "All", href: comparisonHref({ ...effective, sharedOnly: false, page: 1 }), active: !state.sharedOnly },
          ]} />
        </div>
        <p className="compare-note">Scores keep their original metrics. Matching versions and evaluators do not establish identical evaluation methodology.</p>
        {!page.total ? <EmptyState title={state.query ? "No matching benchmarks" : state.sharedOnly ? "No shared benchmarks" : "No benchmark results"} description={state.query ? "Try another benchmark name, version, or alias." : "Try another model or reasoning level."} />
          : !page.shared.length && !page.other.length ? <EmptyState title="No benchmarks on this page" description="Return to the first page to view the comparison." action={<a href={comparisonHref({ ...effective, page: 1 })}>First page</a>} />
          : <>
            {!page.shared.length && state.page === 1 && !state.sharedOnly ? <p className="compare-note">No shared benchmarks for these reasoning levels.</p> : null}
            <BenchmarkSection title="Shared benchmarks" rows={page.shared} names={names} />
            <BenchmarkSection title="Other benchmarks" rows={page.other} names={names} />
          </>}
        {page.total > 50 || state.limit !== 50 || page.totalPages > 1 ? <div className="compare-pagination">
          {page.total > 50 || state.limit !== 50 ? <form className="page-size-form" method="get" action="/compare">{queryFields(["limit", "page"])}<PageSizeSelector id="compare-page-size" value={state.limit} autoSubmit /><noscript><button type="submit">Apply</button></noscript></form> : null}
          <Pagination page={state.page} totalPages={page.totalPages} getHref={number => comparisonHref({ ...effective, page: number })} />
        </div> : null}
      </section>
    </>}
  </PageContainer>;
}
