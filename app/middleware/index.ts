// app/middleware/index.ts
import type { AppLoadContext } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Request as ExpressRequest } from "express";
import morgan from "morgan";
import postgres from "postgres";

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
        if (prop === "insert") {
          const tableArg = args[0];
          if (tableArg && typeof tableArg === "object") {
            const symbols = Object.getOwnPropertySymbols(tableArg);
            const drizzleNameSymbol = symbols.find((s) => s.description === "drizzle:Name");
            if (drizzleNameSymbol) {
              const tableName = (tableArg as any)[drizzleNameSymbol];
              const callStack = new Error().stack;
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
        return value.apply(this || target, args);
      };
    },
  });
}
const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const baseDb = drizzle(postgres(connectionString), { schema });
export const db = baseDb;
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
