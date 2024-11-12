// app/db/db-client.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { createInsertOverride, type FnPathItem, type InterceptFn } from "./db-overrides";
import * as schema from "./schema";

type DbClient = PostgresJsDatabase<typeof schema>;

interface InvokeContext {
  path?: string[];
  fnPath?: FnPathItem[];
  db?: DbClient;
}

interface OverrideFn {
  pattern: string | string[];
  action: (db: DbClient) => unknown;
}

export const createDbClient = (connectionString: string): DbClient => {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  const intercept = (fn: InterceptFn, context: InvokeContext = {}) => {
    const { path = [], fnPath = [], db: contextDb } = context;
    const pathAsString = path.join(".");

    const matchPath = (pattern: string) => pattern === pathAsString;

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

    if (fnOverride && contextDb) {
      if (pathAsString === "db.insert.values") {
        console.log("Intercepting insert.values call");
      }
      return fnOverride(contextDb);
    }

    return fn.invoke(...fn.args);
  };

  const createProxy = <T extends object>(target: T, context: InvokeContext = {}): T => {
    const { path = [], fnPath = [] } = context;

    return new Proxy(target, {
      get(innerTarget: T, prop: string | symbol): unknown {
        const currentPath = path.concat(prop.toString());
        const value = Reflect.get(innerTarget, prop);

        if (typeof value === "function") {
          return (...args: unknown[]) => {
            const currentFnPath = [...fnPath, { name: prop.toString(), args }];

            const result = intercept(
              {
                invoke: value.bind(innerTarget),
                name: prop.toString(),
                args,
              },
              { path: currentPath, fnPath: currentFnPath, db },
            );

            if (typeof result === "object" && result !== null && !Array.isArray(result)) {
              return createProxy(result as T, {
                path: currentPath,
                fnPath: currentFnPath,
                db,
              });
            }

            return result;
          };
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return createProxy(value as T, {
            path: currentPath,
            fnPath,
            db,
          });
        }

        return value;
      },
    });
  };

  return createProxy(db, { path: ["db"], db });
};
