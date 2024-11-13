// app/db/db-client.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type BaseDbClient = PostgresJsDatabase<typeof schema>;

export interface DbClient extends BaseDbClient {
  withContext: (context: Record<string, unknown>) => DbClient;
}

interface InterceptFn {
  invoke: (...args: unknown[]) => unknown;
  name: string;
  args: unknown[];
}

interface FnPathItem {
  name: string;
  args: unknown[];
}

interface InvokeContext {
  path?: string[];
  fnPath?: FnPathItem[];
  requestContext?: Record<string, unknown>;
}

let currentTableName: string | null = null;

export const createDbClient = (connectionString: string): DbClient => {
  const client = postgres(connectionString);
  const baseDb = drizzle(client, { schema });

  const intercept = (fn: InterceptFn, context: InvokeContext = {}) => {
    const { path = [], requestContext = {} } = context;
    const pathAsString = path.join(".");

    if (pathAsString === "db.insert") {
      const tableArg = fn.args[0];
      if (tableArg && typeof tableArg === "object") {
        const symbols = Object.getOwnPropertySymbols(tableArg);
        const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
        if (drizzleNameSymbol) {
          currentTableName = (tableArg as any)[drizzleNameSymbol];
          console.log("Captured table name:", currentTableName);
        }
      }
    }

    const result = fn.invoke(...fn.args);

    if (pathAsString === "db.insert.values") {
      const originalResult = result as { returning: () => Promise<Array<{ id: number }>> };
      const origReturning = originalResult.returning.bind(originalResult);

      originalResult.returning = () => {
        const promise = origReturning();
        if (requestContext.requestId) {
          return promise.then((rows) => {
            if (!requestContext.insertedObjects) {
              requestContext.insertedObjects = [];
            }
            (requestContext.insertedObjects as any[]).push({
              table: currentTableName,
              id: rows[0]?.id,
              values: fn.args[0],
              rows,
            });

            console.log("Insert completed with rows:", rows, "for table:", currentTableName);
            console.log("DB Insert Operation:", {
              table: currentTableName,
              id: rows[0]?.id,
              values: fn.args[0],
              path: fn.name,
            });
            console.log("Current requestContext:", requestContext);
            return rows;
          });
        }
        return promise;
      };

      return originalResult;
    }

    return result;
  };

  function wrapWithProxy(target: BaseDbClient, context: InvokeContext = {}): DbClient {
    const { path = [], fnPath = [], requestContext = {} } = context;

    const handler: ProxyHandler<BaseDbClient> = {
      get(target, prop) {
        if (prop === "withContext") {
          return (newContext: Record<string, unknown>) => {
            return wrapWithProxy(target, {
              ...context,
              requestContext: { ...requestContext, ...newContext },
            });
          };
        }

        const value = Reflect.get(target, prop);
        const currentPath = path.concat(prop.toString());

        if (typeof value === "function") {
          return (...args: unknown[]) => {
            const currentFnPath = [...fnPath, { name: prop.toString(), args }];
            const result = intercept(
              {
                invoke: value.bind(target),
                name: prop.toString(),
                args,
              },
              { path: currentPath, fnPath: currentFnPath, requestContext },
            );

            if (result && typeof result === "object") {
              return wrapWithProxy(result as BaseDbClient, {
                path: currentPath,
                fnPath: currentFnPath,
                requestContext,
              });
            }

            return result;
          };
        }

        if (value && typeof value === "object") {
          return wrapWithProxy(value as BaseDbClient, {
            path: currentPath,
            fnPath,
            requestContext,
          });
        }

        return value;
      },
    };

    return new Proxy(target, handler) as DbClient;
  }

  return wrapWithProxy(baseDb, { path: ["db"] });
};
