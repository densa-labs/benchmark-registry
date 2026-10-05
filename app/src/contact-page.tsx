import { SUPPORT_EMAIL } from "./legal-content";
import { PageContainer, PageHeader } from "./ui/components";
export function ContactPage() {
  return <PageContainer className="registry-page legal-page"><PageHeader title="Contact" />
    <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for questions, corrections or missing results.</p>
    <p>You can also open a <a href="https://github.com/densa-labs/benchmark-registry/issues" rel="noopener noreferrer">GitHub issue</a>.</p>
    <p><a href="https://densa-labs.github.io/" rel="noopener noreferrer">Visit Densa Labs</a>.</p>
  </PageContainer>;
}
