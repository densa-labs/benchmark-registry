// TODO: requires owner/legal review before relying on this
export function PrivacyContent({analyticsEnabled=false}:{analyticsEnabled?:boolean}) {
  return <>
    <p>This is a draft for owner review. You can browse Benchmark Registry without an account.</p>
    <h2>Application data and storage</h2><p>The application stores your theme preference in browser local storage. Public documents and search results are cached in browser and page-session memory.</p>
    <p>Searches and filters travel in request URLs. Searches returning no results are logged as query text, without IP addresses or user identifiers. Server failures emit a route category, status and a safe error message. The checked-in Worker configuration disables persisted invocation logs and traces.</p>
    <p>The Registry application does not set cookies. Hosting infrastructure processes requests to deliver the site; its settings are managed separately by the owner.</p>
    <h2>Optional analytics</h2><p>{analyticsEnabled ? "An optional analytics script is enabled in this deployment's application configuration." : "Optional application analytics is disabled in this deployment's configuration; no analytics script is loaded by the application."}</p>
    <p>Any analytics vendor and its data handling require owner review. Hosting-level analytics can be configured separately and are not controlled by this application setting.</p>
    <h2>External services and corrections</h2><p>Source links and GitHub issue reports open external services with their own privacy practices. The registry displays public model and benchmark data.</p>
    <p>For data errors, see <a href="/corrections">Corrections</a> or <a href="/contact">Contact</a>.</p>
  </>;
}
