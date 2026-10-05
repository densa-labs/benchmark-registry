import { BadgeSnippet } from "./badge-snippet";
import { useEffect, useRef, useSyncExternalStore, useState } from "react";
import { generateCitation, recordCitation, recordPermalink, type CitationInput } from "./citation";
import { ReportIssue } from "./report-issue";
import { resultPage } from "./issue-report";
import type { ResultRow } from "../worker/api";
const clipboardSubscribe=()=>()=>{};
const clipboardAvailable=()=>Boolean(navigator.clipboard?.writeText);
const clipboardServer=()=>false;
export function CopyText({text,label="Copy"}:{text:string;label?:string}) {
  const enabled=useSyncExternalStore(clipboardSubscribe,clipboardAvailable,clipboardServer);
  const [status,setStatus]=useState("");
  return <>{enabled ? <button className="copy-control" type="button" onClick={()=>{
    void navigator.clipboard.writeText(text).then(()=>setStatus("Copied"),()=>setStatus("Select the text to copy it."));
  }}>{label}</button> : null}<span className="visually-hidden" role="status">{status}</span></>;
}
export function Cite({input,children}:{input:CitationInput;children?:React.ReactNode}) {
  const citation=generateCitation(input);
  return <details className="cite-details"><summary>Cite</summary>
    <div className="cite-body"><p>Fill in the access date before citing.</p>
      <p>Plain text <CopyText text={citation.plain} /></p><pre tabIndex={0}>{citation.plain}</pre>
      <p>BibTeX <CopyText text={citation.bibtex} /></p><pre tabIndex={0}>{citation.bibtex}</pre>
      {children}
    </div>
  </details>;
}
const hydratedSubscribe=()=>()=>{};
const hydratedClient=()=>true;
const hydratedServer=()=>false;
// One small control per row. Citation, badge and report markup is built only when
// the dialog opens, from the row data the page already holds for hydration.
export function RecordCite({result}:{result:ResultRow}) {
  const hydrated=useSyncExternalStore(hydratedSubscribe,hydratedClient,hydratedServer);
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const context=`${result.model.name} on ${result.benchmark.name} ${result.benchmark_version}`;
  if(!hydrated) return <a className="record-cite" href={recordPermalink(result)}>Record<span className="visually-hidden"> for {context}</span></a>;
  return <>
    <button ref={trigger} className="record-cite" type="button" aria-haspopup="dialog" onClick={()=>setOpen(true)}>Cite<span className="visually-hidden"> {context}</span></button>
    {open ? <RecordDialog result={result} onClose={()=>{setOpen(false);trigger.current?.focus();}} /> : null}
  </>;
}
function RecordDialog({result,onClose}:{result:ResultRow;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const citation=generateCitation(recordCitation(result));
  useEffect(()=>{const element=dialog.current;if(element && !element.open) element.showModal?.();},[]);
  return <dialog ref={dialog} className="record-dialog" aria-labelledby={`cite-${result.result_key}`} onClose={onClose}>
    <div className="cite-body">
      <h2 id={`cite-${result.result_key}`}>Cite this record</h2>
      <p>{result.model.name}{result.reasoning_level ? ` (${result.reasoning_level})` : ""} on {result.benchmark.name} {result.benchmark_version}: {result.score.display}</p>
      <p>Fill in the access date before citing.</p>
      <p>Plain text <CopyText text={citation.plain} /></p><pre tabIndex={0}>{citation.plain}</pre>
      <p>BibTeX <CopyText text={citation.bibtex} /></p><pre tabIndex={0}>{citation.bibtex}</pre>
      <p><a href={recordPermalink(result)}>Permalink to this record</a></p>
      <BadgeSnippet result={result} />
      <p><ReportIssue result={result} page={resultPage(result)} /></p>
      <form method="dialog"><button type="submit" className="record-dialog__close">Close</button></form>
    </div>
  </dialog>;
}
