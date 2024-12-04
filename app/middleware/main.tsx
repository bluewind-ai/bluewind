// app/middleware/main.tsx

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { requests } from "~/db/schema";
import * as schema from "~/db/schema";
import { getRequestTreeAndStoreCassette } from "~/functions/get-request-tree-and-store-cassette.server";
import { root } from "~/functions/root.server";
import { getCurrentLocation } from "~/lib/location-tracker";
import { handlersByPath } from "~/lib/server-function-utils";
import { serverFn } from "~/lib/server-functions";

import { createDbProxy, ExtendedContext } from ".";
import { retrieveCache } from "./retrieve-cache";

const VALIDATED_PATHS = [
  "/api/test-new-middleware",
  "/api/list-source-files",
  "/api/get-directory-hash",
  "/api/ingest-company-data",
  "/api/load-routes",
  "/api/setup-initialize",
  "/api/main-flow",
  "/api/test-route",
  "/api/root",
  "/api/chat",
  "/api/eval-new-patient-booking-flow",
  "/api/twilio",
  "/api/replay",
];

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
  // eslint-disable-next-line
  console.log("\n\x1b[36m<-- " + c.req.method + " " + pathname + "\x1b[0m\n");
  // eslint-disable-next-line
  console.log(`[Middleware] Request details:`, {
    url: c.req.url,
    method: c.req.method,
    parentId: parentRequestId || "null",
  });
  const requestBody = await c.req.text();
  const requestSizeBytes = new TextEncoder().encode(requestBody).length;
  // Parse the request body as JSON if possible
  let parsedPayload = null;
  if (requestBody) {
    try {
      parsedPayload = JSON.parse(requestBody);
    } catch {}
  }
  if (pathname.startsWith("/api/") && pathname !== "/api/root" && !parentRequestId) {
    throw new Error("No parent request ID provided");
  }
  const shouldUseCache = c.req.header("Cache-Control") === "only-if-cached";
  const cachedResponse = shouldUseCache ? await retrieveCache(pathname) : null;
  // eslint-disable-next-line
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
      payload: parsedPayload,
      cacheStatus: cachedResponse ? "HIT" : shouldUseCache ? "MISS" : "SKIP",
      durationMs: 0,
      requestSizeBytes,
      responseStatus: null,
    })
    .returning();
  // eslint-disable-next-line
  console.log(
    `[Middleware] Created request ${newRequest.id} with cacheStatus:`,
    newRequest.cacheStatus,
  );
  c.requestId = newRequest.id;
  if (cachedResponse) {
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);
    const responseSizeBytes = new TextEncoder().encode(JSON.stringify(cachedResponse)).length;
    await db
      .update(requests)
      .set({
        durationMs,
        responseSizeBytes,
        responseStatus: 200,
      })
      .where(eq(requests.id, newRequest.id));
    return new Response(JSON.stringify(cachedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (pathname === "/api/root") {
    const result = await root(c);
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);
    const resultText = JSON.stringify(result);
    const responseSizeBytes = new TextEncoder().encode(resultText).length;
    await db
      .update(requests)
      .set({
        response: resultText,
        durationMs,
        responseSizeBytes,
        responseStatus: 200,
      })
      .where(eq(requests.id, newRequest.id));
    if (pathname.startsWith("/api/")) {
      await getRequestTreeAndStoreCassette(newRequest.id);
    }
    return c.json(result);
  }
  const handler = handlersByPath[pathname];
  if (handler) {
    let validatedPayload = parsedPayload;

    // Only validate for specific paths
    if (VALIDATED_PATHS.includes(pathname)) {
      const endpointName = pathname.replace(/^\/api\//, "").replace(/-/g, "");
      // eslint-disable-next-line
      console.log(`[Middleware] About to validate payload for ${endpointName}:`, parsedPayload);
      try {
        validatedPayload = serverFn.schemas[endpointName].parse(parsedPayload);
        // eslint-disable-next-line
        console.log("[Middleware] Validation successful");
      } catch (error) {
        // eslint-disable-next-line
        console.error("[Middleware] Validation failed:", error);
        return c.json({ error: "Invalid request payload", details: error }, 400);
      }
    }

    const result = await handler(c, validatedPayload);

    // Also validate output for the same paths
    if (VALIDATED_PATHS.includes(pathname)) {
      const endpointName = pathname.replace(/^\/api\//, "").replace(/-/g, "");
      // eslint-disable-next-line
      console.log(`[Middleware] Validating response with ${endpointName}OutputSchema...`);
      // eslint-disable-next-line
      console.log(`[Middleware] Raw response before validation:`, result);
      try {
        serverFn.outputSchemas[endpointName].parse(result);
        // eslint-disable-next-line
        console.log(`[Middleware] Response validation successful`);
      } catch (error) {
        // eslint-disable-next-line
        console.error(`[Middleware] Response validation failed:`, error);
        return c.json({ error: "Invalid response payload", details: error }, 500);
      }
    }

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);
    const resultText = JSON.stringify(result);
    const responseSizeBytes = new TextEncoder().encode(resultText).length;
    await db
      .update(requests)
      .set({
        response: resultText,
        durationMs,
        responseSizeBytes,
        responseStatus: 200,
      })
      .where(eq(requests.id, newRequest.id));
    if (pathname.startsWith("/api/")) {
      await getRequestTreeAndStoreCassette(newRequest.id);
    }
    return c.json(result);
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
  const responseSizeBytes = new TextEncoder().encode(finalResponseText).length;
  // eslint-disable-next-line
  console.log(
    "\n\x1b[32m--> " +
      c.req.method +
      " " +
      pathname +
      " " +
      c.res.status +
      " " +
      durationMs +
      "ms\x1b[0m\n",
  );
  // eslint-disable-next-line
  console.log(`[Middleware] Request completed:`, {
    id: newRequest.id,
    pathname,
    durationMs,
    responseStatus: c.res.status,
    requestSizeBytes,
    responseSizeBytes,
  });
  if (!durationMs) {
    throw new Error("No durationMs available");
  }
  await db
    .update(requests)
    .set({
      response: finalResponseText,
      durationMs,
      responseSizeBytes,
      responseStatus: c.res.status,
    })
    .where(eq(requests.id, newRequest.id));
  if (pathname.startsWith("/api/")) {
    await getRequestTreeAndStoreCassette(newRequest.id);
  }
}
