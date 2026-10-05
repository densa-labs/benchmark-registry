// Cloudflare's edge adds its own Server-Timing metrics (cfCacheStatus, cfEdge, cfOrigin, ...).
// They describe the CDN, not the application, so the accessibility audit allows only those.
export function cloudflareTimingOnly(value) {
  const metrics=value.split(/[,\n]/u).map(metric=>metric.split(';')[0].trim()).filter(Boolean);
  return metrics.length>0 && metrics.every(name=>/^cf[A-Z][A-Za-z0-9]*$/u.test(name));
}
