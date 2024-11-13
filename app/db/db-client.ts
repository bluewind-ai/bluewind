// app/db/db-client.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  captureInsertTable,
  createInsertOverride,
  type FnPathItem,
  type InterceptFn,
} from "./db-overrides";
import * as schema from "./schema";

type BaseDbClient = PostgresJsDatabase<typeof schema>;

export interface DbClient extends BaseDbClient {
  withContext: (context: Record<string, unknown>) => DbClient;
}

interface InvokeContext {
  path?: string[];
  fnPath?: FnPathItem[];
  db?: DbClient;
  requestContext?: Record<string, unknown>;
}

interface OverrideFn {
  pattern: string | string[];
  action: (db: DbClient) => unknown;
}

export const createDbClient = (connectionString: string): DbClient => {
  const client = postgres(connectionString);
  const baseDb = drizzle(client, { schema });

  const intercept = (fn: InterceptFn, context: InvokeContext = {}) => {
    const { path = [], fnPath = [], requestContext = {} } = context;
    const pathAsString = path.join(".");

    // Special case: if it's the requests table operations, let them through without overrides
    const drizzleNameSymbol = Symbol.for("drizzle:Name");
    const table = fn.args[0] as { [key: symbol]: string } | undefined;
    if (
      table?.[drizzleNameSymbol] === "requests" ||
      fnPath.some(
        (f) =>
          (f.args[0] as { [key: symbol]: string } | undefined)?.[drizzleNameSymbol] === "requests",
      )
    ) {
      return fn.invoke(...fn.args);
    }

    if (!requestContext.requestId) {
      const operation = {
        path: pathAsString,
        functionName: fn.name,
        tableName: table?.[drizzleNameSymbol],
        context: requestContext,
      };
      throw new Error(
        `No requestId in context for operation: ${JSON.stringify(operation, null, 2)}`,
      );
    }
    // no-qa
    console.log("Intercepting call:", {
      path: pathAsString,
      functionName: fn.name,
      args: fn.args,
      requestId: requestContext.requestId,
    });

    const matchPath = (pattern: string) => pattern === pathAsString;

    if (pathAsString === "db.insert") {
      captureInsertTable(fn.args[0]);
    }

    const overrides: OverrideFn[] = [
      {
        pattern: "db.insert.values",
        action: (dbInstance) => createInsertOverride(fn, fnPath, dbInstance),
      },
    ];

    const fnOverride = overrides.find(({ pattern }) => {
      if (Array.isArray(pattern)) {
        return pattern.some(matchPath);
      }
      return matchPath(pattern);
    })?.action;

    if (fnOverride && context.db) {
      return fnOverride(context.db);
    }

    return fn.invoke(...fn.args);
  };

  function wrapWithProxy(target: BaseDbClient, context: InvokeContext = {}): DbClient {
    const { path = [], fnPath = [], requestContext = {} } = context;

    // Create a proxy handler that preserves 'this' binding
    const handler: ProxyHandler<BaseDbClient> = {
      get(target, prop) {
        // Handle withContext specially
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

        // If it's a function, wrap it
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

        // If it's an object (but not null), wrap it in a proxy too
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
