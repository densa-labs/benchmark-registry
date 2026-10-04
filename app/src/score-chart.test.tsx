import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { generateScoreChart } from "./score-chart";
import { ScoreChart } from "./score-chart-view";
import { accessibilityRoutes } from "./accessibility-fixtures";
import type { ResultRow } from "../worker/api";
function fixture():ResultRow[] {
  const loaded=accessibilityRoutes.find(route=>route.loaded.kind==="model")!.loaded;
  if(loaded.kind!=="model") throw new Error("Fixture");
  const row=loaded.payload.data.results[0];
  return [10,20,15,40,30].map((value,index)=>({...row,result_key:String(index).padStart(64,"0"),model:{...row.model,registry_no:`1000${index}`,name:`Model ${index}`},metric:{...row.metric,direction:"higher"},reported_at:`2026-01-0${index+1}`,score:{value:String(value),raw:String(value),display:`${value}%`}}));
}
it("skips unknown direction, text metrics and fewer than five dated models",()=>{
  const rows=fixture();expect(generateScoreChart(rows,{...rows[0].metric,direction:null})).toBeNull();
  expect(generateScoreChart(rows,{...rows[0].metric,storage_kind:"text"})).toBeNull();
  expect(generateScoreChart(rows.slice(0,4),rows[0].metric)).toBeNull();
  rows[0]={...rows[0],reported_at:"",model:{...rows[0].model,released_at:""}};
  expect(generateScoreChart(rows,rows[0].metric)).toBeNull();
});
it("uses only the best observation per model and draws a higher-score frontier",()=>{
  const rows=fixture();const chart=generateScoreChart([...rows,{...rows[0],score:{value:"5",raw:"5",display:"5%"}}],rows[0].metric)!;
  expect(chart.points).toHaveLength(5);expect(chart.points[0].value).toBe(10);
  expect(chart.frontier).toContain("L660.00,40.00");
  expect(chart.points.every(point=>Number.isFinite(point.x+point.y))).toBe(true);
});
it("supports lower direction, equal scores/dates, fallback dates and invalid dates",()=>{
  const rows=fixture();const metric={...rows[0].metric,direction:"lower" as const};
  const chart=generateScoreChart([...rows,{...rows[0],score:{value:"5",raw:"5",display:"5%"}}],metric)!;
  expect(chart.points[0].value).toBe(5);expect(chart.frontier).toContain("L660.00,220.00");
  const equal=rows.map(row=>({...row,reported_at:"2026-01-01",score:{value:"1",raw:"1",display:"1%"}}));
  expect(generateScoreChart(equal,metric)!.points.every(point=>point.x===360 && point.y===130)).toBe(true);
  rows[0].reported_at="";expect(generateScoreChart(rows,metric)!.points.some(point=>point.date_basis==="Model released")).toBe(true);
  rows[0].reported_at="2026-02-30";expect(generateScoreChart(rows,metric)).toBeNull();
});
it("renders an accessible server SVG and matching selectable data table",()=>{
  const rows=fixture();rows[0].model.name="<script>";
  const data=generateScoreChart(rows,rows[0].metric)!;
  const html=renderToStaticMarkup(<ScoreChart data={data} />);
  expect(html).toContain('role="img"');expect(html).toContain("Data table");expect(html).toContain("&lt;script&gt;");
  expect(html.match(/<circle/gu)).toHaveLength(5);expect(html.match(/<time/gu)).toHaveLength(5);
  expect(renderToStaticMarkup(<ScoreChart data={null} />)).toBe("");
});
