// app/api/load-routes.tsx

import { Hono } from "hono";

const app = new Hono();

app.post("/api/load-routes", async (c) => {
  console.log("[setup] Loading routes...");
  return c.json({ success: true });
});

export default app;
