// app/middleware/main.tsx

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { models, objects, requests, serverFunctions } from "~/db/schema";
import * as schema from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import { insertRequestObjects } from "~/functions/insert-request-objects.server";
import { getCurrentLocation } from "~/lib/location-tracker";

import { createDbProxy, ExtendedContext } from ".";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const baseDb = drizzle(postgres(connectionString), {
  schema,
});
export const db = baseDb;

export async function mainMiddleware(context: Context, next: () => Promise<void>) {
  console.log("[mainMiddleware] Starting...");
  const c = context as unknown as ExtendedContext;
  c.queries = [];

  try {
    console.log("[mainMiddleware] Checking requests...");
    const firstRequest = await db.select().from(requests).limit(1);
    const isApiRequest = new URL(c.req.url).pathname.startsWith("/api/");

    if (firstRequest.length === 0 && !isApiRequest) {
      console.log("[mainMiddleware] No requests found, calling root route...");
      try {
        const response = await fetch("http://localhost:5173/api/run-route/root", {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error(`Root route failed: ${response.statusText}`);
        }
        return c.redirect("/");
      } catch (error) {
        console.error("[mainMiddleware] Error calling root route:", error);
        throw error;
      }
    }

    const parentRequestId =
      firstRequest.length > 0
        ? c.req.header("X-Parent-Request-Id") || firstRequest[0].id.toString()
        : "0";
    console.log("[mainMiddleware] Using Parent Request ID:", parentRequestId);

    console.log("[mainMiddleware] Getting request model...");
    const [requestModel] = await db
      .select()
      .from(models)
      .where(eq(models.pluralName, TABLES.requests.modelName));

    if (!requestModel) {
      throw new Error("Request model not found");
    }
    console.log("[mainMiddleware] Found request model:", requestModel);

    console.log("[mainMiddleware] Creating request and object...");
    const [request] = await db.transaction(async (trx) => {
      console.log("[mainMiddleware] Starting transaction...");

      const [newRequest] = await trx
        .insert(requests)
        .values({
          requestId: parseInt(parentRequestId),
          pathname: new URL(c.req.url).pathname,
          createdLocation: getCurrentLocation(),
        })
        .returning();
      console.log("[mainMiddleware] Created request:", newRequest);

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

    c.requestId = request.id;

    console.log("[mainMiddleware] Checking models...");
    const allModels = await db
      .select({ id: models.id, pluralName: models.pluralName })
      .from(models);
    if (allModels.length === 0) {
      throw new Error("Models table is empty. Please run seed-models script first.");
    }
    console.log("[mainMiddleware] Found models count:", allModels.length);

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
