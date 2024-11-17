// app/middleware/main.ts

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { NextFunction, Request as ExpressRequest, Response } from "express";
import postgres from "postgres";

import { models, objects, requests } from "~/db/schema";
import * as schema from "~/db/schema";
import { countTables } from "~/functions/count-tables.server";

import { createDbProxy, DrizzleQuery, RequestExtensions } from ".";
import { countObjectsForQueries } from "./functions";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const baseDb = drizzle(postgres(connectionString), { schema });
export const db = baseDb;

type EnhancedRequest = ExpressRequest & RequestExtensions;
export function main(): any {
  return async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const stack = new Error().stack
        ?.split("\n")
        .filter((line) => line.includes("/app/"))
        .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
        .reverse()
        .join("\n");
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);
      const [requestModel] = await db
        .select({ id: models.id })
        .from(models)
        .where(sql`${models.pluralName} = 'requests'`);
      const [{ request_id }] = await db.execute<{
        request_id: number;
      }>(sql`
        WITH request_insert AS (
          INSERT INTO ${requests} DEFAULT VALUES
          RETURNING id
        ),
        object_insert AS (
          INSERT INTO ${objects} (id, model_id, record_id)
          SELECT id, ${requestModel.id}, id FROM request_insert
          RETURNING *
        )
        SELECT request_insert.id as request_id
        FROM request_insert, object_insert;
      `);
      const runTransaction = async () => {
        const queries = [] as DrizzleQuery[];
        const dbWithProxy = createDbProxy(db, queries);
        await dbWithProxy.transaction(
          async (trx) => {
            // Create a new proxy for the transaction client
            const proxiedTrx = createDbProxy(trx, queries);
            (req as EnhancedRequest).db = proxiedTrx;
            (req as EnhancedRequest).queries = queries; // Use same queries array
            (req as EnhancedRequest).requestId = request_id; // Set the request ID
            await new Promise<void>((resolve) => {
              next();
              res.on("finish", resolve);
            });
            console.log("Transaction queries:", queries); // Debug log
            const objectsToInsert = await countObjectsForQueries(proxiedTrx, queries);
            if (objectsToInsert.length > 0) {
              await proxiedTrx.insert(objects).values(objectsToInsert);
            }
            await countTables(proxiedTrx);
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