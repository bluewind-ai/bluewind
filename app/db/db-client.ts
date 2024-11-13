// app/db/db-client.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type BaseDbClient = PostgresJsDatabase<typeof schema>;

export interface DbClient extends BaseDbClient {
  withContext: (context: Record<string, unknown>) => DbClient;
}

interface InsertResult {
  values: (...args: unknown[]) => {
    returning: () => Promise<Array<{ id: number }>>;
  };
}

let currentTableName: string | null = null;

function wrapFunction(
  value: (...args: unknown[]) => unknown,
  target: BaseDbClient,
  prop: string | symbol,
  requestContext: Record<string, unknown>,
) {
  return function (this: unknown, ...args: unknown[]) {
    const result = value.apply(this || target, args);

    // Capture table name from insert
    if (prop === "insert") {
      const tableArg = args[0];
      if (tableArg && typeof tableArg === "object") {
        const symbols = Object.getOwnPropertySymbols(tableArg);
        const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
        if (drizzleNameSymbol) {
          currentTableName = (tableArg as any)[drizzleNameSymbol];
          console.log("Captured table name:", currentTableName);
        }

        // Modify the result to intercept values()
        const insertResult = result as InsertResult;
        const originalValues = insertResult.values;

        insertResult.values = function (...valuesArgs: unknown[]) {
          const valuesResult = originalValues.apply(this, valuesArgs);
          const originalReturning = valuesResult.returning;

          valuesResult.returning = function () {
            const promise = originalReturning.apply(this);
            if (!requestContext.requestId) return promise;

            return promise.then((rows: Array<{ id: number }>) => {
              if (!requestContext.insertedObjects) {
                requestContext.insertedObjects = [];
              }
              (requestContext.insertedObjects as any[]).push({
                table: currentTableName,
                id: rows[0]?.id,
                values: valuesArgs[0],
                rows,
              });

              console.log("Insert completed with rows:", rows, "for table:", currentTableName);
              console.log("Current requestContext:", requestContext);
              return rows;
            });
          };
          return valuesResult;
        };
      }
    }

    return result;
  };
}

const proxyHandler = (
  requestContext: Record<string, unknown> = {},
): ProxyHandler<BaseDbClient> => ({
  get(target, prop) {
    const value = Reflect.get(target, prop);

    if (prop === "withContext") {
      return (newContext: Record<string, unknown>) =>
        new Proxy(target, proxyHandler({ ...requestContext, ...newContext }));
    }

    if (typeof value !== "function") return value;

    return wrapFunction(value, target, prop, requestContext);
  },
});

export const createDbClient = (connectionString: string): DbClient => {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  return new Proxy(db, proxyHandler()) as DbClient;
};
