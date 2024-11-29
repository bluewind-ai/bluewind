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
import { retrieveCache } from "./retrieve-cache";

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

  const shouldUseCache = c.req.header("Cache-Control") === "only-if-cached";
  const cachedResponse = shouldUseCache ? await retrieveCache(pathname) : null;

  const [requestModel] = await db
    .select()
    .from(models)
    .where(eq(models.pluralName, TABLES.requests.modelName));

  console.log(`[Middleware] Creating request for ${pathname} with cache settings:`, {
    shouldUseCache,
    hasCachedResponse: !!cachedResponse,
    willSetCacheStatus: cachedResponse ? "HIT" : shouldUseCache ? "MISS" : "SKIP",
  });

  const [newRequest] = await db
    .insert(requests)
    .values({
      parentId: parentRequestId ? parseInt(parentRequestId) : null,
      pathname,
      createdLocation: getCurrentLocation(),
      response: cachedResponse ? JSON.stringify(cachedResponse) : null,
      cacheStatus: cachedResponse ? "HIT" : shouldUseCache ? "MISS" : "SKIP",
    })
    .returning();

  console.log(
    `[Middleware] Created request ${newRequest.id} with cacheStatus:`,
    newRequest.cacheStatus,
  );

  await db.insert(objects).values({
    modelId: requestModel.id,
    recordId: newRequest.id,
    requestId: parentRequestId ? parseInt(parentRequestId) : null,
    createdLocation: getCurrentLocation(),
  });

  c.requestId = newRequest.id;

  if (cachedResponse) {
    return new Response(JSON.stringify(cachedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  }

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
