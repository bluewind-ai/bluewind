// app/api/test-new-middleware/index.tsx

import { Hono } from "hono";

const app = new Hono();

app.post("/api/test-new-middleware", async (c) => {
  const { args } = await c.req.json();
  const [requestId] = args;
  return c.json({ tested: true });
});

export default app;
