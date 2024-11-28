// app/middleware/main.tsx

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { models, objects, requests } from "~/db/schema";
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
  const c = context as unknown as ExtendedContext;
  c.queries = [];

  const pathname = new URL(c.req.url).pathname;
  const parentRequestId = c.req.header("X-Parent-Request-Id");

  if (pathname.startsWith("/api/") && !parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  const [requestModel] = await db
    .select()
    .from(models)
    .where(eq(models.pluralName, TABLES.requests.modelName));

  const existingRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.pathname, pathname))
    .where(eq(requests.response, "is not", null))
    .limit(1);

  if (existingRequest.length > 0 && existingRequest[0].response) {
    return new Response(existingRequest[0].response, {
      headers: { "Content-Type": "text/html" },
    });
  }

  const [newRequest] = await db
    .insert(requests)
    .values({
      parentId: parentRequestId ? parseInt(parentRequestId) : null,
      pathname,
      createdLocation: getCurrentLocation(),
      response: null,
    })
    .returning();

  await db.insert(objects).values({
    modelId: requestModel.id,
    recordId: newRequest.id,
    requestId: parentRequestId ? parseInt(parentRequestId) : null,
    createdLocation: getCurrentLocation(),
  });

  c.requestId = newRequest.id;
  const dbWithProxy = createDbProxy(db, c);
  c.db = dbWithProxy;

  await next();

  const clonedResponse = c.res.clone();
  const responseText = await clonedResponse.text();

  let finalResponseText = responseText;
  if (!pathname.startsWith("/api/")) {
    try {
      const jsonData = JSON.parse(responseText);
      finalResponseText = JSON.stringify(jsonData, null, 2);
    } catch {
      finalResponseText = responseText;
    }
  }

  await db
    .update(requests)
    .set({ response: finalResponseText })
    .where(eq(requests.id, newRequest.id));

  await insertRequestObjects(c);
}
