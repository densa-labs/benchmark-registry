import { escapeHtml } from "./metadata";
export interface AnalyticsEnvironment { ANALYTICS_SCRIPT_URL?: string; ANALYTICS_SITE_ID?: string }
/** Explicit owner configuration only; the application itself sets no cookies. */
export function analyticsConfiguration(env:AnalyticsEnvironment): {url:string;siteId:string}|null {
  if (!env.ANALYTICS_SCRIPT_URL || !env.ANALYTICS_SITE_ID?.trim()) return null;
  try {
    const url=new URL(env.ANALYTICS_SCRIPT_URL);
    if(url.protocol!=="https:" || url.username || url.password || url.hash) return null;
    return {url:url.href,siteId:env.ANALYTICS_SITE_ID.trim()};
  } catch {return null;}
}
export function analyticsScript(config:ReturnType<typeof analyticsConfiguration>):string {
  if(!config) return "";
  // Generic attribute plus the common domain/website-id conventions. The owner
  // must select and review a cookie-free provider that supports this hook.
  const id=escapeHtml(config.siteId);
  return `<script defer src="${escapeHtml(config.url)}" data-site-id="${id}" data-domain="${id}" data-website-id="${id}"></script>`;
}
