// app/middleware/main.tsx
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { functionCalls, models, objects, requests, serverFunctions } from "~/db/schema";
import * as schema from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import { checkDataIntegrity } from "~/functions/check-data-integrity.server";
import { root } from "~/functions/root.server";

import { createDbProxy, ExtendedContext } from ".";
import { countObjectsForQueries } from "./functions";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
// Create a custom logger
// class CustomLogger extends DefaultLogger {
//   logQuery(query: string, params: unknown[]): void {
//     // Get the current stack trace
//     const stack = new Error().stack
//       ?.split("\n")
//       .slice(1)
//       .map((line) => line.trim())
//       .join("\n");
//   }
// }
const baseDb = drizzle(postgres(connectionString), {
  schema,
  // logger: new CustomLogger(),
});
export const db = baseDb;
export async function mainMiddleware(c: Context, next: () => Promise<void>) {
  // Initialize the queries array in the context
  (c as ExtendedContext).queries = [];

  // Check if any function calls exist
  const firstFunctionCall = await db.select().from(functionCalls).limit(1);
  if (firstFunctionCall.length === 0) {
    await root(c as ExtendedContext);
  }

  // Create request first using raw db
  const [request] = await db
    .insert(requests)
    .values({
      functionCallId: 1,
      requestId: 0, // Temporary value
    })
    .returning();

  // Update request to point to itself
  await db
    .update(requests)
    .set({ requestId: request.id })
    .where(sql`${requests.id} = ${request.id}`);

  // Set request context
  (c as ExtendedContext).requestId = request.id;
  (c as ExtendedContext).functionCallId = 1;

  // Now do the rest of the middleware operations with proxied db
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

  const dbWithProxy = createDbProxy(db, c as ExtendedContext);
  await dbWithProxy.transaction(
    async (trx) => {
      const proxiedTrx = createDbProxy(trx, c as ExtendedContext);
      (c as ExtendedContext).db = proxiedTrx;

      await next();

      const objectsToInsert = await countObjectsForQueries(
        proxiedTrx,
        (c as ExtendedContext).queries,
        request.id,
      );

      if (objectsToInsert.length > 0) {
        const requestObject = {
          modelId: requestModel.id,
          recordId: request.id,
          requestId: request.id,
          functionCallId: 1,
        };

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

        await proxiedTrx.insert(objects).values(allObjects).returning();
      } else {
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

      await checkDataIntegrity(proxiedTrx);
    },
    {
      isolationLevel: "serializable",
    },
  );
}
