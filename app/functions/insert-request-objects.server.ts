// app/functions/insert-request-objects.server.ts

import { sql } from "drizzle-orm";

import { models, objects, requests, serverFunctions } from "~/db/schema";
import type { ExtendedContext } from "~/middleware";

async function countMismatch(db: ExtendedContext["db"]) {
  console.log("[insertRequestObjects] Starting count mismatch check...");

  const [objectsCount] = await db.select({ count: sql<number>`count(*)` }).from(objects);
  console.log("[insertRequestObjects] Objects count:", objectsCount);

  const [modelsCount] = await db.select({ count: sql<number>`count(*)` }).from(models);
  const [requestsCount] = await db.select({ count: sql<number>`count(*)` }).from(requests);
  const [serverFunctionsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(serverFunctions);

  const counts = {
    models: Number(modelsCount.count),
    requests: Number(requestsCount.count),
    serverFunctions: Number(serverFunctionsCount.count),
  };

  console.log("[insertRequestObjects] Table counts:", counts);

  const expectedCount = counts.models + counts.requests + counts.serverFunctions;
  const actualCount = Number(objectsCount.count);

  // Only return mismatch if we have fewer objects than expected
  if (actualCount < expectedCount) {
    return {
      expected: expectedCount,
      actual: actualCount,
      difference: expectedCount - actualCount,
    };
  }

  return null;
}

export async function insertRequestObjects(c: ExtendedContext) {
  console.log("[insertRequestObjects] Starting...");

  const mismatch = await countMismatch(c.db);

  if (mismatch) {
    console.log("[insertRequestObjects] Processing mismatch...");

    const existingObjects = await c.db
      .select({
        key: sql`${objects.modelId}::text || '-' || ${objects.recordId}::text`,
        modelId: objects.modelId,
        recordId: objects.recordId,
      })
      .from(objects);

    const existingKeys = new Set(existingObjects.map((o) => o.key));
    const missingObjects = [];

    // Process models (modelId: 5)
    const modelRecords = await c.db.select().from(models);
    for (const record of modelRecords) {
      const key = `5-${record.id}`;
      if (!existingKeys.has(key)) {
        missingObjects.push({ modelId: 5, recordId: record.id });
      }
    }

    // Process requests (modelId: 5)
    const requestRecords = await c.db.select().from(requests);
    for (const record of requestRecords) {
      const key = `5-${record.id}`;
      if (!existingKeys.has(key)) {
        missingObjects.push({ modelId: 5, recordId: record.id });
      }
    }

    // Process serverFunctions (modelId: 3)
    const serverFunctionRecords = await c.db.select().from(serverFunctions);
    for (const record of serverFunctionRecords) {
      const key = `3-${record.id}`;
      if (!existingKeys.has(key)) {
        missingObjects.push({ modelId: 3, recordId: record.id });
      }
    }

    console.log("[insertRequestObjects] Missing objects:", missingObjects);

    if (missingObjects.length > 0) {
      const created = await c.db
        .insert(objects)
        .values(
          missingObjects.map((obj) => ({
            modelId: obj.modelId,
            recordId: obj.recordId,
            requestId: null,
            createdLocation: "insert-request-objects.server.ts",
          })),
        )
        .returning();

      console.log("[insertRequestObjects] Objects created:", created);
    }
  }

  console.log("[insertRequestObjects] Completed");
  return mismatch;
}
