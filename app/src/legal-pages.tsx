import { LEGAL_METADATA, SUPPORT_EMAIL, type LegalKind } from "./legal-content";
import { PageContainer, PageHeader } from "./ui/components";
import { AboutPage } from "./about-page";
import { ContactPage } from "./contact-page";
import { PrivacyContent } from "./privacy-page";
import { TermsContent } from "./terms-page";
export function LegalPage({ kind,analyticsEnabled=false }: { kind: LegalKind;analyticsEnabled?:boolean }) {
  if(kind==="about") return <AboutPage />;
  if(kind==="contact") return <ContactPage />;
  return <PageContainer className="registry-page legal-page"><PageHeader title={LEGAL_METADATA[kind].title} />
    {kind === "legal" ? <>
      <p>Privacy, terms and contact information for Benchmark Registry.</p>
      <p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a></p>
      <p>Contact: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </> : kind === "privacy" ? <PrivacyContent analyticsEnabled={analyticsEnabled} /> : <TermsContent />}
  </PageContainer>;
}
