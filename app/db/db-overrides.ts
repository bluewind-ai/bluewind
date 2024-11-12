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

interface PgInsertResult {
  execute: () => Promise<unknown>;
  returning: () => Promise<Array<{ id: number }>>;
  onConflictDoUpdate: (config: any) => PgInsertResult;
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
  const insertResult = fn.invoke(...fn.args) as PgInsertResult;

  // Get the return value with ID
  const returnValue = insertResult.returning();

  return returnValue.then(async (result) => {
    const recordId = result[0]?.id;

    console.log("DB Insert Operation:", {
      table: tableName,
      id: recordId,
      values: fn.args[0],
    });

    return result;
  });
};
