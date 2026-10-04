import { afterEach, expect, it, vi } from "vitest";
import { seoFixture } from "./seo-fixtures";
import worker from "./index";
import { logServerError, logZeroSearch } from "./diagnostics";
afterEach(()=>vi.restoreAllMocks());
it("checks the database without relying on a cached/published snapshot",async()=>{
  const f=seoFixture();
  try {
    const response=await worker.fetch(new Request("https://benchmarkregistry.org/healthz"),f.env);
    expect(response.status).toBe(200);expect(await response.json()).toEqual({ok:true});
    expect(response.headers.get("Cache-Control")).toBe("no-store");expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    const head=await worker.fetch(new Request("https://benchmarkregistry.org/healthz",{method:"HEAD"}),f.env);expect(await head.text()).toBe("");
    const log=vi.spyOn(console,"error").mockImplementation(()=>undefined);
    const failed=await worker.fetch(new Request("https://benchmarkregistry.org/healthz"),{...f.env,DB:undefined});
    expect(failed.status).toBe(503);expect(await failed.json()).toEqual({ok:false});expect(log).toHaveBeenCalledTimes(1);
  } finally {f.sqlite.close();}
});
it("logs one structured safe error and only query text for zero searches",()=>{
  const error=vi.spyOn(console,"error").mockImplementation(()=>undefined);
  const stdout=vi.spyOn(console,"log").mockImplementation(()=>undefined);
  logServerError("document",500,new Error("email person@example.com IP 1.2.3.4 query secret"));
  expect(JSON.parse(error.mock.calls[0][0])).toEqual({event:"server_error",route:"document",status:500,error_message:"Error: Registry document rendering failed."});
  logZeroSearch("model:missing");expect(JSON.parse(stdout.mock.calls[0][0])).toEqual({event:"search_zero_results",query:"model:missing"});
});

it("logs route templates without dynamic path contents or query strings",()=>{
  const log=vi.spyOn(console,"error").mockImplementation(()=>undefined);
  logServerError("document",500,new Error("private"),"/models/person@example.com");
  expect(JSON.parse(log.mock.calls[0][0]).route).toBe("/models/:id");
  expect(log.mock.calls[0][0]).not.toContain("person@example.com");
});
