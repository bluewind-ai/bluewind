// app/functions/seed-models.server.ts

import { functionCalls, models, objects, requests } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { TABLES } from "~/db/schema/table-models";
import { type RequestExtensions } from "~/middleware";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

function generateModelsToInsert(requestId: number, functionCallId: number) {
  return MODEL_NAMES.map((name, index) => ({
    id: index + 1,
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
    requestId,
    functionCallId,
  }));
}

export async function seedModels(request: RequestExtensions) {
  const db = request.db;

  // First, create a function call that will own everything
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      serverFunctionId: 1, // Assuming this exists
      requestId: 1, // Points to request we'll create next
      functionCallId: 1, // Root seeding function call
      status: FunctionCallStatus.COMPLETED,
      args: null,
      result: null,
    })
    .returning();

  // Next create the request with its final IDs
  const [{ id: requestId }] = await db
    .insert(requests)
    .values({
      id: 1,
      requestId: 1, // Root request points to itself
      functionCallId: functionCall.id,
    })
    .returning();

  // Now we can create models knowing both IDs
  const modelsToInsert = generateModelsToInsert(requestId, functionCall.id);
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();

  // Create objects for all models with the request_id and function_call_id
  const objectsToInsert = insertedModels.map((model) => ({
    modelId: model.id,
    recordId: model.id,
    requestId,
    functionCallId: functionCall.id,
  }));

  await db.insert(objects).values(objectsToInsert);
}
