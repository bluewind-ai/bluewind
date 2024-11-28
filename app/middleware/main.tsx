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

  console.log("[mainMiddleware] Checking requests...");
  const firstRequest = await db.select().from(requests).limit(1);
  const isApiRequest = new URL(c.req.url).pathname.startsWith("/api/");

  if (firstRequest.length === 0 && !isApiRequest) {
    console.log("[mainMiddleware] No requests found, calling root route...");
    const response = await fetch("http://localhost:5173/api/run-route/root", {
      method: "POST",
    });
    return c.redirect("/");
  }

  const pathname = new URL(c.req.url).pathname;
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  console.log("[mainMiddleware] Using Parent Request ID:", parentRequestId);

  // Only throw if it's an API route and no parent ID
  if (pathname.startsWith("/api/") && !parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  console.log("[mainMiddleware] Getting request model...");
  const [requestModel] = await db
    .select()
    .from(models)
    .where(eq(models.pluralName, TABLES.requests.modelName));

  console.log("[mainMiddleware] Found request model:", requestModel);

  // Check for cached response before creating a new request
  console.log("[mainMiddleware] Checking for cached response...");
  const existingRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.pathname, pathname))
    .where(eq(requests.response, "is not", null))
    .limit(1);

  if (existingRequest.length > 0 && existingRequest[0].response) {
    console.log("[mainMiddleware] Found cached response, returning it");
    return new Response(existingRequest[0].response, {
      headers: { "Content-Type": "text/html" },
    });
  }

  console.log("[mainMiddleware] Creating request and object...");
  const [request] = await db.transaction(async (trx) => {
    console.log("[mainMiddleware] Starting transaction...");

    const [newRequest] = await trx
      .insert(requests)
      .values({
        parentId: parentRequestId ? parseInt(parentRequestId) : null,
        pathname,
        createdLocation: getCurrentLocation(),
        response: null,
      })
      .returning();
    console.log("[mainMiddleware] Created request:", newRequest);

    const [requestObject] = await trx
      .insert(objects)
      .values({
        modelId: requestModel.id,
        recordId: newRequest.id,
        requestId: parentRequestId ? parseInt(parentRequestId) : null,
        createdLocation: getCurrentLocation(),
      })
      .returning();
    console.log("[mainMiddleware] Created request object:", requestObject);

    return [newRequest];
  });

  console.log("[mainMiddleware] Transaction completed, request:", request);

  c.requestId = request.id;

  console.log("[mainMiddleware] Checking models...");
  const allModels = await db.select({ id: models.id, pluralName: models.pluralName }).from(models);

  console.log("[mainMiddleware] Found models count:", allModels.length);

  const setupRoutes = ["/", "/api/run-route/root", "/api/run-route/reset-factory"];

  if (!setupRoutes.includes(request.pathname)) {
    console.log("[mainMiddleware] Checking server functions...");
    const [serverFunction] = await db
      .select({ id: serverFunctions.id })
      .from(serverFunctions)
      .limit(1);
    console.log("[mainMiddleware] Found server function:", serverFunction);
  }

  const dbWithProxy = createDbProxy(db, c);
  console.log("[mainMiddleware] Starting main transaction...");

  await dbWithProxy.transaction(
    async (trx) => {
      const proxiedTrx = createDbProxy(trx, c);
      c.db = proxiedTrx;

      console.log("[mainMiddleware] Executing next middleware...");
      await next();

      // Clone the response before using it
      const clonedResponse = c.res.clone();

      // Get response text from the clone
      const responseText = await clonedResponse.text();
      console.log("[mainMiddleware] Storing response in cache");

      await proxiedTrx
        .update(requests)
        .set({ response: responseText })
        .where(eq(requests.id, request.id));

      console.log("[mainMiddleware] Running insertRequestObjects...");
      await insertRequestObjects(c);
    },
    {
      isolationLevel: "serializable",
    },
  );
}
