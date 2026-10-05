import {expect,it} from "vitest";
import template from "../index.html?raw";
import {handleRequest,type Env} from "./index";
import {analyticsConfiguration,analyticsScript} from "./analytics";
const env={ASSETS:{fetch:async()=>new Response(template,{headers:{"Content-Type":"text/html"}})}} as unknown as Env;
it("makes no analytics request by default and reflects explicit configuration in privacy",async()=>{
  const response=await handleRequest(new Request("https://benchmarkregistry.org/privacy"),env);
  expect(response.headers.has("Set-Cookie")).toBe(false);
  const html=await response.text();expect(html).not.toContain("data-site-id");expect(html).not.toContain("also loads an analytics script configured in the application");
  const configured={...env,ANALYTICS_SCRIPT_URL:"https://stats.example/script.js",ANALYTICS_SITE_ID:'registry"<&'};
  const active=await (await handleRequest(new Request("https://benchmarkregistry.org/privacy"),configured)).text();
  expect(active).toContain('<script defer src="https://stats.example/script.js"');expect(active).toContain('data-site-id="registry&quot;&lt;&amp;"');expect(active).toContain("This deployment also loads an analytics script configured in the application.");
  const staging=await (await handleRequest(new Request("https://staging.benchmarkregistry.org/privacy"),{...configured,STAGING_CRAWLER_PROTECTION:"enabled"})).text();expect(staging).not.toContain("data-site-id");expect(staging).not.toContain("also loads an analytics script configured in the application");
});
it("rejects incomplete or unsafe script configuration without guessing a vendor",()=>{
  for(const url of ["javascript:alert(1)","http://stats.example/js","https://user:pass@stats.example/js","garbage"])
    expect(analyticsConfiguration({ANALYTICS_SCRIPT_URL:url,ANALYTICS_SITE_ID:"id"})).toBeNull();
  expect(analyticsConfiguration({ANALYTICS_SCRIPT_URL:"https://stats.example/js"})).toBeNull();expect(analyticsScript(null)).toBe("");
});

