import type { MetricSummary, ResultRow } from "../worker/api";
import { compareDecimal } from "../worker/featured-result";
import { recordPermalink } from "./citation";
export interface ChartPoint {model:string;registry_no:string;date:string;date_basis:"Reported"|"Model released";score:string;value:number;x:number;y:number;href:string}
export interface ScoreChartData {points:ChartPoint[];frontier:string;start:string;end:string;minimum:number;maximum:number;direction:"higher"|"lower";metric:string}
export function generateScoreChart(rows:ResultRow[],metric:MetricSummary):ScoreChartData|null {
  if(!metric.direction || metric.storage_kind==="text") return null;
  const best=new Map<string,ResultRow>();
  const dated=(row:ResultRow)=>row.reported_at || row.model.released_at;
  const date=(row:ResultRow)=>dated(row).slice(0,10);
  for(const row of rows) {
    if(row.metric.key!==metric.key || row.score.value===null || !Number.isFinite(Number(row.score.value))) continue;
    const previous=best.get(row.model.registry_no),comparison=previous ? compareDecimal(row.score.value,previous.score.value!) : 1;
    if(!previous || (metric.direction==="higher" ? comparison>0 : comparison<0)
      || comparison===0 && (date(row)<date(previous) || date(row)===date(previous) && row.result_key<previous.result_key)) best.set(row.model.registry_no,row);
  }
  const points=[...best.values()].filter(row=>/^\d{4}-\d{2}-\d{2}$/u.test(date(row)) && Number.isFinite(Date.parse(date(row))) && new Date(date(row)).toISOString().slice(0,10)===date(row))
    .sort((a,b)=>date(a).localeCompare(date(b)) || a.result_key.localeCompare(b.result_key))
    .map(row=>({model:row.model.name,registry_no:row.model.registry_no,date:date(row),date_basis:row.reported_at ? "Reported" as const : "Model released" as const,
      score:row.score.display,value:Number(row.score.value),x:0,y:0,href:recordPermalink(row)}));
  if(points.length<5) return null;
  const start=Date.parse(points[0].date),end=Date.parse(points.at(-1)!.date);
  const values=points.map(point=>point.value),minimum=Math.min(...values),maximum=Math.max(...values);
  for(const point of points) {
    point.x=end===start ? 360 : 60+(Date.parse(point.date)-start)/(end-start)*600;
    point.y=minimum===maximum ? 130 : 220-(point.value-minimum)/(maximum-minimum)*180;
  }
  const position=(point:ChartPoint)=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  let frontier=`M${position(points[0])}`,running=points[0];
  for(const point of points.slice(1)) {
    frontier+=` L${point.x.toFixed(2)},${running.y.toFixed(2)}`;
    if(metric.direction==="higher" ? point.value>running.value : point.value<running.value) running=point;
    frontier+=` L${point.x.toFixed(2)},${running.y.toFixed(2)}`;
  }
  return {points,frontier,start:points[0].date,end:points.at(-1)!.date,minimum,maximum,direction:metric.direction,metric:metric.name};
}
