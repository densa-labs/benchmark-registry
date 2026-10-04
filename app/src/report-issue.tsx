import { issueHref } from "./issue-report";
export function ReportIssue(props: Parameters<typeof issueHref>[0]) {
  return <a className="report-issue" href={issueHref(props)} rel="noopener noreferrer">Report an issue</a>;
}
