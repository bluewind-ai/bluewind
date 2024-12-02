// app/api/test-drizzle-proxy/index.tsx
import { Hono } from "hono";

import { users } from "~/db/schema";

const app = new Hono();
app.post("/api/test-drizzle-proxy", async (c) => {
  try {
    const { requestId } = await c.req.json();
    // Use c.db instead of importing db directly to use the proxy
    const result = await c.db
      .insert(users)
      .values({
        name: "Test User via Drizzle",
        email: "test-drizzle@example.com",
        createdAt: new Date().toISOString(),
        requestId: requestId,
      })
      .returning();
    return c.json({
      message: "Attempted insert via Drizzle",
      result: result[0],
    });
  } catch (error) {
    throw error;
  }
});
export default app;
