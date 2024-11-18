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

        // For regular function calls (insert, select, update, delete)
        const originalResult = value.apply(this || target, args);

        // If it's a promise, wrap it to capture errors
        if (originalResult instanceof Promise) {
          return originalResult.catch((e: any) => {
            const error = new Error(e.message);
            error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
            Object.assign(error, e);
            throw error;
          });
        }

        // For chainable methods, create a proxy for the result
        if (originalResult && typeof originalResult === "object") {
          return new Proxy(originalResult, {
            get(target, prop) {
              const chainValue = Reflect.get(target, prop);
              if (typeof chainValue !== "function") return chainValue;

              return function (this: unknown, ...args: unknown[]) {
                const result = chainValue.apply(this || target, args);

                // Handle promises in the chain
                if (result instanceof Promise) {
                  return result.catch((e: any) => {
                    const error = new Error(e.message);
                    error.stack = `${e.message}\nApplication Stack:\n${callStack}\nDatabase Stack:\n${e.stack}`;
                    Object.assign(error, e);
                    throw error;
                  });
                }

                return result;
              };
            },
          });
        }

        return originalResult;
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
