// app/middleware/index.ts

import type { AppLoadContext } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import type { NextFunction, Request as ExpressRequest, Response } from "express";
import morgan from "morgan";
import postgres from "postgres";

import * as schema from "~/db/schema";
import { objects } from "~/db/schema/objects/schema";
import { requests } from "~/db/schema/requests/schema";
import { sayHello } from "~/hello.server";

declare module "@remix-run/node" {
  interface AppLoadContext {
    db: DbClient;
  }
}

export interface DrizzleQuery {
  type: "insert" | "select" | "update" | "delete";
  table: string;
  query: unknown;
  result?: unknown;
}

export type DbClient = PostgresJsDatabase<typeof schema>;

type DbInsertFunction = (...args: any[]) => any;

function createDbProxy<T extends { insert: DbInsertFunction }>(
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
  app.use(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const stack = new Error().stack
      ?.split("\n")
      .filter((line) => line.includes("/app/"))
      .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
      .reverse()
      .join("\n");

    console.log(`${req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);

    try {
      const context = {
        queries: [] as DrizzleQuery[],
        db: db,
        requestId: undefined as number | undefined,
        trx: undefined as unknown,
      };

      const dbWithProxy = createDbProxy(db, context);
      const [requestRecord] = await dbWithProxy.insert(requests).values({}).returning();
      context.requestId = requestRecord.id;

      const tx = dbWithProxy.transaction(async (trx) => {
        // Only create the proxy once
        const proxiedTrx = createDbProxy(trx, context);
        context.trx = proxiedTrx;
        (req as any).requestId = context.requestId;
        (req as any).trx = proxiedTrx;
        (req as any).context = context;

        await new Promise<void>((resolve) => {
          next();
          res.on("finish", async () => {
            // Create the object before we log and resolve
            const functionCallQuery = context.queries.find((q) => q.table === "function_calls");
            if (
              functionCallQuery &&
              Array.isArray(functionCallQuery.result) &&
              functionCallQuery.result[0] &&
              context.requestId
            ) {
              const functionCallId = functionCallQuery.result[0].id;
              const requestId = context.requestId;
              if (typeof functionCallId === "number" && typeof requestId === "number") {
                await proxiedTrx
                  .insert(objects)
                  .values({
                    model: "Request",
                    recordId: requestId,
                    functionCallId: functionCallId,
                  })
                  .returning();
              }
            }

            const formattedQueries = context.queries.map((q) => {
              const ids = Array.isArray(q.result) ? q.result.map((r) => r.id) : null;
              return {
                type: q.type,
                table: q.table,
                ids: ids,
              };
            });

            console.log(
              "\n\nFINAL TRANSACTION CONTEXT:",
              JSON.stringify(
                {
                  requestId: context.requestId,
                  queries: formattedQueries,
                },
                null,
                2,
              ),
            );
            resolve();
          });
        });
      });

      tx.catch((error) => {
        console.error("Transaction failed:", error);
        next(error);
      });
    } catch (error) {
      console.error("Failed to create request record:", error);
      next(error);
    }
  });
}

export function getLoadContext(req: ExpressRequest) {
  const context = (req as any).context;
  if (!context) return { db } as AppLoadContext;

  const dbWithProxy = createDbProxy(db, context);

  return {
    db: context.trx ? createDbProxy(context.trx, context) : dbWithProxy,
    requestId: context.requestId,
    trx: context.trx,
    queries: context.queries,
    sayHello,
  } as AppLoadContext;
}
