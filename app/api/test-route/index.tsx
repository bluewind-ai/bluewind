// app/api/test-route/index.tsx
import { Hono } from "hono";

import { serverFn } from "~/lib/server-functions";

const app = new Hono();
app.post("/api/test-route", async (c) => {
  return c.json(await serverFn.ingestCompanyData(c));
});
export default app;
