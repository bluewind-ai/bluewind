// app/functions/insert-request-objects.server.ts

import { eq } from "drizzle-orm";

import { models, objects } from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ExtendedContext } from "~/middleware";
import { countObjectsForQueries } from "~/middleware/functions";

import { checkDataIntegrity } from "./check-data-integrity.server";

export async function insertRequestObjects(c: ExtendedContext) {
  const { db, queries, requestId } = c;

  // Get request model
  const [requestModel] = await db
    .select()
    .from(models)
    .where(eq(models.pluralName, TABLES.requests.modelName));

  if (!requestModel) {
    throw new Error("Request model not found");
  }

  const objectsToInsert = await countObjectsForQueries(db, queries, requestId);

  if (objectsToInsert.length > 0) {
    const requestObject = {
      modelId: requestModel.id,
      recordId: requestId,
      requestId: requestId,
      functionCallId: 1,
    };

    const seen = new Set();
    const allObjects = [
      requestObject,
      ...objectsToInsert.map((obj) => ({
        ...obj,
        functionCallId: 1,
        requestId: requestId,
      })),
    ].filter((obj) => {
      const key = `${obj.modelId}-${obj.recordId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await db.insert(objects).values(allObjects).returning();
  } else {
    await db
      .insert(objects)
      .values({
        modelId: requestModel.id,
        recordId: requestId,
        requestId: requestId,
        functionCallId: 1,
      })
      .returning();
  }

  await checkDataIntegrity(c.db);
}
