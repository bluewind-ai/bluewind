

// app/api/routes/reset-factory.tsx

import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { TABLES } from "~/db/schema/table-models";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  
  console.log("[reset-factory route] Starting database truncate...");

  try {
    await db.transaction(async (tx) => {
      
      await tx.execute(sql`SET CONSTRAINTS ALL DEFERRED`);

      
      for (const [tableName, config] of Object.entries(TABLES)) {
        const truncateQuery = sql`TRUNCATE TABLE ${sql.identifier(config.modelName)} CASCADE`;
        const resetSequenceQuery = sql`
          ALTER SEQUENCE IF EXISTS ${sql.identifier(config.modelName + "_id_seq")} RESTART WITH 1
        `;

        console.log(`[reset-factory route] Truncating ${config.modelName}...`);
        await tx.execute(truncateQuery);
        await tx.execute(resetSequenceQuery);
      }

      
      await tx.execute(sql`SET CONSTRAINTS ALL IMMEDIATE`);
    });

    console.log("[reset-factory route] Database truncate completed successfully");
    return c.json({
      success: true,
      message: "All tables truncated and sequences reset",
    });
  } catch (error) {
    console.error("[reset-factory route] Error during truncate:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during truncate",
      },
      500,
    );
  }
});

export type ResetFactoryRouteType = typeof app;
export default app;