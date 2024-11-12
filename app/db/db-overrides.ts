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

const getTableNameFromInsert = (args: unknown[]) => {
  const tableArg = args[0];

  // Identify table based on the shape of the data
  if ("name" in (tableArg as any) && "type" in (tableArg as any)) {
    return "actions";
  }
  if ("actionId" in (tableArg as any)) {
    return "function_calls";
  }
  return null;
};

export const createInsertOverride = (
  fn: InterceptFn,
  _fnPath: FnPathItem[],
  _db: PostgresJsDatabase<typeof schema>,
) => {
  const tableName = getTableNameFromInsert(fn.args);
  const result = fn.invoke(...fn.args) as Promise<Array<{ id: number }>>;

  result.then((rows) => {
    console.log("DB Insert Operation:", {
      table: tableName,
      id: rows[0]?.id,
      values: fn.args[0],
    });
  });

  return result;
};
