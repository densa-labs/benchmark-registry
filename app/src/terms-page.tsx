// TODO: requires owner/legal review before relying on this
import { DATA_LICENSE } from "./data-license";
export function TermsContent() {
  return <>
    <p>This is a draft for owner review. Benchmark Registry is a public reference for reported AI benchmark results.</p>
    <h2>Results and sources</h2><p>Records come from third-party primary sources and are provided as-is. Check each source, metric, version and evaluator before citing a number. Records can be incomplete or corrected.</p>
    <p>Use the <a href="/corrections">corrections log</a> and <a href="/contact">contact page</a> to report errors.</p>
    <h2>Licensing</h2><p>Registry data is licensed under <a href={DATA_LICENSE.url} rel="noopener noreferrer">{DATA_LICENSE.name}</a>. Attribution: {DATA_LICENSE.attribution}</p>
    <p>Repository code is licensed under <a href="https://github.com/densa-labs/benchmark-registry/blob/main/LICENSE" rel="noopener noreferrer">Apache-2.0</a>. Linked third-party publications have their own terms.</p>
  </>;
}
