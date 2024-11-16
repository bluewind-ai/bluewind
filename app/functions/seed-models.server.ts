// app/functions/seed-models.server.ts

import { models, objects, requests } from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import type { RequestExtensions } from "~/middleware";

export async function seedModels(request: RequestExtensions) {
  const { db } = request;
  console.log("Starting to seed models...");

  // Create a request first
  const [firstRequest] = await db.insert(requests).values({}).returning();
  console.log("Created request:", request);

  // Create all models in order so we know their IDs
  const modelEntries = Object.entries(TABLES);
  const modelData = modelEntries.map(([_key, config]) => ({
    requestId: firstRequest.id,
    pluralName: config.modelName,
    singularName: config.modelName.endsWith("s") ? config.modelName.slice(0, -1) : config.modelName,
  }));

  // Insert new records
  const insertedModels = await db.insert(models).values(modelData).returning();
  console.log("Successfully seeded models:", JSON.stringify(insertedModels, null, 2));

  // Get the model IDs - they'll be in the same order as TABLES entries
  const requestsModelId = insertedModels[Object.keys(TABLES).indexOf(TABLES.requests.urlName)].id;
  const modelsModelId = insertedModels[Object.keys(TABLES).indexOf(TABLES.models.urlName)].id;

  console.log("\nCreating objects for models and request...");
  const objectsToInsert = [
    // Object for the request itself
    {
      modelId: requestsModelId,
      recordId: firstRequest.id,
    },
    // Objects for the models themselves
    ...insertedModels.map((model) => ({
      modelId: modelsModelId,
      recordId: model.id,
    })),
  ];

  console.log("Objects to insert:", JSON.stringify(objectsToInsert, null, 2));

  const insertedObjects = await db.insert(objects).values(objectsToInsert).returning();
  console.log("\nSuccessfully created objects:", JSON.stringify(insertedObjects, null, 2));

  // Log final state
  const finalObjects = await db.select().from(objects);
  console.log("\nFinal objects in database:", JSON.stringify(finalObjects, null, 2));

  console.log("Models seeded successfully");
}
