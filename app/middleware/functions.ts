// app/middleware/functions.ts

import { models } from "~/db/schema";

import type { DbClient, DrizzleQuery } from ".";

export async function countObjectsForQueries(db: DbClient, queries: DrizzleQuery[]) {
  // Get all models and their IDs in one query
  const modelsQuery = await db
    .select({
      pluralName: models.pluralName,
      id: models.id,
    })
    .from(models)
    .orderBy(models.id);

  console.log("Available models:", JSON.stringify(modelsQuery, null, 2));

  // Create lookup map
  const modelMap = new Map(modelsQuery.map((m) => [m.pluralName, m.id]));

  // Process queries and count objects
  const objectsToInsert = queries
    .filter((q) => q.result)
    .flatMap((q, queryIndex) => {
      const results = Array.isArray(q.result) ? q.result : [q.result];
      const modelId = modelMap.get(q.table);

      if (!modelId) {
        console.log(`No model found for table ${q.table}`);
        console.log("Available tables:", [...modelMap.keys()].join(", "));
        return [];
      }

      return results.map((r) => ({
        id: r.id + queryIndex * 1000,
        modelId,
        recordId: r.id,
        functionCallId: null,
      }));
    });

  console.log("Objects count per table:");
  const countsByTable = new Map<string, number>();
  objectsToInsert.forEach((obj) => {
    const model = modelsQuery.find((m) => m.id === obj.modelId);
    if (model) {
      countsByTable.set(model.pluralName, (countsByTable.get(model.pluralName) || 0) + 1);
    }
  });

  countsByTable.forEach((count, table) => {
    console.log(`${table}: ${count} objects`);
  });

  return objectsToInsert;
}
