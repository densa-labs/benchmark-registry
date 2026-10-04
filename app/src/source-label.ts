export function sourceLabel(href: string): string {
  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./u, "") || "Source";
  } catch {
    return "Source";
  }
}
