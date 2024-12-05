
// app/functions/server.migrate.post.ts

import { sql } from "drizzle-orm";

import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { getTableMetadata } from "~/db/schema/table-models";
import { db } from "~/middleware/main";

export async function migrateModels() {
  
  await db
    .update(requests)
    .set({ cacheStatus: "SKIP" })
    .where(sql`${requests.cacheStatus} IS NULL`);
  
  const existingModels = await db.select({ pluralName: models.pluralName }).from(models);
  const existingPlurals = new Set(existingModels.map((m) => m.pluralName));
  
  const tables = getTableMetadata();
  
  for (const table of tables) {
    if (!existingPlurals.has(table.modelName)) {
      await db
        .insert(models)
        .values({
          pluralName: table.modelName,
          singularName: table.modelName.replace(/s$/, ""), 
          requestId: 1, 
          createdLocation: "migrations/add-models",
        })
        .onConflictDoNothing({ target: models.pluralName });
    }
  }
  
  const finalModels = await db.select().from(models);
}
