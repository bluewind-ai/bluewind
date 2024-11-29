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
  const startTime = performance.now();

  await migrateModels();

  const parentRequestId = c.req.header("X-Parent-Request-Id");

  console.log("[Root] Creating root request with explicit SKIP cacheStatus");

  const [rootRequest] = await db
    .insert(requests)
    .values({
      requestId: parentRequestId ? parseInt(parentRequestId) : null,
      pathname: "/",
      createdLocation: getCurrentLocation(),
      cacheStatus: "SKIP",
    })
    .returning();

  console.log("[Root] Created root request", {
    id: rootRequest.id,
    cacheStatus: rootRequest.cacheStatus,
  });

  c.requestId = rootRequest.id;
  let mainFlowError = null;
  let tree = null;
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

  const treeResponse = await fetchWithContext(c)(
    `http://localhost:5173/api/run-route/get-request-tree/${rootRequest.id}`,
    {
      method: "GET",
    },
  );
  const treeJson = await treeResponse.json();
  tree = treeJson.tree;

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

  console.log("[Root] Request completed:", {
    id: rootRequest.id,
    durationMs,
  });

  await db.update(requests).set({ durationMs }).where(eq(requests.id, rootRequest.id));

  const response = {
    success: !mainFlowError,
    requestId: rootRequest.id,
    ...(mainFlowError && { error: String(mainFlowError) }),
    ...(tree && { tree }),
  };
  return c.json(response, 200);
});

export default app;