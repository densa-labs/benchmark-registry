import { LEGAL_METADATA, type LegalKind } from "./legal-content";
import { PageContainer, PageHeader } from "./ui/components";
import { ExternalIcon } from "./ui/icons";

function Contact() {
  return <section><h2>Contact</h2><p>For questions or corrections, email <a href="mailto:support@benchmarkregistry.org">support@benchmarkregistry.org</a>.</p></section>;
}

function PrivacyPolicy() {
  return <>
    <p>Benchmark Registry is a public reference service. You can browse it without an account.</p>
    <section><h2>Information processed when you visit</h2>
      <p>Cloudflare hosts and protects the site. Delivering and securing a request involves processing its URL, IP and network information, browser/request headers, and connection/security information. This can include approximate geographic information derived from network information, such as country, city or region. We do not request device GPS location.</p>
      <p>Cloudflare can also inject browser security checks that evaluate browser characteristics and activity to distinguish automation. Cloudflare’s separate security analytics can retain sampled request records, including IP addresses, request paths and browser/device categories. This is separate from information we save in application diagnostics.</p>
    </section>
    <section><h2>Benchmark Registry diagnostics</h2>
      <p>We use aggregate request counts, failures, response status, cache activity and performance metrics for reliability, debugging and security. Persisted per-request Worker logs, automatic invocation records and traces are disabled. We do not export application logs to another destination.</p>
      <p>Application errors emit only a fixed failure category and build version. During exceptional debugging, authorized operators can view temporary live diagnostics; Cloudflare may include request and network context in that live view. We do not save those live sessions as application logs.</p>
    </section>
    <section><h2>Cloudflare Web Analytics</h2>
      <p>We use Cloudflare Web Analytics on the public site to understand aggregate page views, visits and web performance. It processes page paths, referring pages, browser/device categories, country information and performance measurements. Query strings, including search terms, are not logged by Web Analytics. Ad blockers and privacy tools can prevent measurement.</p>
      <p>We enable Cloudflare’s “excluding visitor data in the EU” setting. Cloudflare defines this exclusion by the data center a visitor connects to: its listed EU/EEA countries, plus Switzerland and the United Kingdom. The analytics beacon is not injected for those connections. This exclusion applies to Web Analytics; Cloudflare still separately processes requests for delivery and security.</p>
      <p>The analytics beacon does not use cookies or browser storage. Cloudflare receives the source IP as part of handling a beacon request, then discards it at the nearest data center rather than storing it in RUM databases or logs. Web Analytics is separate from our disabled persisted application request logging and from Cloudflare’s security storage.</p>
    </section>
    <section><h2>Storage in your browser</h2>
      <p>Your Light, Dark or System theme choice is saved locally until you change it or clear browser storage. Public Registry pages and data are cached for speed. Navigation and search results can remain in page-session memory, are refreshed or invalidated as data changes, and disappear when the page session ends.</p>
      <p>Searches and filters are sent in the request URL to show matching public data. Your browser may keep visited URLs in its history and responses in its ordinary HTTP cache. We do not keep a persistent application search history or use these caches to build a visitor profile.</p>
    </section>
    <section><h2>Cookies and advertising</h2>
      <p>The Registry application does not set cookies. Cloudflare’s browser security checks may use session storage and technical security cookies when needed to protect or deliver the service. We do not add advertising, behavioral analytics or session replay scripts. We do not use visitor information for advertising or behavioral profiling, and we do not sell it.</p>
    </section>
    <section><h2>Support email</h2>
      <p>Viewing the site does not send us your email address. If you choose to email support, we receive your address, message, and any name, signature or attachments you include. We use that information to respond and handle follow-up. We do not currently specify a fixed automatic deletion period for support correspondence; contact us about a message you have sent.</p>
    </section>
    <section><h2>Public data and external links</h2>
      <p>The public Registry stores information about companies, models, benchmarks, evaluation results and sources. This public reference data is separate from visitor information.</p>
      <p>Following a source, GitHub, Densa Labs or other external link takes you to another service with its own privacy practices.</p>
    </section>
    <section><h2>Retention</h2>
      <p>New per-request Worker logs and traces are not persisted. Logs saved before the September 28, 2026 hardening may contain IP addresses, network-derived location, browser/connection information and full request URLs, including queries. Those earlier logs expire automatically within Cloudflare’s three-day Workers Free retention period; disabling new persistence does not erase them immediately.</p>
      <p>Aggregate Worker metrics are available for up to three months and zone analytics for the last 30 days. Web Analytics data is unsampled for seven days, then available in sampled aggregates for up to six months. These are separate from application request logs. Our application logging settings do not control Cloudflare’s separate security processing. On our current Free zone plan, Security Events are available for 24 hours and Security Analytics for seven days. Cloudflare security session storage lasts for the browser tab session; security cookies have their own lifetimes. Local theme storage remains until changed or cleared; page-session caches end with the session, and your browser controls its history and HTTP-cache retention.</p>
    </section>
    <section><h2>Changes</h2><p>We may update this policy when the service or its data handling changes. The date above identifies this version.</p></section>
    <Contact />
  </>;
}

function Terms() {
  return <>
    <section><h2>Service</h2><p>Benchmark Registry provides structured information about AI models, benchmarks and reported evaluation results. It is a public informational service with no visitor accounts, payments or user submissions.</p></section>
    <section><h2>Accuracy and availability</h2><p>We aim to provide useful, accurate information, but records may be incomplete, corrected or updated and may depend on third-party sources and evaluators. Check the cited sources and evaluation context before relying on a result. We do not promise perfect accuracy or continuous availability.</p></section>
    <section><h2>Sources and affiliation</h2><p>We identify or link to sources where available. Third-party content remains subject to its own terms and licensing. Listing a company, model or benchmark does not by itself imply endorsement, sponsorship or affiliation.</p></section>
    <section><h2>Acceptable use</h2><p>You may browse and refer to the public Registry. Do not attempt to disrupt the service, bypass its security controls or interfere with other visitors’ access.</p></section>
    <section><h2>Code and other material</h2><p>The repository code is available under the <a href="https://github.com/densa-labs/benchmark-registry/blob/main/LICENSE">Apache License 2.0</a>. That code license does not automatically license third-party benchmark data, source material, company names or trademarks. These Terms do not grant a separate license to the Registry dataset.</p></section>
    <section><h2>External links</h2><p>Linked services have their own terms and practices. We do not control those services.</p></section>
    <section><h2>Changes</h2><p>The Registry may evolve, correct data or change features. We may update these Terms as the service changes; the date above identifies this version.</p></section>
    <Contact />
  </>;
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  return <PageContainer className="registry-page legal-page">
    <PageHeader title={LEGAL_METADATA[kind].title} />
    {kind === "legal" ? <>
      <p>Privacy, terms and contact information for Benchmark Registry.</p>
      <section><h2><a href="/privacy">Privacy Policy</a></h2><p>How visitor information is processed and what the service stores.</p></section>
      <section><h2><a href="/terms">Terms</a></h2><p>Terms for using this public reference service.</p></section>
      <section><h2><a className="source-link" href="mailto:support@benchmarkregistry.org">Support<ExternalIcon /></a></h2><p>For questions or corrections: <span className="legal-email">support@benchmarkregistry.org</span>.</p></section>
    </> : <>
      <p className="legal-updated">Last updated: {kind === "privacy"
        ? <time dateTime="2026-09-30">September 30, 2026</time>
        : <time dateTime="2026-09-28">September 28, 2026</time>}</p>
      {kind === "privacy" ? <PrivacyPolicy /> : <Terms />}
    </>}
  </PageContainer>;
}
