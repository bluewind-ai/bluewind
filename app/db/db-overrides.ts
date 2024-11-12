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

  // Handle all inserts the same way for now
  const returnValue = insertResult.returning();

  return returnValue.then(async (result) => {
    const recordId = result[0]?.id;
    if (recordId && tableName) {
      await _db
        .insert(schema.objects)
        .values({
          model: tableName,
          recordId: recordId,
          functionCallId: 1,
        })
        .returning();
    }
    return result;
  });
};
