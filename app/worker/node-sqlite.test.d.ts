declare module "node:sqlite" {
  interface StatementSync {
    all(...bindings: unknown[]): unknown[];
    get(...bindings: unknown[]): unknown;
  }

  export class DatabaseSync {
    constructor(location: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
