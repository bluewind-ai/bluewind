// app/middleware/main.tsx

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { models, objects, requests, serverFunctions } from "~/db/schema";
import * as schema from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import { insertRequestObjects } from "~/functions/insert-request-objects.server";
import { root } from "~/functions/root.server";

import { createDbProxy, ExtendedContext } from ".";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const baseDb = drizzle(postgres(connectionString), {
  schema,
});
export const db = baseDb;
export async function mainMiddleware(context: Context, next: () => Promise<void>) {
  console.log("[mainMiddleware] Starting...");
  const c = context as unknown as ExtendedContext;
  // Initialize the queries array in the context
  c.queries = [];

  try {
    // Check if any requests exist
    console.log("[mainMiddleware] Checking requests...");
    const firstRequest = await db.select().from(requests).limit(1);
    if (firstRequest.length === 0) {
      console.log("[mainMiddleware] No requests found, running root...");
      const response = await root(c);
      return response; // Return the redirect response from root
    }

    // Get request model first
    console.log("[mainMiddleware] Getting request model...");
    const [requestModel] = await db
      .select()
      .from(models)
      .where(eq(models.pluralName, TABLES.requests.modelName));

    if (!requestModel) {
      throw new Error("Request model not found");
    }
    console.log("[mainMiddleware] Found request model:", requestModel);

    // Create request and its object in one transaction
    console.log("[mainMiddleware] Creating request and object...");
    const [request] = await db.transaction(async (trx) => {
      console.log("[mainMiddleware] Starting transaction...");

      // Create request
      const [newRequest] = await trx
        .insert(requests)
        .values({
          requestId: 0,
          pathname: new URL(c.req.url).pathname,
        })
        .returning();
      console.log("[mainMiddleware] Created request:", newRequest);

      // Update request to point to itself
      await trx
        .update(requests)
        .set({ requestId: newRequest.id })
        .where(sql`${requests.id} = ${newRequest.id}`);
      console.log("[mainMiddleware] Updated request with self-reference");

      // Create the request object right away
      const [requestObject] = await trx
        .insert(objects)
        .values({
          modelId: requestModel.id,
          recordId: newRequest.id,
          requestId: newRequest.id,
        })
        .returning();
      console.log("[mainMiddleware] Created request object:", requestObject);

      return [newRequest];
    });

    console.log("[mainMiddleware] Transaction completed, request:", request);

    // Set request context
    c.requestId = request.id;

    // Now do the rest of the middleware operations with proxied db
    console.log("[mainMiddleware] Checking models...");
    const allModels = await db
      .select({ id: models.id, pluralName: models.pluralName })
      .from(models);
    if (allModels.length === 0) {
      throw new Error("Models table is empty. Please run seed-models script first.");
    }
    console.log("[mainMiddleware] Found models count:", allModels.length);

    // Get a valid server function ID
    console.log("[mainMiddleware] Checking server functions...");
    const [serverFunction] = await db
      .select({ id: serverFunctions.id })
      .from(serverFunctions)
      .limit(1);
    if (!serverFunction) {
      throw new Error("No server functions found. Please seed the database first.");
    }
    console.log("[mainMiddleware] Found server function:", serverFunction);

    const dbWithProxy = createDbProxy(db, c);
    console.log("[mainMiddleware] Starting main transaction...");
    await dbWithProxy.transaction(
      async (trx) => {
        const proxiedTrx = createDbProxy(trx, c);
        c.db = proxiedTrx;

        try {
          console.log("[mainMiddleware] Executing next middleware...");
          await next();
        } finally {
          console.log("[mainMiddleware] Running insertRequestObjects...");
          await insertRequestObjects(c);
        }
      },
      {
        isolationLevel: "serializable",
      },
    );
    console.log("[mainMiddleware] Main transaction completed");
  } catch (error) {
    console.error("[mainMiddleware] Error:", error);
    throw error;
  }
}
