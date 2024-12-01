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
  console.log("[db-proxy] Received request body:", body);

  try {
    const { operation, table, values } = RequestSchema.parse(body);
    console.log("[db-proxy] Parsed values:", { operation, table, values });

    switch (operation) {
      case "insert": {
        switch (table) {
          case "users": {
            const result = await db.insert(users).values(values).returning();
            return c.json({ success: true, data: result });
          }
          case "raw_data": {
            console.log("[db-proxy] Attempting raw_data insert with values:", values);
            try {
              const result = await db.insert(rawData).values(values).returning();
              console.log("[db-proxy] Insert successful:", result);
              return c.json({ success: true, data: result });
            } catch (insertError) {
              console.error("[db-proxy] Insert error:", insertError);
              throw insertError;
            }
          }
          case "source_mappings": {
            console.log("[db-proxy] Attempting source_mappings insert with values:", values);
            try {
              const result = await db.insert(sourceMappings).values(values).returning();
              console.log("[db-proxy] Insert successful:", result);
              return c.json({ success: true, data: result });
            } catch (insertError) {
              console.error("[db-proxy] Insert error:", insertError);
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
    console.error("[db-proxy] Error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }

    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default app;
