// app/api/test-route-2/index.tsx
import { Hono } from "hono";

const app = new Hono();
app.post("/api/test-route-2", async (c) => {
  return c.json("test");
});
export default app;
