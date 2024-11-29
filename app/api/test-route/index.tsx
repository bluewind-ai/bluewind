// app/api/test-route/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";
import { retrieveCache } from "~/middleware/retrieve-cache";

const app = new Hono();
app.post("/api/test-route", async (c) => {
  const targetPath = "/api/run-route/ingest-company-data";

  const cachedResponse = await retrieveCache(targetPath);
  if (cachedResponse) {
    return c.json(cachedResponse);
  }

  const response = await fetchWithContext(c)("http://localhost:5173" + targetPath, {
    method: "POST",
  });
  const data = await response.json();
  return c.json(data);
});
export default app;
