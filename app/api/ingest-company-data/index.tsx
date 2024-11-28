// app/api/ingest-company-data/index.tsx
import { Hono } from "hono";

const app = new Hono();
app.post("/api/run-route/ingest-company-data", async (c) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return c.json({ message: "I worked for 1 second" });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});
export default app;
