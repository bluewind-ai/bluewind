// app/middleware/main.tsx

import { sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { functionCalls, models, objects, requests, serverFunctions } from "~/db/schema";
import * as schema from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { TABLES } from "~/db/schema/table-models";
import { checkDataIntegrity } from "~/functions/check-data-integrity.server";

import { createDbProxy, DrizzleQuery } from ".";
import { countObjectsForQueries } from "./functions";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const baseDb = drizzle(postgres(connectionString), { schema });
export const db = baseDb;

type DbType = typeof db;
type TrxType = PgTransaction<any, typeof schema, any>;

export type ExtendedContext = Context & {
  db: DbType | TrxType;
  queries: DrizzleQuery[];
  requestId: number;
  functionCallId: number;
};

export async function mainMiddleware(c: Context, next: () => Promise<void>) {
  console.log("🚀 Starting mainMiddleware");
  const url = new URL(c.req.url);
  const stack = new Error().stack
    ?.split("\n")
    .filter((line) => line.includes("/app/"))
    .map((line) => `    at ${line.substring(line.indexOf("/app/"))}`)
    .reverse()
    .join("\n");

  console.log(`${c.req.method} ${url.pathname} from:\n${stack}\n\n\n\n`);

  const allModels = await db.select({ id: models.id, pluralName: models.pluralName }).from(models);

  if (allModels.length === 0) {
    throw new Error("Models table is empty. Please run seed-models script first.");
  }

  const requestModel = allModels.find((model) => model.pluralName === TABLES.requests.modelName);

  if (!requestModel) {
    throw new Error("Request model not found. Please check models table data.");
  }

  // Get a valid server function ID
  const [serverFunction] = await db
    .select({ id: serverFunctions.id })
    .from(serverFunctions)
    .limit(1);

  if (!serverFunction) {
    throw new Error("No server functions found. Please seed the database first.");
  }

  const queries: DrizzleQuery[] = [];
  const dbWithProxy = createDbProxy(db, queries);

  console.log("📊 Starting transaction");

  await dbWithProxy.transaction(
    async (trx) => {
      console.log("💫 Inside transaction");
      const proxiedTrx = createDbProxy(trx, queries);

      // First create the request and its object
      const [{ request_id }] = await proxiedTrx.execute<{
        request_id: number;
      }>(sql`
        WITH request_insert AS (
          INSERT INTO ${requests} DEFAULT VALUES
          RETURNING id
        ),
        object_insert AS (
          INSERT INTO ${objects} (model_id, record_id, request_id, function_call_id)
          SELECT ${requestModel.id}, r.id, r.id, 1
          FROM request_insert r
          RETURNING *
        )
        SELECT
          request_insert.id as request_id
        FROM request_insert, object_insert;
      `);

      (c as ExtendedContext).db = proxiedTrx;
      (c as ExtendedContext).queries = queries;
      (c as ExtendedContext).requestId = request_id;
      (c as ExtendedContext).functionCallId = 1;
      await next();

      const objectsToInsert = await countObjectsForQueries(proxiedTrx, queries, request_id);

      // Debug what we're about to insert
      console.log("🔍 Current queries state:", queries);
      console.log("🔍 Objects to insert:", objectsToInsert);

      // Debug the current state of objects table
      const beforeCount = await proxiedTrx.select({ count: sql<number>`count(*)` }).from(objects);
      console.log("📊 Objects count before insert:", Number(beforeCount[0].count));

      if (objectsToInsert.length > 0) {
        // Create a function call for these objects
        const [functionCall] = await proxiedTrx
          .insert(functionCalls)
          .values({
            serverFunctionId: serverFunction.id,
            requestId: request_id,
            status: FunctionCallStatus.COMPLETED,
            args: null,
            result: null,
          })
          .returning();

        // Ensure all objects have both request_id and function_call_id
        const objectsWithIds = objectsToInsert.map((obj) => ({
          ...obj,
          requestId: request_id,
          functionCallId: functionCall.id,
        }));

        await proxiedTrx.insert(objects).values(objectsWithIds).returning();
      }

      // Debug after insert
      const afterCount = await proxiedTrx.select({ count: sql<number>`count(*)` }).from(objects);
      console.log("📊 Objects count after insert:", Number(afterCount[0].count));

      console.log("🔍 About to run data integrity check");
      await checkDataIntegrity(proxiedTrx);
      console.log("✅ Data integrity check passed");
    },
    {
      isolationLevel: "serializable",
    },
  );
}
