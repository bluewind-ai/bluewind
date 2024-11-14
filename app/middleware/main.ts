// app/middleware/main.ts

import type { NextFunction, Request as ExpressRequest, Response } from "express";

import { objects, requests } from "~/db/schema";
import { countTables } from "~/functions/count-tables.server";

import { createDbProxy, db, DrizzleQuery } from ".";

export function main(): any {
  return async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const context = {
      queries: [] as DrizzleQuery[],
      db: db,
      requestId: undefined as number | undefined,
      trx: undefined as unknown,
    };

    const dbWithProxy = createDbProxy(db, context);

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const stack = new Error().stack
        ?.split("\n")
        .filter((line) => line.includes("/app/"))
        .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
        .reverse()
        .join("\n");

      console.log(`${req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);

      let nextCalled = false;

      const runTransaction = async () => {
        await dbWithProxy.transaction(
          async (trx) => {
            const proxiedTrx = createDbProxy(trx, context);

            const [requestRecord] = await proxiedTrx.insert(requests).values({}).returning();
            context.requestId = requestRecord.id;

            context.trx = proxiedTrx;
            (req as any).requestId = context.requestId;
            (req as any).trx = proxiedTrx;
            (req as any).context = context;

            if (!nextCalled) {
              await next();
              nextCalled = true;
            }

            const requestId = context.requestId;
            if (!requestId) {
              throw new Error("Could not create request record");
            }
            await proxiedTrx
              .insert(objects)
              .values({
                model: "Request",
                recordId: requestId,
              })
              .returning();

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

            if (!context.requestId) {
              throw new Error("Could not create request record");
            }
            await countTables(trx);
          },
          {
            isolationLevel: "serializable",
          },
        );
      };

      let retries = 3;
      while (retries > 0) {
        try {
          await runTransaction();
          break;
        } catch (error: any) {
          if (error?.code === "40001" && retries > 1) {
            retries--;
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  };
}
