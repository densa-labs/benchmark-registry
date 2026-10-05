import { afterEach, expect, it, vi } from "vitest";
import { logServerError, logZeroSearch } from "./diagnostics";
afterEach(()=>vi.restoreAllMocks());
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
