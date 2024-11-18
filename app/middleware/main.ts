// app/middleware/main.ts
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { NextFunction, Request as ExpressRequest, Response } from "express";
import postgres from "postgres";

import { models, objects, requests } from "~/db/schema";
import * as schema from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
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
      // Check if models table is populated and get request model
      const allModels = await db
        .select({ id: models.id, pluralName: models.pluralName })
        .from(models);
      if (allModels.length === 0) {
        throw new Error("Models table is empty. Please run seed-models script first.");
      }
      const requestModel = allModels.find(
        (model) => model.pluralName === TABLES.requests.modelName,
      );
      if (!requestModel) {
        throw new Error("Request model not found. Please check models table data.");
      }
      const queries = [] as DrizzleQuery[];
      const dbWithProxy = createDbProxy(db, queries);
      const [{ request_id }] = await dbWithProxy.execute<{
        request_id: number;
      }>(sql`
        WITH request_insert AS (
          INSERT INTO ${requests} DEFAULT VALUES
          RETURNING id
        ),
        object_insert AS (
          INSERT INTO ${objects} (model_id, record_id, request_id)
          SELECT ${requestModel.id}, id, id FROM request_insert
          RETURNING *
        )
        SELECT request_insert.id as request_id
        FROM request_insert, object_insert;
      `);
      const runTransaction = async () => {
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
            const objectsToInsert = await countObjectsForQueries(proxiedTrx, queries, request_id);
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
