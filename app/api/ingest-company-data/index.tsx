// app/api/ingest-company-data/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();
app.post("/api/run-route/ingest-company-data", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const response = await fetchWithContext(c)(
    "http://localhost:5173/api/run-route/list-source-files",
    { method: "POST" },
  );
  const data = await response.json();
  return c.json({ message: "I worked for 1 second", files: data.files });
});

export default app;
