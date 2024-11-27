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

  return c.json({ success: true, message: "Test route working" });
});

export default app;
