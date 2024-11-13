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
  const tableName = currentTableName;
  console.log("Creating insert override for table:", tableName);

  // Get the original result
  const originalResult = fn.invoke(...fn.args);

  // Return a proxy that preserves the chain methods
  return new Proxy(originalResult as object, {
    get(target: any, prop: string) {
      if (prop === "then") {
        // Special handling for the promise chain
        return (resolve: any, reject: any) => {
          return (target as Promise<Array<{ id: number }>>)
            .then((rows) => {
              console.log("Insert completed with rows:", rows, "for table:", tableName);
              if (rows && rows.length > 0) {
                console.log("DB Insert Operation:", {
                  table: tableName,
                  id: rows[0]?.id,
                  values: fn.args[0],
                  path: fn.name,
                });
              }
              return resolve(rows);
            })
            .catch(reject)
            .finally(() => {
              clearInsertTable();
            });
        };
      }

      // Forward all other method calls
      const value = (target as any)[prop];
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
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
  console.log("Clearing table name, was:", currentTableName);
  currentTableName = null;
};
