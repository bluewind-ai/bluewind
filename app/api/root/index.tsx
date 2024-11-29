// app/api/root/index.tsx

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { join } from "path";

import { requests } from "~/db/schema/requests/schema";
import { migrateModels } from "~/functions/server.migrate";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

import { writeFile } from "../../lib/intercepted-fs";

const app = new Hono();
app.post("/api/run-route/root", async (c) => {
  // Do setup work before starting timer
  await migrateModels();
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  const requestSizeBytes = (await c.req.text()).length;

  console.log("[Root] Creating initial root request entry");

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

  console.log("[Root] Created root request", {
    id: rootRequest.id,
    cacheStatus: rootRequest.cacheStatus,
  });

  // Start timing only the actual processing work
  console.log("[Root] Starting processing timer");
  const startTime = performance.now();

  c.requestId = rootRequest.id;
  let mainFlowError = null;
  let tree = null;
  await writeFile(join(process.cwd(), "cassette.json"), "", "utf-8");

  console.log("[Root] Initiating main flow request");
  const mainFlowResponse = await fetchWithContext(c)(
    "http://localhost:5173/api/run-route/main-flow",
    {
      method: "POST",
    },
  );
  if (!mainFlowResponse.ok) {
    mainFlowError = new Error("Main flow failed");
    console.log("[Root] Main flow failed");
  }

  console.log("[Root] Fetching request tree");
  const treeResponse = await fetchWithContext(c)(
    `http://localhost:5173/api/run-route/get-request-tree/${rootRequest.id}`,
    {
      method: "GET",
    },
  );
  const treeJson = await treeResponse.json();
  tree = treeJson.tree;

  console.log("[Root] Storing cassette");
  const cassette = JSON.stringify(tree, null, 2);
  await fetchWithContext(c)("http://localhost:5173/api/run-route/store-cassette", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cassette }),
  });

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  console.log("[Root] Processing completed:", {
    id: rootRequest.id,
    durationMs,
  });

  const response = {
    success: !mainFlowError,
    requestId: rootRequest.id,
    ...(mainFlowError && { error: String(mainFlowError) }),
    ...(tree && { tree }),
  };

  const responseText = JSON.stringify(response);
  const responseSizeBytes = responseText.length;

  console.log("[Root] Updating request with final metrics:", {
    durationMs,
    responseSizeBytes,
  });

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
