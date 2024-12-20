// app/middleware/main.tsx

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import postgres from "postgres";

import { requests } from "~/db/schema";
import * as schema from "~/db/schema";
import { getRequestTreeAndStoreCassette } from "~/functions/get-request-tree-and-store-cassette.server";
import { root } from "~/functions/root.server.post";
import { getCurrentLocation } from "~/lib/location-tracker";
import { handlersByPath } from "~/lib/server-function-utils";
import { serverFn } from "~/lib/server-functions";

import { createDbProxy, ExtendedContext } from ".";
import { retrieveCache } from "./retrieve-cache";

const getNodeColor = (cacheStatus: string, responseStatus: number | null): string => {
  if (cacheStatus === "HIT") return "#808080"; // Grey
  if (!responseStatus || responseStatus >= 400) return "#ff0000"; // Red
  return "#00ff00"; // Green
};

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const baseDb = drizzle(postgres(connectionString), {
  schema,
});
export const db = baseDb;

async function isPartOfReplay(requestId: number, parentId: string | null): Promise<boolean> {
  if (!parentId) return false;
  const parentRequest = await db
    .select()
    .from(requests)
    .where(eq(requests.id, parseInt(parentId)))
    .then((rows) => rows[0]);
  if (!parentRequest) return false;
  return (
    parentRequest.pathname === "/api/replay" ||
    (await isPartOfReplay(requestId, parentRequest.parentId?.toString()))
  );
}

export async function mainMiddleware(context: Context, next: () => Promise<void>) {
  const startTime = performance.now();
  const c = context as unknown as ExtendedContext;
  c.queries = [];
  const pathname = new URL(c.req.url).pathname;
  const parentRequestId = c.req.header("X-Parent-Request-Id");

  console.log("\n\x1b[36m<-- " + c.req.method + " " + pathname + "\x1b[0m\n");
  console.log(`[Middleware] Request details:`, {
    url: c.req.url,
    method: c.req.method,
    parentId: parentRequestId || "null",
  });

  const requestBody = await c.req.text();
  const requestSizeBytes = new TextEncoder().encode(requestBody).length;

  let parsedPayload = null;
  if (requestBody) {
    try {
      parsedPayload = JSON.parse(requestBody);
    } catch {}
  }

  if (pathname.startsWith("/api/") && pathname !== "/api/root" && !parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  const cacheResult = await retrieveCache(pathname, c.req.method, parsedPayload);

  console.log(`[Middleware] Creating request for ${pathname} with cache settings:`, {
    hasCachedResponse: cacheResult.hit,
    willSetCacheStatus: cacheResult.hit ? "HIT" : "SKIP",
  });

  const [newRequest] = await db
    .insert(requests)
    .values({
      parentId: parentRequestId ? parseInt(parentRequestId) : null,
      pathname,
      createdLocation: getCurrentLocation(),
      response: cacheResult.hit ? JSON.stringify(cacheResult.response) : null,
      payload: parsedPayload,
      cacheStatus: cacheResult.hit ? "HIT" : "SKIP",
      durationMs: 0,
      requestSizeBytes,
      responseStatus: null,
      nodeColor: getNodeColor(cacheResult.hit ? "HIT" : "SKIP", null),
    })
    .returning();

  console.log(
    `[Middleware] Created request ${newRequest.id} with cacheStatus:`,
    newRequest.cacheStatus,
  );

  c.requestId = newRequest.id;

  if (cacheResult.hit) {
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);
    const responseSizeBytes = new TextEncoder().encode(JSON.stringify(cacheResult.response)).length;
    await db
      .update(requests)
      .set({
        durationMs,
        responseSizeBytes,
        responseStatus: 200,
      })
      .where(eq(requests.id, newRequest.id));
    return new Response(JSON.stringify(cacheResult.response), {
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
      const isReplay = await isPartOfReplay(newRequest.id, parentRequestId);
      if (!isReplay) {
        await getRequestTreeAndStoreCassette(newRequest.id);
      }
    }
    return c.json(result);
  }

  const handler = handlersByPath[pathname];
  if (handler) {
    let validatedPayload = parsedPayload;

    if (pathname.startsWith("/api/")) {
      const endpointName = pathname.replace(/^\/api\//, "").replace(/-/g, "");
      if (serverFn.schemas[endpointName]) {
        try {
          validatedPayload = serverFn.schemas[endpointName].parse(parsedPayload);
          console.log("[Middleware] Validation successful");
        } catch (error) {
          return c.json({ error: "Invalid request payload", details: error }, 400);
        }
      }
    }

    const result = await handler(c, validatedPayload);

    if (pathname.startsWith("/api/")) {
      const endpointName = pathname.replace(/^\/api\//, "").replace(/-/g, "");
      if (serverFn.outputSchemas[endpointName]) {
        try {
          serverFn.outputSchemas[endpointName].parse(result);
          console.log(`[Middleware] Response validation successful`);
        } catch (error) {
          return c.json({ error: "Invalid response payload", details: error }, 500);
        }
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
        nodeColor: getNodeColor(newRequest.cacheStatus, 200),
      })
      .where(eq(requests.id, newRequest.id));

    if (pathname.startsWith("/api/")) {
      const isReplay = await isPartOfReplay(newRequest.id, parentRequestId);
      if (!isReplay) {
        await getRequestTreeAndStoreCassette(newRequest.id);
      }
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
      nodeColor: getNodeColor(newRequest.cacheStatus, c.res.status),
    })
    .where(eq(requests.id, newRequest.id));

  if (pathname.startsWith("/api/")) {
    const isReplay = await isPartOfReplay(newRequest.id, parentRequestId);
    if (!isReplay) {
      await getRequestTreeAndStoreCassette(newRequest.id);
    }
  }
}
