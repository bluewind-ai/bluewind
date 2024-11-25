// app/functions/insert-request-objects.server.ts

import { objects } from "~/db/schema";
import type { ExtendedContext } from "~/middleware";
import { countObjectsForQueries } from "~/middleware/functions";

import { checkDataIntegrity } from "./check-data-integrity.server";

export async function insertRequestObjects(c: ExtendedContext) {
  const { db, queries, requestId } = c;

  console.log("[insertRequestObjects] Starting with requestId:", requestId);
  console.log("[insertRequestObjects] Number of queries:", queries.length);

  const objectsToInsert = await countObjectsForQueries(db, queries, requestId);
  console.log("[insertRequestObjects] objectsToInsert length:", objectsToInsert.length);

  if (objectsToInsert.length > 0) {
    const seen = new Set();
    const allObjects = objectsToInsert
      .map((obj) => ({
        ...obj,
        functionCallId: 1,
        requestId: requestId,
      }))
      .filter((obj) => {
        const key = `${obj.modelId}-${obj.recordId}`;
        if (seen.has(key)) {
          console.log("[insertRequestObjects] Duplicate found:", key);
          return false;
        }
        seen.add(key);
        return true;
      });

    console.log("[insertRequestObjects] Final allObjects length:", allObjects.length);
    console.log(
      "[insertRequestObjects] Objects to be inserted:",
      allObjects.map((obj) => ({
        modelId: obj.modelId,
        recordId: obj.recordId,
        key: `${obj.modelId}-${obj.recordId}`,
      })),
    );

    const inserted = await db.insert(objects).values(allObjects).returning();
    console.log("[insertRequestObjects] Number of objects inserted:", inserted.length);
  } else {
    console.log("[insertRequestObjects] No objects to insert");
  }

  console.log("[insertRequestObjects] Running data integrity check...");
  try {
    await checkDataIntegrity(c.db);
    console.log("[insertRequestObjects] Data integrity check passed");
  } catch (error) {
    console.error("[insertRequestObjects] Data integrity check failed:", error);
    throw error;
  }
}
