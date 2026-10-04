import { CORRECTIONS, type Correction } from "./corrections";
import { CORRECTION_ISSUE_URL } from "./issue-report";
import { DataTable, PageContainer, PageHeader } from "./ui/components";
export function CorrectionsPage({ entries = CORRECTIONS }: { entries?: Correction[] }) {
  return <PageContainer className="registry-page legal-page"><PageHeader title="Corrections" description="Recorded changes to Registry results." />
    {entries.length ? <DataTable caption="Recorded corrections" rows={[...entries].sort((a,b)=>b.date.localeCompare(a.date))} getRowKey={row=>JSON.stringify(row)} columns={[
      {key:"date",label:"Date",render:row=><time dateTime={row.date}>{row.date}</time>},
      {key:"record",label:"Record number",render:row=>row.record_number},
      {key:"change",label:"What changed",render:row=>row.what_changed},
      {key:"reason",label:"Reason",render:row=>row.reason},
    ]} /> : <p>No corrections have been recorded yet.</p>}
    <p><a href={CORRECTION_ISSUE_URL} rel="noopener noreferrer">Report a correction on GitHub</a></p>
  </PageContainer>;
}
