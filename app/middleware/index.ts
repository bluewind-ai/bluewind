// app/middleware/index.ts
import type { AppLoadContext } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Request as ExpressRequest } from "express";
import morgan from "morgan";

import * as schema from "~/db/schema";

import { main } from "./main";

const originalConsoleLog = console.log;
console.log = function (...args) {
  const sanitizedArgs = args.map((arg) => {
    if (typeof arg === "string" && arg.length > 1000) {
      return `[String Too Long - ${arg.length} chars]`;
    }
    if (arg?.query && arg?.dialect) {
      return "[Database Instance - Too Large To Log]";
    }
    if (arg?.table && arg?.dialect) {
      return "[Database Query Builder - Too Large To Log]";
    }
    try {
      // Handle circular references
      const seen = new WeakSet();
      const str = JSON.stringify(arg, (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);
        }
        return value;
      });
      if (str && str.length > 1000) {
        return `[Object Too Large - ${str.length} chars]`;
      }
      return arg;
    } catch {
      return arg?.toString?.() || "[Unstringifiable Object]";
    }
  });
  originalConsoleLog.apply(console, sanitizedArgs);
};
export interface DrizzleQuery {
  type: "insert" | "select" | "update" | "delete";
  table: string;
  query: unknown;
  result?: unknown;
}
export type DbClient = PostgresJsDatabase<typeof schema>;
type DbInsertFunction = (...args: any[]) => any;
export interface RequestExtensions {
  db: DbClient;
  queries: DrizzleQuery[];
  requestId: number;
  functionCallId?: number;
}

export function createDbProxy<
  T extends {
    insert: DbInsertFunction;
  },
>(db: T, queries: DrizzleQuery[]) {
  return new Proxy(db, {
    get(target, prop) {
      dd(prop);
      const value = Reflect.get(target, prop);
      if (typeof value !== "function") return value;
      return function (this: unknown, ...args: unknown[]) {
        const callStack = new Error().stack;
        if (prop === "insert") {
          const tableArg = args[0];
          if (tableArg && typeof tableArg === "object") {
            const symbols = Object.getOwnPropertySymbols(tableArg);
            const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
            if (drizzleNameSymbol) {
              const tableName = (tableArg as any)[drizzleNameSymbol];
              const query = value.apply(this || target, args);
              return new Proxy(query, {
                get(target, prop) {
                  const chainValue = Reflect.get(target, prop);
                  if (prop === "values") {
                    return function (...args: unknown[]) {
                      const valuesQuery = chainValue.apply(target, args);
                      return new Proxy(valuesQuery, {
                        get(target, prop) {
                          const returningValue = Reflect.get(target, prop);
                          if (prop === "returning") {
                            return async function (...args: unknown[]) {
                              const result = await returningValue.apply(target, args);
                              queries.push({
                                type: "insert",
                                table: tableName,
                                query: args[0],
                                result,
                              });
                              return result;
                            };
                          }
                          return returningValue;
                        },
                      });
                    };
                  }
                  return chainValue;
                },
              });
            }
          }
        }
        const result = value.apply(this || target, args);
        if (result instanceof Promise) {
          return result.catch((e: any) => {
            const error = new Error(e.message);
            error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
            Object.assign(error, e);
            throw error;
          });
        }
        if (result && typeof result === "object") {
          return new Proxy(result, {
            get(target, chainProp) {
              const chainValue = Reflect.get(target, chainProp);
              if (typeof chainValue !== "function") return chainValue;
              return function (this: unknown, ...chainArgs: unknown[]) {
                const chainResult = chainValue.apply(this || target, chainArgs);
                if (chainResult instanceof Promise) {
                  return chainResult.catch((e: any) => {
                    const error = new Error(e.message);
                    error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
                    Object.assign(error, e);
                    throw error;
                  });
                }
                return chainResult;
              };
            },
          });
        }
        return result;
      };
    },
  });
}
export function configureMiddleware(app: any) {
  app.use(morgan("tiny"));
  app.use(main());
}
export function getLoadContext(req: ExpressRequest & RequestExtensions): AppLoadContext {
  return req as unknown as AppLoadContext;
}
declare module "express" {
  interface Request extends RequestExtensions {}
}
declare module "@remix-run/node" {
  interface AppLoadContext extends RequestExtensions {}
}
