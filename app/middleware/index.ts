// app/middleware/index.ts

import type { AppLoadContext } from "@remix-run/node";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import type { NextFunction, Request as ExpressRequest, Response } from "express";
import morgan from "morgan";
import type { Sql } from "postgres";
import postgres from "postgres";

import * as schema from "~/db/schema";
import { requests } from "~/db/schema/requests/schema";
import { sayHello } from "~/hello.server";

declare module "@remix-run/node" {
  interface AppLoadContext {
    db: DbClient;
  }
}

type BaseDbClient = PostgresJsDatabase<typeof schema> & { $client: Sql<Record<string, never>> };

export interface DrizzleQuery {
  type: "insert" | "select" | "update" | "delete";
  table: string;
  query: unknown;
  result?: unknown;
}

export type DbClient = PostgresJsDatabase<typeof schema>;

function createDbProxy(db: BaseDbClient, context: { queries: DrizzleQuery[] }) {
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
              context.queries.push({
                type: "insert",
                table: tableName,
                query: args[0],
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
        context.trx = trx;
        (req as any).requestId = context.requestId;
        (req as any).trx = trx;
        (req as any).context = context;

        await new Promise<void>((resolve) => {
          next();
          res.on("finish", () => {
            console.log("\n\nFINAL TRANSACTION CONTEXT:", {
              requestId: context.requestId,
              queries: context.queries,
            });
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
