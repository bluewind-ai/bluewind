// app/middleware/functions.ts
import { models } from "~/db/schema";

import type { DbClient, DrizzleQuery } from ".";

export async function countObjectsForQueries(
  db: DbClient,
  queries: DrizzleQuery[],
  requestId: number,
) {
  // Get all models and their IDs in one query
  const modelsQuery = await db
    .select({
      pluralName: models.pluralName,
      id: models.id,
    })
    .from(models)
    .orderBy(models.id);
  // Create lookup map
  const modelMap = new Map(modelsQuery.map((m) => [m.pluralName, m.id]));
  // Process queries and count objects
  const objectsToInsert = queries
    .filter((q) => q.result)
    .flatMap((q) => {
      const results = Array.isArray(q.result) ? q.result : [q.result];
      const modelId = modelMap.get(q.table);
      if (!modelId) {
        return [];
      }
      return results.map((r) => ({
        modelId,
        recordId: r.id,
        functionCallId: null,
        requestId: requestId,
      }));
    });
  const countsByTable = new Map<string, number>();
  objectsToInsert.forEach((obj) => {
    const model = modelsQuery.find((m) => m.id === obj.modelId);
    if (model) {
      countsByTable.set(model.pluralName, (countsByTable.get(model.pluralName) || 0) + 1);
    }
  });
  return objectsToInsert;
}
