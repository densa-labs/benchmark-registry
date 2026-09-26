declare module "node:sqlite" {
  interface StatementSync {
    all(...bindings: unknown[]): unknown[];
    get(...bindings: unknown[]): unknown;
  }

  export class DatabaseSync {
    constructor(location: string);
    close(): void;
    exec(sql: string): void;
    function(name: string, options: { varargs: boolean }, callback: (...args: string[]) => number): void;
    prepare(sql: string): StatementSync;
  }
}
