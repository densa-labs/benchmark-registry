import type { ScoreChartData } from "./score-chart";
import { DataTable } from "./ui/components";
// <title> children must be one string, or React renders the element empty.
export function ScoreChart({data}:{data?:ScoreChartData|null}) {
  if(!data) return null;
  return <section className="score-chart" aria-labelledby="score-chart-heading"><h2 id="score-chart-heading">Scores over time</h2>
    <p className="compare-note">Best recorded score per model; {data.direction} is better. The line follows the running best. Evaluation contexts can differ.</p>
    <svg viewBox="0 0 720 280" width="720" height="280" role="img" aria-labelledby="score-chart-title score-chart-desc">
      <title id="score-chart-title">{`${data.metric} scores over time`}</title><desc id="score-chart-desc">One point per model's best recorded score, dated by reported date or model release date. A line shows the running best. The data table below contains every plotted point.</desc>
      <path className="score-chart-axis" d="M60,40 V220 H660" />
      <text x="55" y="45" textAnchor="end">{data.maximum}</text><text x="55" y="220" textAnchor="end">{data.minimum}</text>
      <text x="60" y="250">{data.start}</text><text x="660" y="250" textAnchor="end">{data.end}</text>
      <path className="score-chart-frontier" d={data.frontier} />
      {data.points.map(point=><a key={point.registry_no} href={point.href} aria-label={`${point.model}: ${point.score}, ${point.date_basis} ${point.date}`}><circle className="score-chart-point" cx={point.x} cy={point.y} r="4"><title>{`${point.model}: ${point.score} · ${point.date_basis} ${point.date}`}</title></circle></a>)}
    </svg>
    <details><summary>Data table</summary><DataTable caption="Scores plotted over time" rows={data.points} getRowKey={row=>row.registry_no} columns={[
      {key:"model",label:"Model",render:row=><a href={row.href}>{row.model}</a>},
      {key:"date",label:"Date",render:row=><><time dateTime={row.date}>{row.date}</time> ({row.date_basis})</>},
      {key:"score",label:"Score",render:row=>row.score},
    ]} /></details>
  </section>;
}
