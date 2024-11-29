// app/api/ingest-company-data/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();
app.post("/api/run-route/ingest-company-data", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const filesResponse = await fetchWithContext(c)(
    "http://localhost:5173/api/run-route/list-source-files",
    { method: "POST" },
  );
  const filesData = await filesResponse.json();

  await fetchWithContext(c)("http://localhost:5173/api/run-route/create-raw-data", {
    method: "POST",
  });

  return c.json({ message: "I worked for 1 second", files: filesData.files });
});

export default app;
