// app/api/root/index.tsx
import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";

import { requests } from "~/db/schema/requests/schema";
import { getRequestTreeAndStoreCassette } from "~/functions/get-request-tree-and-store-cassette.server";
import { migrateModels } from "~/functions/server.migrate";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();
app.post("/api/run-route/root", async (c) => {
  // Do setup work before starting timer
  await migrateModels();
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  const requestSizeBytes = (await c.req.text()).length;
  const [rootRequest] = await db
    .insert(requests)
    .values({
      requestId: parentRequestId ? parseInt(parentRequestId) : null,
      pathname: "/",
      createdLocation: getCurrentLocation(),
      cacheStatus: "SKIP",
      requestSizeBytes,
      durationMs: 0, // Set initial value to satisfy NOT NULL constraint
    })
    .returning();
  const startTime = performance.now();
  c.requestId = rootRequest.id;
  let mainFlowError = null;
  await writeFile(join(process.cwd(), "cassette.json"), "", "utf-8");
  const mainFlowResponse = await fetchWithContext(c)(
    "http://localhost:5173/api/run-route/main-flow",
    {
      method: "POST",
    },
  );
  if (!mainFlowResponse.ok) {
    mainFlowError = new Error("Main flow failed");
  }
  // Get tree and store both versions
  const tree = await getRequestTreeAndStoreCassette(rootRequest.id);
  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);
  const response = {
    success: !mainFlowError,
    requestId: rootRequest.id,
    ...(mainFlowError && { error: String(mainFlowError) }),
    ...(tree && { tree }),
  };
  const responseText = JSON.stringify(response);
  const responseSizeBytes = responseText.length;
  await db
    .update(requests)
    .set({
      durationMs,
      response: responseText,
      responseSizeBytes,
    })
    .where(eq(requests.id, rootRequest.id));
  return c.json(response, 200);
});
export default app;
