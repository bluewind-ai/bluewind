// app/api/db-proxy/index.tsx
import { Hono } from "hono";
import { z } from "zod";

import { rawData, sourceMappings, users } from "~/db/schema";
import { db } from "~/middleware/main";

const app = new Hono();
// Validate incoming request body
const RequestSchema = z.object({
  operation: z.enum(["insert", "select", "update", "delete"]),
  table: z.string(),
  values: z.any(),
});
app.post("/api/db-proxy", async (c) => {
  const body = await c.req.json();
  try {
    const { operation, table, values } = RequestSchema.parse(body);
    switch (operation) {
      case "insert": {
        switch (table) {
          case "users": {
            const result = await db.insert(users).values(values).returning();
            return c.json({ success: true, data: result });
          }
          case "raw_data": {
            try {
              const result = await db.insert(rawData).values(values).returning();
              return c.json({ success: true, data: result });
            } catch (insertError) {
              throw insertError;
            }
          }
          case "source_mappings": {
            try {
              const result = await db.insert(sourceMappings).values(values).returning();
              return c.json({ success: true, data: result });
            } catch (insertError) {
              throw insertError;
            }
          }
          default:
            return c.json({ success: false, error: `Table ${table} not supported yet` }, 400);
        }
      }
      default:
        return c.json({ success: false, error: `Operation ${operation} not supported yet` }, 400);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: String(error) }, 500);
  }
});
export default app;
