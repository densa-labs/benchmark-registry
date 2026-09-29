// Bounded offline audit only. No hostname option, remote D1, or crawling.
import process from "node:process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const args=process.argv.slice(2);
const value=(name)=>args[args.indexOf(name)+1];
if (!args.includes("--fixture") || !existsSync(value("--fixture"))) throw new Error("Pass --fixture /absolute/path/to/local-fixture.sql. This never accesses remote D1.");
const env={...process.env,P119_AUDIT_FIXTURE:resolve(value("--fixture")),P119_AUDIT_OUTPUT:resolve(args.includes("--output")?value("--output"):"../docs/p11-9-read-current.json")};
if(args.includes("--migration")) env.P119_AUDIT_MIGRATION=resolve(value("--migration"));
if(args.includes("--materialization")) env.P119_AUDIT_MATERIALIZE="1";
if(args.includes("--cache")) throw new Error('Origin-cache audit is retired. Public materialized reads are verified by materialized.test.ts and verify-performance-live.py.');
const result=spawnSync(process.execPath,["node_modules/vitest/vitest.mjs","run","worker/performance-audit.test.ts"],{env,stdio:"inherit"});
process.exit(result.status??1);
