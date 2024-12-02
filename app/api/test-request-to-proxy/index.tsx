// app/api/test-request-to-proxy/index.tsx
import { Hono } from "hono";

import { fetchWithContext } from "~/lib/fetch-with-context";

const app = new Hono();
app.post("/api/test-request-to-proxy", async (c) => {
  const { requestId } = await c.req.json();
  const response = await fetchWithContext(c)("http://localhost:5173/api/db-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "insert",
      table: "users",
      values: {
        name: "Test User",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
        requestId: requestId,
      },
    }),
  });
  return c.json(await response.json());
});
export default app;
