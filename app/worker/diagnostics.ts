import { BUILD_ID } from "../src/build";

const categories = ["read-api", "model-redirect", "sitemap", "document", "materialized-read"] as const;
type FailureCategory = typeof categories[number];

// Fixed classifications only. Never accept a request, exception, URL, or payload.
// Final deployments use transient tail diagnostics, with log persistence disabled.
export function diagnoseWorkerFailure(category: FailureCategory) {
  if (!categories.includes(category)) return;
  console.error({ category, build: BUILD_ID });
}

// Routes are templates, and arbitrary exception text is never logged: drivers
// can put request URLs, SQL bindings or credentials in their error messages.
function routeTemplate(pathname:string):string {
  if(["/","/models","/benchmarks","/companies","/compare","/search","/coverage","/corrections","/about","/contact","/terms","/privacy","/legal","/healthz","/feed.xml","/sitemap.xml"].includes(pathname)) return pathname;
  if(/^\/api\/(models|benchmarks|companies|search|stats|recent|home-panels|revision|comparisons)(?:\/|$)/u.test(pathname)) return pathname.split("/").map((part,index)=>index>2 ? ":id" : part).join("/");
  if(/^\/(models|benchmarks|companies|compare|badge)\//u.test(pathname)) return pathname.split("/").map((part,index)=>index>1 ? ":id" : part).join("/");
  return "/:route";
}
export function logServerError(category: string, status: number, error: unknown, pathname?:string) {
  const messages:Record<string,string> = {
    healthz:"Database connectivity check failed.", coverage:"Coverage database query failed.",
    "read-api":"Registry read failed.", "model-redirect":"Registry redirect lookup failed.",
    sitemap:"Sitemap data read failed.", document:"Registry document rendering failed.",
    "materialized-read":"Published registry data could not be read.",
  };
  const name=error instanceof Error && ["TypeError","RangeError","Error","MaterializationFailure"].includes(error.name) ? error.name : "Error";
  console.error(JSON.stringify({event:"server_error",route:pathname ? routeTemplate(pathname) : category === "healthz" ? "/healthz" : category === "coverage" ? "/coverage" : category,status,error_message:`${name}: ${messages[category] ?? "Server request failed."}`}));
}
export function logZeroSearch(query: string) {
  console.log(JSON.stringify({event:"search_zero_results",query}));
}
