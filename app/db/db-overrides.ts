// app/db/db-overrides.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "~/db/schema";

export interface InterceptFn {
  invoke: (...args: unknown[]) => unknown;
  name: string;
  args: unknown[];
}
export interface FnPathItem {
  name: string;
  args: unknown[];
}
let currentTableName: string | null = null;
export const createInsertOverride = (
  fn: InterceptFn,
  _fnPath: FnPathItem[],
  _db: PostgresJsDatabase<typeof schema>,
) => {
  console.log("createInsertOverride called with tableName:", currentTableName);

  // Get the original result as a Promise
  const originalPromise = fn.invoke(...fn.args) as Promise<Array<{ id: number }>>;

  // Chain directly on the promise instead of proxying
  return originalPromise.then((rows) => {
    console.log("Insert completed with rows:", rows, "for table:", currentTableName);
    console.log("DB Insert Operation:", {
      table: currentTableName,
      id: rows[0]?.id,
      values: fn.args[0],
      path: fn.name,
    });
    return rows; // Important: pass through the rows
  });
};

export const captureInsertTable = (tableArg: unknown) => {
  if (!tableArg || typeof tableArg !== "object") return;
  const symbols = Object.getOwnPropertySymbols(tableArg);
  const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
  if (drizzleNameSymbol) {
    currentTableName = (tableArg as any)[drizzleNameSymbol];
    console.log("Captured table name:", currentTableName);
  }
};

export const clearInsertTable = () => {
  console.log("clearInsertTable called, was:", currentTableName);
  currentTableName = null;
};
