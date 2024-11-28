// app/api/run-route/root.tsx

import { Hono } from "hono";

import { requests } from "~/db/schema/requests/schema";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  console.log("[root route] Starting...");
  console.log("[Current Location]:", getCurrentLocation());

  try {
    const parentRequestId = c.req.header("X-Parent-Request-Id");
    console.log("[root] Parent request ID from header:", parentRequestId);

    // 1. Create root request first
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

    // Call main flow, using fetchWithContext
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

    // Always record the cassette using fetchWithContext
    const cassetteResponse = await fetchWithContext(c)(
      "http://localhost:5173/api/run-route/store-cassette",
      {
        method: "POST",
      },
    );

    // Now handle any errors that occurred
    if (mainFlowError) {
      throw mainFlowError;
    }

    // Instead of redirect, fetch the requests page and return its response
    const requestsResponse = await fetchWithContext(c)(
      `http://localhost:5173/requests/${rootRequest.id}`,
      {
        method: "GET",
      },
    );

    if (!requestsResponse.ok) {
      throw new Error("Failed to fetch requests page");
    }

    return new Response(await requestsResponse.text(), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("[root route] Error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
