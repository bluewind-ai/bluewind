// app/api/run-route/create-raw-data.tsx

import { Hono } from "hono";

const app = new Hono();
app.post("/api/run-route/create-raw-data", async (c) => {
  return c.json({ success: true });
});

export default app;
