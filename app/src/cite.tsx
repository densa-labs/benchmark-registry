import { BadgeSnippet } from "./badge-snippet";
import { useSyncExternalStore, useState } from "react";
import { generateCitation, recordCitation, recordPermalink, type CitationInput } from "./citation";
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
export function RecordCite({result}:{result:ResultRow}) {
  return <Cite input={recordCitation(result)}><p><a href={recordPermalink(result)}>Permalink to this record</a></p><BadgeSnippet result={result} /></Cite>;
}
