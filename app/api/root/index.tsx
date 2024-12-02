// app/api/root/index.tsx

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import { Hono } from "hono";
import { join } from "path";

import { serverFunctions } from "~/db/schema";
import { requests } from "~/db/schema/requests/schema";
import { routes } from "~/db/schema/routes/schema";
import { getRequestTreeAndStoreCassette } from "~/functions/get-request-tree-and-store-cassette.server";
import { migrateModels } from "~/functions/server.migrate";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();

function generateHash(route: string): string {
  return createHash("sha256").update(route).digest("hex");
}

app.post("/api/root", async (c) => {
  console.log("Root reqcdscuest receivedcdscds");
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
      durationMs: 0,
    })
    .returning();
  const startTime = performance.now();
  c.requestId = rootRequest.id;
  let mainFlowError = null;
  await writeFile(join(process.cwd(), "cassette.json"), "", "utf-8");

  // Check if root server function exists
  const existingServerFunction = await db
    .select()
    .from(serverFunctions)
    .where(eq(serverFunctions.name, "root"))
    .limit(1);

  // Create server function if it doesn't exist
  if (existingServerFunction.length === 0) {
    await db.insert(serverFunctions).values({
      name: "root",
      type: "SYSTEM",
      hash: generateHash("root"),
      requestId: rootRequest.id,
      metadata: {
        label: "Root",
        variant: "default",
        description: "Root server function",
      },
      createdLocation: getCurrentLocation(),
    });
  }

  // Check if root route exists
  const existingRoute = await db.select().from(routes).where(eq(routes.name, "root")).limit(1);

  // Create route if it doesn't exist
  if (existingRoute.length === 0) {
    await db.insert(routes).values({
      name: "root",
      type: "SYSTEM",
      hash: generateHash("root"),
      requestId: rootRequest.id,
      metadata: {
        label: "Root",
        variant: "default",
      },
      createdLocation: getCurrentLocation(),
    });
  }

  const mainFlowResponse = await fetchWithContext(c)("http://localhost:5173/api/main-flow", {
    method: "POST",
  });
  if (!mainFlowResponse.ok) {
    mainFlowError = new Error("Main flow failed");
  }
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
