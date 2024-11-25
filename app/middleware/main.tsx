// app/middleware/main.tsx

import { sql } from "drizzle-orm";
import { DefaultLogger } from "drizzle-orm/logger";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { functionCalls, models, objects, requests, serverFunctions } from "~/db/schema";
import * as schema from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import { checkDataIntegrity } from "~/functions/check-data-integrity.server";
import { root } from "~/functions/root.server";

import { createDbProxy, DrizzleQuery } from ".";
import { countObjectsForQueries } from "./functions";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Create a custom logger
class CustomLogger extends DefaultLogger {
  logQuery(query: string, params: unknown[]): void {
    // Get the current stack trace
    const stack = new Error().stack
      ?.split("\n")
      .slice(1)
      .map((line) => line.trim())
      .join("\n");

    console.log("🔍 Executing SQL Query:", {
      query,
      params,
      stack,
      timestamp: new Date().toISOString(),
    });
  }
}

const baseDb = drizzle(postgres(connectionString), {
  schema,
  logger: new CustomLogger(),
});
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

  // Initialize the queries array in the context
  (c as ExtendedContext).queries = [];

  // Check if any function calls exist
  const firstFunctionCall = await db.select().from(functionCalls).limit(1);
  if (firstFunctionCall.length === 0) {
    console.log("🌱 No function calls found, bootstrapping with root function...");
    await root({
      db,
      queries: (c as ExtendedContext).queries, // Pass context queries
      requestId: 1,
      functionCallId: 1,
    });
  }

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

  const dbWithProxy = createDbProxy(db, c); // Pass context instead of queries array

  console.log("📊 Starting transaction");

  await dbWithProxy.transaction(
    async (trx) => {
      console.log("💫 Inside transaction");
      const proxiedTrx = createDbProxy(trx, c); // Pass context here too

      // Create request using the first function call ID (which always exists thanks to root)
      const [request] = await proxiedTrx
        .insert(requests)
        .values({
          functionCallId: 1,
          requestId: 0, // Temporary value
        })
        .returning();

      // Update request to point to itself
      await proxiedTrx
        .update(requests)
        .set({ requestId: request.id })
        .where(sql`${requests.id} = ${request.id}`);

      (c as ExtendedContext).db = proxiedTrx;
      (c as ExtendedContext).requestId = request.id;
      (c as ExtendedContext).functionCallId = 1;
      await next();

      const objectsToInsert = await countObjectsForQueries(
        proxiedTrx,
        (c as ExtendedContext).queries,
        request.id,
      );

      console.log("🔍 Current queries state:", (c as ExtendedContext).queries);
      console.log("🔍 Objects to insert:", objectsToInsert);

      const beforeCount = await proxiedTrx.select({ count: sql<number>`count(*)` }).from(objects);
      console.log("📊 Objects count before insert:", Number(beforeCount[0].count));

      if (objectsToInsert.length > 0) {
        // Add the request object to the objects we're about to insert
        const requestObject = {
          modelId: requestModel.id,
          recordId: request.id,
          requestId: request.id,
          functionCallId: 1,
        };

        // Remove any duplicates based on modelId and recordId
        const seen = new Set();
        const allObjects = [
          requestObject,
          ...objectsToInsert.map((obj) => ({
            ...obj,
            functionCallId: 1,
            requestId: request.id,
          })),
        ].filter((obj) => {
          const key = `${obj.modelId}-${obj.recordId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Create all objects in one batch
        await proxiedTrx.insert(objects).values(allObjects).returning();
      } else {
        // If no other objects, just create the request object
        await proxiedTrx
          .insert(objects)
          .values({
            modelId: requestModel.id,
            recordId: request.id,
            requestId: request.id,
            functionCallId: 1,
          })
          .returning();
      }

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
