// app/api/test-route/index.tsx

import { Hono } from "hono";

import { getCurrentLocation } from "~/lib/location-tracker";

const app = new Hono();

app.post("/", async (c) => {
  console.log("[test-route] Starting...");
  console.log("[test-route] Current location:", getCurrentLocation());

  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    return c.json({ error: "No parent request ID provided" }, 400);
  }

  console.log("Calling lint route...");
  const lintResponse = await fetch("http://localhost:5173/api/lint", {
    method: "POST",
    headers: {
      "X-Parent-Request-Id": c.requestId?.toString(),
    },
  });

  if (!lintResponse.ok) {
    throw new Error("Failed to call lint route");
  }

  const lintData = await lintResponse.json();
  return c.json({
    success: true,
    lintResults: lintData,
  });
});

export default app;
