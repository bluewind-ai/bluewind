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
  return queries
    .filter((q) => q.result && q.table !== TABLES.objects.modelName)
    .flatMap((q) => {
      const results = Array.isArray(q.result) ? q.result : [q.result];
      const modelId = modelMap.get(q.table);
      if (!modelId) {
        return [];
      }
      const objects = results
        .map((r) => {
          const key = `${modelId}-${r.id}-${requestId}`;
          if (existingObjects.has(key)) {
            return null;
          }
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
}
