export interface QueryMetrics {queries:number;rows:number;ms:number}
export function measuredDatabase(db:D1Database,metrics?:QueryMetrics):D1Database {
  if(!metrics) return db;
  return {prepare(sql:string){
    let statement=db.prepare(sql);
    return {bind(...values:(string|number|null)[]){statement=statement.bind(...values);return this;},
      async all(){const start=performance.now();metrics.queries++;try {const result=await statement.all();metrics.rows+=result.meta?.rows_read ?? result.results.length;return result;}finally{metrics.ms+=performance.now()-start;}},
      async first(){const start=performance.now();metrics.queries++;try {return await statement.first();}finally{metrics.ms+=performance.now()-start;}},
    };
  }} as unknown as D1Database;
}
