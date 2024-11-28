// app/api/test-route/index.tsx

import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  return c.json({ error: "Test error" }, 500);
});

export default app;
