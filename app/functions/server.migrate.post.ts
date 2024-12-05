// app/functions/server.migrate.ts
import { sql } from "drizzle-orm";

import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { getTableMetadata } from "~/db/schema/table-models";
import { db } from "~/middleware/main";

export async function migrateModels() {
  // Update all requests with null cacheStatus to SKIP
  await db
    .update(requests)
    .set({ cacheStatus: "SKIP" })
    .where(sql`${requests.cacheStatus} IS NULL`);
  // Get all existing models
  const existingModels = await db.select({ pluralName: models.pluralName }).from(models);
  const existingPlurals = new Set(existingModels.map((m) => m.pluralName));
  // Get all table metadata
  const tables = getTableMetadata();
  // Insert any missing models
  for (const table of tables) {
    if (!existingPlurals.has(table.modelName)) {
      await db
        .insert(models)
        .values({
          pluralName: table.modelName,
          singularName: table.modelName.replace(/s$/, ""), // Simple pluralization rule
          requestId: 1, // Assuming 1 is a valid request ID for initialization
          createdLocation: "migrations/add-models",
        })
        .onConflictDoNothing({ target: models.pluralName });
    }
  }
  // Verify all models were created
  const finalModels = await db.select().from(models);
}
