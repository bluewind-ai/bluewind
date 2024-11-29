// app/middleware/main.tsx

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { requests } from "~/db/schema";
import * as schema from "~/db/schema";
import { getCurrentLocation } from "~/lib/location-tracker";

import { createDbProxy, ExtendedContext } from ".";
import { retrieveCache } from "./retrieve-cache";

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const baseDb = drizzle(postgres(connectionString), {
  schema,
});
export const db = baseDb;

export async function mainMiddleware(context: Context, next: () => Promise<void>) {
  const startTime = performance.now();
  const c = context as unknown as ExtendedContext;
  c.queries = [];
  const pathname = new URL(c.req.url).pathname;
  const parentRequestId = c.req.header("X-Parent-Request-Id");

  console.log(`[Middleware] Request details:`, {
    url: c.req.url,
    method: c.req.method,
    parentId: parentRequestId || "null",
  });

  if (pathname.startsWith("/api/") && !parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  const shouldUseCache = c.req.header("Cache-Control") === "only-if-cached";
  const cachedResponse = shouldUseCache ? await retrieveCache(pathname) : null;

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

  c.requestId = newRequest.id;

  if (cachedResponse) {
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    await db.update(requests).set({ durationMs }).where(eq(requests.id, newRequest.id));

    return new Response(JSON.stringify(cachedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const dbWithProxy = createDbProxy(db, c);
  c.db = dbWithProxy;

  await next();

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

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

  console.log(`[Middleware] Request completed:`, {
    id: newRequest.id,
    pathname,
    durationMs,
    responseStatus: c.res.status,
    responseLength: finalResponseText?.length || 0,
  });

  if (!durationMs) {
    throw new Error("No durationMs available");
  }

  await db
    .update(requests)
    .set({
      response: finalResponseText,
      durationMs,
    })
    .where(eq(requests.id, newRequest.id));
}
