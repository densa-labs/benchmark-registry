import {withRegistryCache} from "./cache";
import {expect,it} from "vitest";
import template from "../index.html?raw";
import worker,{type Env} from "./index";
import {analyticsConfiguration,analyticsScript} from "./analytics";
const env={ASSETS:{fetch:async()=>new Response(template,{headers:{"Content-Type":"text/html"}})}} as unknown as Env;
it("makes no analytics request by default and reflects explicit configuration in privacy",async()=>{
  const response=await worker.fetch(new Request("https://benchmarkregistry.org/privacy"),env);
  expect(response.headers.has("Set-Cookie")).toBe(false);
  const html=await response.text();expect(html).not.toContain("data-site-id");expect(html).not.toContain("also loads an analytics script configured in the application");
  const configured={...env,ANALYTICS_SCRIPT_URL:"https://stats.example/script.js",ANALYTICS_SITE_ID:'registry"<&'};
  const active=await (await worker.fetch(new Request("https://benchmarkregistry.org/privacy"),configured)).text();
  expect(active).toContain('<script defer src="https://stats.example/script.js"');expect(active).toContain('data-site-id="registry&quot;&lt;&amp;"');expect(active).toContain("This deployment also loads an analytics script configured in the application.");
  const staging=await (await worker.fetch(new Request("https://staging.benchmarkregistry.org/privacy"),{...configured,STAGING_CRAWLER_PROTECTION:"enabled"})).text();expect(staging).not.toContain("data-site-id");expect(staging).not.toContain("also loads an analytics script configured in the application");
});
it("rejects incomplete or unsafe script configuration without guessing a vendor",()=>{
  for(const url of ["javascript:alert(1)","http://stats.example/js","https://user:pass@stats.example/js","garbage"])
    expect(analyticsConfiguration({ANALYTICS_SCRIPT_URL:url,ANALYTICS_SITE_ID:"id"})).toBeNull();
  expect(analyticsConfiguration({ANALYTICS_SCRIPT_URL:"https://stats.example/js"})).toBeNull();expect(analyticsScript(null)).toBe("");
});

it("separates rendered caches when owner analytics configuration changes",async()=>{
  const entries=new Map<string,Response>();
  const cache={match:async(key:Request)=>entries.get(key.url)?.clone(),put:async(key:Request,value:Response)=>{entries.set(key.url,value.clone());}} as unknown as Cache;
  const env={REGISTRY_REVISION:"revision",REGISTRY_CACHE:cache};
  const request=new Request("https://benchmarkregistry.org/models");
  await withRegistryCache(request,{...env,CACHE_VARIANT:"off"},async()=>new Response("off"));
  expect(await (await withRegistryCache(request,{...env,CACHE_VARIANT:"on"},async()=>new Response("on"))).text()).toBe("on");
});
