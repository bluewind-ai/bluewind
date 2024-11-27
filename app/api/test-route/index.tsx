// app/api/test-route/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";

const app = new Hono();

app.post("/", async (c) => {
  console.log("[test-route] Starting...");
  console.log("[test-route] Current location:", getCurrentLocation());

  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    return c.json({ error: "No parent request ID provided" }, 400);
  }

  console.log("Calling test-route-2...");
  // Much cleaner!
  const testRoute2Response = await fetchWithContext(c)("http://localhost:5173/api/test-route-2", {
    method: "POST",
  });

  if (!testRoute2Response.ok) {
    throw new Error("Failed to call test-route-2");
  }

  return c.json({ success: true, message: "Test route working" });
});

export default app;
