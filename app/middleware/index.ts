// app/middleware/index.ts
import type { AppLoadContext } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Request as ExpressRequest } from "express";
import morgan from "morgan";

import * as schema from "~/db/schema";

import { main } from "./main";

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
                              try {
                                const result = await returningValue.apply(target, args);
                                queries.push({
                                  type: "insert",
                                  table: tableName,
                                  query: args[0],
                                  result,
                                });
                                return result;
                              } catch (e: any) {
                                const error = new Error(e.message);
                                error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
                                Object.assign(error, e);
                                throw error;
                              }
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
        // Wrap all database operations with error stack handling
        try {
          const result = value.apply(this || target, args);
          // If it's a promise, wrap it
          if (result instanceof Promise) {
            return result.catch((e: any) => {
              const error = new Error(e.message);
              error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
              Object.assign(error, e);
              throw error;
            });
          }
          // For chainable methods, wrap their results too
          if (result && typeof result === "object") {
            return new Proxy(result, {
              get(target, chainProp) {
                const chainValue = Reflect.get(target, chainProp);
                if (typeof chainValue !== "function") return chainValue;
                return function (this: unknown, ...chainArgs: unknown[]) {
                  try {
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
                  } catch (e: any) {
                    const error = new Error(e.message);
                    error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
                    Object.assign(error, e);
                    throw error;
                  }
                };
              },
            });
          }
          return result;
        } catch (e: any) {
          const error = new Error(e.message);
          error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
          Object.assign(error, e);
          throw error;
        }
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
