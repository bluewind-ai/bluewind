// app/routes/load-csv.ts
import { Hono } from "hono";

const app = new Hono();

app.post("/load-csv", async (c) => {
  console.log("[loadCsv route] Starting CSV load...");
  // Your CSV loading logic here
  return c.json({ success: true });
});

export type LoadCsvType = typeof app;
export default app;
