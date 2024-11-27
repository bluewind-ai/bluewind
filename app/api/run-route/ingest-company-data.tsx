// app/api/run-route/ingest-company-data.tsx

import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  try {
    console.log("[ingest-company-data] Starting...");

    // Sleep for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("[ingest-company-data] Finished sleeping");

    return c.json({ message: "I worked for 1 second" });
  } catch (error) {
    console.error("[ingest-company-data] Error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
