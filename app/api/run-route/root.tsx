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

    // Now handle any errors that occurred but still include requestId
    if (mainFlowError) {
      const response = {
        success: false,
        error: String(mainFlowError),
        requestId: rootRequest.id,
      };
      console.log("[root] Sending error response with requestId:", response);
      return c.json(response, 500);
    }

    // Success case
    const successResponse = {
      success: true,
      requestId: rootRequest.id,
    };
    console.log("[root] Sending success response:", successResponse);
    return c.json(successResponse);
  } catch (error) {
    console.error("[root route] Error:", error);
    // If we have c.requestId, we created the request before failing
    if (c.requestId) {
      const errorResponse = {
        success: false,
        error: String(error),
        requestId: c.requestId,
      };
      console.log("[root] Sending catch block error response with requestId:", errorResponse);
      return c.json(errorResponse, 500);
    }
    // Complete failure case - request wasn't even created
    const finalErrorResponse = {
      success: false,
      error: String(error),
    };
    console.log("[root] Sending catch block error response without requestId:", finalErrorResponse);
    return c.json(finalErrorResponse, 500);
  }
});

export default app;
