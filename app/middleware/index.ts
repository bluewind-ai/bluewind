// app/middleware/index.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context } from "hono"; // Remove the 'type' import

import * as schema from "~/db/schema";

import { insertMiddleware } from "./insert";

// Keep original console.log override
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

export function createDbProxy<T extends { insert: DbInsertFunction }>(db: T, context: Context): T {
  if (!("queries" in context)) {
    (context as any).queries = [];
  }

  console.log(
    "🔄 Creating DB Proxy. Initial queries length:",
    (context as any).queries?.length ?? 0,
  );

  return new Proxy(db, {
    get(target, prop) {
      console.log("🎯 DB Proxy intercepted property:", String(prop));

      const value = Reflect.get(target, prop);
      if (typeof value !== "function") return value;

      return function (this: unknown, ...args: unknown[]) {
        const callStack = new Error().stack;

        if (prop === "insert") {
          console.log("⚡ Insert operation detected");
          const tableArg = args[0];
          if (tableArg && typeof tableArg === "object") {
            const symbols = Object.getOwnPropertySymbols(tableArg);
            console.log(
              "📌 Found symbols:",
              symbols.map((s) => s.description),
            );

            const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
            if (drizzleNameSymbol) {
              const tableName = (tableArg as any)[drizzleNameSymbol];
              console.log("📝 Inserting into table:", tableName);
              return insertMiddleware(this || target, value as any, tableName, context, args);
            }
          }
        }

        const result = value.apply(this || target, args);
        if (result instanceof Promise) {
          return result.catch((e: any) => {
            console.error("❌ Database error:", e);
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
                    console.error("❌ Chain operation error:", e);
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

export type ExtendedContext = Context & RequestExtensions;

declare module "@remix-run/node" {
  interface AppLoadContext extends RequestExtensions {}
}
