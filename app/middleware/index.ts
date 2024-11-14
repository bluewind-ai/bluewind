// app/middleware/index.ts

import type { AppLoadContext } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Request as ExpressRequest } from "express";
import morgan from "morgan";
import postgres from "postgres";

import * as schema from "~/db/schema";
import { sayHello } from "~/hello.server";

import { main } from "./main";

export interface DrizzleQuery {
  type: "insert" | "select" | "update" | "delete";
  table: string;
  query: unknown;
  result?: unknown;
}

export type DbClient = PostgresJsDatabase<typeof schema>;

type DbInsertFunction = (...args: any[]) => any;

export function createDbProxy<T extends { insert: DbInsertFunction }>(
  db: T,
  context: { queries: DrizzleQuery[] },
) {
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
                              context.queries.push({
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

export function getLoadContext(req: ExpressRequest): AppLoadContext {
  const context = (req as any).context;
  if (!context)
    return {
      db,
      queries: [], // Needs this
      sayHello, // Needs this
    };

  const dbWithProxy = createDbProxy(db, context);

  return {
    db: context.trx ? createDbProxy(context.trx, context) : dbWithProxy,
    requestId: context.requestId,
    trx: context.trx,
    queries: context.queries,
    sayHello,
  };
}

declare module "@remix-run/node" {
  interface AppLoadContext {
    db: DbClient;
    requestId?: number;
    trx?: DbClient;
    queries: DrizzleQuery[];
    sayHello: () => string;
  }
}
