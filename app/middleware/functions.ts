// app/middleware/functions.ts

import { models } from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";

import type { DbClient, DrizzleQuery } from ".";

export async function countObjectsForQueries(
  trx: DbClient,
  queries: DrizzleQuery[],
  requestId: number,
) {
  const modelsQuery = await trx
    .select({
      id: models.id,
      pluralName: models.pluralName,
    })
    .from(models)
    .orderBy(models.id);

  // Create lookup map
  const modelMap = new Map(modelsQuery.map((m) => [m.pluralName, m.id]));

  // Track existing objects to prevent duplicates
  const existingObjects = new Set<string>();

  // Process queries and count objects, excluding 'objects' table queries
  const objectsToInsert = queries
    .filter((q) => q.result && q.table !== TABLES.objects.modelName)
    .flatMap((q) => {
      console.log("📝 Processing query for table:", q.table, "Result:", q.result);
      const results = Array.isArray(q.result) ? q.result : [q.result];
      const modelId = modelMap.get(q.table);
      if (!modelId) {
        console.log("⚠️ No model ID found for table:", q.table);
        return [];
      }
      const objects = results
        .map((r) => {
          const key = `${modelId}-${r.id}-${requestId}`;
          if (existingObjects.has(key)) {
            console.log("🔄 Skipping duplicate object:", key);
            return null;
          }
          console.log("🏷️ Creating object for record:", r.id, "in table:", q.table);
          existingObjects.add(key);
          return {
            modelId,
            recordId: r.id,
            functionCallId: null,
            requestId: requestId,
          };
        })
        .filter((obj): obj is NonNullable<typeof obj> => obj !== null);
      return objects;
    });

  // Only add objects for models that were actually used in queries
  const usedModelPluralNames = new Set(queries.map((q) => q.table));
  const modelsModelId = modelMap.get(TABLES.models.modelName);
  if (modelsModelId) {
    const modelObjects = modelsQuery
      .filter((m) => usedModelPluralNames.has(m.pluralName))
      .filter((m) => {
        const key = `${modelsModelId}-${m.id}-${requestId}`;
        return !existingObjects.has(key);
      })
      .map((m) => ({
        modelId: modelsModelId,
        recordId: m.id,
        functionCallId: null,
        requestId: requestId,
      }));

    console.log("📚 Adding objects for models. Count:", modelObjects.length);
    objectsToInsert.push(...modelObjects);
  }

  const countsByTable = new Map<string, number>();
  objectsToInsert.forEach((obj) => {
    const model = modelsQuery.find((m) => m.id === obj.modelId);
    if (model) {
      countsByTable.set(model.pluralName, (countsByTable.get(model.pluralName) || 0) + 1);
    }
  });

  console.log("📊 Objects to insert by table:", Object.fromEntries(countsByTable));
  console.log("📊 Total objects to insert:", objectsToInsert.length);

  return objectsToInsert;
}
