// app/middleware/main.ts

import { sql } from "drizzle-orm";
import type { NextFunction, Request as ExpressRequest, Response } from "express";

import { objects, requests, TableModel } from "~/db/schema";
import { countTables } from "~/functions/count-tables.server";

import { createDbProxy, db, DrizzleQuery } from ".";

function createObjectsFromQueries(queries: DrizzleQuery[]) {
  console.log("\n[Objects Creation]");
  console.log("Processing queries:", JSON.stringify(queries, null, 2));

  const objectsToInsert = queries
    .filter((q) => q.result)
    .flatMap((q, queryIndex) => {
      const results = Array.isArray(q.result) ? q.result : [q.result];
      const model = getTableModelFromTable(q.table);

      return results.map((r) => ({
        id: r.id + queryIndex * 1000, // Use an offset based on query index to ensure unique IDs
        model,
        recordId: r.id,
        functionCallId: null,
      }));
    });

  console.log("Created objects:", JSON.stringify(objectsToInsert, null, 2));
  console.log("[Objects Creation End]\n");

  return objectsToInsert;
}

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
      // no-qa
      console.log(`${req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);
      const [result] = await db.execute<{
        request_id: number;
      }>(sql`
        WITH request_insert AS (
          INSERT INTO ${requests} DEFAULT VALUES
          RETURNING id
        ),
        object_insert AS (
          INSERT INTO ${objects} (id, model, record_id)
          SELECT id, ${TableModel.REQUESTS}, id FROM request_insert
          RETURNING *
        )
        SELECT request_insert.id as request_id
        FROM request_insert, object_insert;
      `);
      context.requestId = result.request_id;
      const runTransaction = async () => {
        await dbWithProxy.transaction(
          async (trx) => {
            const proxiedTrx = createDbProxy(trx, context);
            context.trx = proxiedTrx;
            (req as any).requestId = context.requestId;
            (req as any).trx = proxiedTrx;
            (req as any).context = context;
            await new Promise<void>((resolve) => {
              next();
              res.on("finish", resolve);
            });

            if (!context.requestId) {
              throw new Error("Could not create request record");
            }

            const objectsToInsert = createObjectsFromQueries(context.queries);

            if (objectsToInsert.length > 0) {
              await trx.insert(objects).values(objectsToInsert);
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

function getTableModelFromTable(table: string): (typeof TableModel)[keyof typeof TableModel] {
  const mapping: Record<string, (typeof TableModel)[keyof typeof TableModel]> = {
    users: TableModel.USERS,
    sessions: TableModel.SESSIONS,
    serverFunctions: TableModel.SERVER_FUNCTIONS,
    functionCalls: TableModel.FUNCTION_CALLS,
    requestErrors: TableModel.REQUEST_ERRORS,
    debugLogs: TableModel.DEBUG_LOGS,
    objects: TableModel.OBJECTS,
    requests: TableModel.REQUESTS,
  };
  return mapping[table] || TableModel.OBJECTS;
}