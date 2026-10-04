import { PageContainer, PageHeader } from "./ui/components";
export function ContactPage() {
  return <PageContainer className="registry-page legal-page"><PageHeader title="Contact" />
    <p>For questions, corrections or missing results, use <a href="https://github.com/densa-labs/benchmark-registry/issues" rel="noopener noreferrer">GitHub issues</a>.</p>
    <p><a href="https://densa-labs.github.io/" rel="noopener noreferrer">Visit Densa Labs</a>.</p>
  </PageContainer>;
}
