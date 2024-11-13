// app/db/db-overrides.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "~/db/schema";
import { storeOperation } from "~/lib/middleware";

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

const getTableNameFromInsert = (args: unknown[]) => {
  console.log("Getting table name, current:", currentTableName);
  return currentTableName;
};

export const createInsertOverride = (
  fn: InterceptFn,
  _fnPath: FnPathItem[],
  _db: PostgresJsDatabase<typeof schema>,
) => {
  const tableName = currentTableName;
  console.log("Creating insert override for table:", tableName);
  const result = fn.invoke(...fn.args) as Promise<Array<{ id: number }>>;

  result
    .then((rows) => {
      console.log("Insert completed with rows:", rows, "for table:", tableName);
      storeOperation(tableName, rows[0]?.id, fn.args[0], fn.name);

      console.log("DB Insert Operation:", {
        table: tableName,
        id: rows[0]?.id,
        values: fn.args[0],
        path: fn.name,
      });
    })
    .finally(() => {
      clearInsertTable();
    });

  return result;
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
  console.log("Clearing table name, was:", currentTableName);
  currentTableName = null;
};
