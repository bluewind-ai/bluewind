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
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();

  // First, insert a request to get a request ID
  const [{ id: requestId }] = await db.insert(requests).values({}).returning();

  // Create objects for all models with the request_id
  const objectsToInsert = insertedModels.map((model) => ({
    modelId: model.id,
    recordId: model.id,
    requestId,
    functionCallId: null,
  }));

  await db.insert(objects).values(objectsToInsert);
}
