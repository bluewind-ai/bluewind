// app/api/root/index.tsx

import { Hono } from "hono";
import { join } from "path";

import { requests } from "~/db/schema/requests/schema";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

import { writeFile } from "../../lib/intercepted-fs";

const app = new Hono();

app.post("/api/run-route/root", async (c) => {
  console.log("[root route] Starting...");
  console.log("[Current Location]:", getCurrentLocation());

  try {
    const parentRequestId = c.req.header("X-Parent-Request-Id");
    console.log("[root] Parent request ID from header:", parentRequestId);

    const [rootRequest] = await db
      .insert(requests)
      .values({
        requestId: parentRequestId ? parseInt(parentRequestId) : null,
        pathname: "/",
        createdLocation: getCurrentLocation(),
      })
      .returning();

    console.log("[root] Created request:", rootRequest.id);
    c.requestId = rootRequest.id;
    console.log("[root] Set context requestId to:", c.requestId);

    let mainFlowError = null;
    let tree = null;

    await writeFile(join(process.cwd(), "cassette.txt"), "", "utf-8");

    try {
      const mainFlowResponse = await fetchWithContext(c)(
        "http://localhost:5173/api/run-route/main-flow",
        {
          method: "POST",
        },
      );

      if (!mainFlowResponse.ok) {
        throw new Error("Main flow failed");
      }
    } catch (error) {
      mainFlowError = error;
    }

    try {
      const treeResponse = await fetchWithContext(c)(
        `http://localhost:5173/api/run-route/get-request-tree/${rootRequest.id}`,
        {
          method: "GET",
        },
      );

      const treeJson = await treeResponse.json();
      tree = treeJson.tree;
    } catch (error) {
      console.error("[root] Failed to get tree:", error);
    }

    await fetchWithContext(c)("http://localhost:5173/api/run-route/store-cassette", {
      method: "POST",
    });

    const response = {
      success: !mainFlowError,
      requestId: rootRequest.id,
      ...(mainFlowError && { error: String(mainFlowError) }),
      ...(tree && { tree }),
    };

    console.log("[root] Sending response:", {
      ...response,
      tree: tree ? "<tree data>" : undefined,
    });
    return c.json(response, mainFlowError ? 500 : 200);
  } catch (error) {
    console.error("[root route] Error:", error);
    if (c.requestId) {
      return c.json(
        {
          success: false,
          error: String(error),
          requestId: c.requestId,
        },
        500,
      );
    }
    return c.json(
      {
        success: false,
        error: String(error),
      },
      500,
    );
  }
});

export default app;
