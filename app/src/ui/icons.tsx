import type { SortDirection } from "./components";
import { REGISTRY_MARK_PATH, REGISTRY_MARK_VIEWBOX } from "../branding";

export function RegistryMark() {
  return <svg className="wordmark__logo" viewBox={REGISTRY_MARK_VIEWBOX} aria-hidden="true" fill="currentColor">
    <path d={REGISTRY_MARK_PATH} />
  </svg>;
}

export function MenuIcon({ open }: { open: boolean }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
    <path d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
  </svg>;
}

export function SortIcon({ direction }: { direction?: SortDirection }) {
  return <svg className="sortable-header__indicator" data-sort={direction ?? "none"} viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direction !== "desc" ? <path d={direction ? "m3 7 3-3 3 3" : "m3 4 3-3 3 3"} /> : null}
    {direction !== "asc" ? <path d={direction ? "m3 5 3 3 3-3" : "m3 8 3 3 3-3"} /> : null}
  </svg>;
}

export function ExternalIcon() {
  return <svg className="external-icon" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9 9 3M3 3h6v6" /></svg>;
}

export function GitHubIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 .297a12 12 0 0 0-3.793 23.385c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.494.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.006 0c2.291-1.552 3.297-1.23 3.297-1.23.654 1.653.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.431.372.815 1.102.815 2.222v3.293c0 .319.216.694.825.576A12 12 0 0 0 12 .297Z" /></svg>;
}
