// app/functions/seed-models.server.ts

import { models, objects, requests } from "~/db/schema";
import { TABLES } from "~/db/schema/table-models";
import { type RequestExtensions } from "~/middleware";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

function generateModelsToInsert() {
  return MODEL_NAMES.map((name, index) => ({
    id: index + 1,
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
  }));
}

export async function seedModels(request: RequestExtensions) {
  const db = request.db;

  const modelsToInsert = generateModelsToInsert();
  console.log("Inserting models:", modelsToInsert);
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();
  console.log("Inserted models:", insertedModels);

  // First, insert a request to get a request ID (needed for objects)
  const [{ id: requestId }] = await db.insert(requests).values({}).returning();
  console.log("Created request with ID:", requestId);

  const objectsToInsert = insertedModels.map((model) => ({
    modelId: model.id,
    recordId: model.id,
    requestId,
  }));

  console.log("Inserting objects:", objectsToInsert);
  await db.insert(objects).values(objectsToInsert).returning();
}
