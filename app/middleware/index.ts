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

interface InvokeContext {
  path?: string[];
  fnPath?: { name: string; args: unknown[] }[];
}

export function createDbProxy<
  T extends {
    insert: DbInsertFunction;
  },
>(db: T, queries: DrizzleQuery[]) {
  return new Proxy(db, {
    get(target, prop) {
      console.log("Proxy get:", prop);
      console.log("Current queries:", queries);
      const value = Reflect.get(target, prop);
      if (typeof value !== "function") return value;

      return function (this: unknown, ...args: unknown[]) {
        console.log(`${String(prop)} operation called with:`, args);
        const callStack = new Error().stack;

        if (prop === "insert") {
          const tableArg = args[0];
          if (tableArg && typeof tableArg === "object") {
            console.log("Insert table arg:", tableArg);
            const symbols = Object.getOwnPropertySymbols(tableArg);
            console.log("Table symbols:", symbols);
            const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
            if (drizzleNameSymbol) {
              const tableName = (tableArg as any)[drizzleNameSymbol];
              console.log("Found table name:", tableName);
              const query = value.apply(this || target, args);
              return new Proxy(query, {
                get(target, prop) {
                  console.log("Query proxy get:", prop);
                  const chainValue = Reflect.get(target, prop);
                  if (prop === "values") {
                    return function (...args: unknown[]) {
                      console.log("Values called with:", args);
                      const valuesQuery = chainValue.apply(target, args);
                      return new Proxy(valuesQuery, {
                        get(target, prop) {
                          console.log("Values query proxy get:", prop);
                          const returningValue = Reflect.get(target, prop);
                          if (prop === "returning") {
                            return async function (...args: unknown[]) {
                              console.log("Returning called with:", args);
                              const result = await returningValue.apply(target, args);
                              console.log("Got result:", result);
                              queries.push({
                                type: "insert",
                                table: tableName,
                                query: args[0],
                                result,
                              });
                              console.log("Current queries array:", queries);
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
          console.log(`${String(prop)} returned:`, result);
          return new Proxy(result, {
            get(target, chainProp) {
              console.log("Chain property accessed:", chainProp);
              const chainValue = Reflect.get(target, chainProp);
              if (typeof chainValue !== "function") return chainValue;

              return function (this: unknown, ...chainArgs: unknown[]) {
                console.log(`Chain method ${String(chainProp)} called with:`, chainArgs);
                const chainResult = chainValue.apply(this || target, chainArgs);
                if (chainResult instanceof Promise) {
                  return chainResult.catch((e: any) => {
                    const error = new Error(e.message);
                    error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
                    Object.assign(error, e);
                    throw error;
                  });
                }
                console.log(`Chain method ${String(chainProp)} returned:`, chainResult);
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
