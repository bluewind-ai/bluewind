// app/api/main-flow/index.tsx

import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();

app.post("/api/main-flow", async (c) => {
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  const setupResponse = await fetchWithContext(c)("http://localhost:5173/api/setup/initialize", {
    method: "POST",
    headers: {
      "X-Parent-Request-Id": parentRequestId,
    },
  });

  if (!setupResponse.ok) {
    throw new Error("Failed to initialize setup");
  }

  const ingestResponse = await fetchWithContext(c)(
    "http://localhost:5173/api/ingest-company-data",
    {
      method: "POST",
    },
  );

  if (!ingestResponse.ok) {
    throw new Error("Failed to ingest company data");
  }

  const testResponse = await fetchWithContext(c)("http://localhost:5173/api/test-route", {
    method: "POST",
  });

  if (!testResponse.ok) {
    throw new Error("Failed to call test route");
  }

  return c.json({ success: true });
});

export default app;
