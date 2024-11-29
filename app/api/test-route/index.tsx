// app/api/test-route/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();
app.post("/api/test-route", async (c) => {
  const response = await fetchWithContext(c)(
    "http://localhost:5173/api/run-route/ingest-company-data",
    {
      method: "POST",
    },
  );
  const data = await response.json();
  return c.json(data);
});
export default app;
