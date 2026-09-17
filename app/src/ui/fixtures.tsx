import type { TableColumn } from "./components";
import { SourceLink } from "./components";

export interface ResultFixture {
  resultKey: string;
  company: string;
  companySlug: string;
  model: string;
  registryNo: string;
  benchmark: string;
  benchmarkSlug: string;
  version: string;
  score: string;
  sourceUrl: string;
}

export const resultFixtures: ResultFixture[] = [
  {
    resultKey: "fixture-gemini-gpqa",
    company: "Google",
    companySlug: "google",
    model: "Gemini 2.5 Pro",
    registryNo: "30002",
    benchmark: "GPQA",
    benchmarkSlug: "gpqa",
    version: "Diamond",
    score: "86.4%",
    sourceUrl: "https://storage.googleapis.com/deepmind-media/gemini/gemini_v2_5_report.pdf",
  },
  {
    resultKey: "fixture-gpt-oss-gpqa",
    company: "OpenAI",
    companySlug: "openai",
    model: "gpt-oss-120b (High, no tools)",
    registryNo: "15001",
    benchmark: "GPQA",
    benchmarkSlug: "gpqa",
    version: "Diamond",
    score: "80.1%",
    sourceUrl: "https://deploymentsafety.openai.com/gpt-oss/a2",
  },
  {
    resultKey: "fixture-claude-swe-bench",
    company: "Anthropic",
    companySlug: "anthropic",
    model: "Claude Sonnet 4 (Standard, no extended thinking)",
    registryNo: "20003",
    benchmark: "SWE-bench",
    benchmarkSlug: "swe-bench",
    version: "Verified",
    score: "72.7%",
    sourceUrl: "https://www.anthropic.com/news/claude-4",
  },
];

export const resultColumns: TableColumn<ResultFixture>[] = [
  {
    key: "company",
    label: "Company",
    sortHref: "?sort=company&order=asc",
    render: (row) => <a href={`/companies/${row.companySlug}`}>{row.company}</a>,
  },
  {
    key: "model",
    label: "Model",
    className: "data-table__primary",
    sortHref: "?sort=model&order=desc",
    sortDirection: "asc",
    render: (row) => <a href={`/models/${row.registryNo}`}>{row.model}</a>,
  },
  {
    key: "benchmark",
    label: "Benchmark",
    sortHref: "?sort=benchmark&order=asc",
    render: (row) => <a href={`/benchmarks/${row.benchmarkSlug}`}>{row.benchmark}</a>,
  },
  {
    key: "version",
    label: "Version",
    render: (row) => row.version,
  },
  {
    key: "score",
    label: "Score",
    className: "numeric",
    render: (row) => row.score,
  },
  {
    key: "source",
    label: "Source",
    render: (row) => <SourceLink href={row.sourceUrl} />,
  },
  {
    key: "registry-no",
    label: "Registry No.",
    className: "numeric registry-number",
    sortHref: "?sort=registry_no&order=asc",
    render: (row) => <a href={`/models/${row.registryNo}`}>{row.registryNo}</a>,
  },
];
