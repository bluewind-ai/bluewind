// app/middleware/index.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context } from "hono"; // Remove the 'type' import

import * as schema from "~/db/schema";

import { insertMiddleware } from "./insert";

export interface DrizzleQuery {
  type: "insert" | "select" | "update" | "delete";
  table: string;
  query: unknown;
  result?: unknown;
}
export type DbClient = PostgresJsDatabase<typeof schema>;
type DbInsertFunction = (...args: any[]) => any;
export function createDbProxy<
  T extends {
    insert: DbInsertFunction;
  },
>(db: T, context: ExtendedContext): T {
  if (!("queries" in context)) {
    (context as any).queries = [];
  }
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
              return insertMiddleware(this || target, value as any, tableName, context, args);
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
export type ExtendedContext = Context & {
  db: DbClient;
  queries: DrizzleQuery[];
  requestId: number;
  functionCallId?: number;
  requestTime: string; // Added
  url: string; // Added
};
declare module "@remix-run/node" {
  interface AppLoadContext extends ExtendedContext {}
}
