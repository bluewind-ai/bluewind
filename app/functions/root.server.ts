// app/functions/root.server.ts

import { sql } from "drizzle-orm";

import { functionCalls } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { models } from "~/db/schema/models/schema";
import { objects } from "~/db/schema/objects/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";
import type { ExtendedContext } from "~/middleware";
import { createDbProxy, DrizzleQuery } from "~/middleware";
import { db } from "~/middleware/main";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

// First create the function call that owns all bootstrapping
const BOOTSTRAP_FUNCTION_CALL_ID = 1;

function generateModelsToInsert() {
  return MODEL_NAMES.map((name, index) => ({
    id: index + 1,
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
    functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
  }));
}

export async function root(c: ExtendedContext) {
  console.log("Starting root seeding...");

  const queries: DrizzleQuery[] = [];
  const dbWithProxy = createDbProxy(db, c);

  // Create request
  console.log("Creating request...");
  const [insertedRequest] = await dbWithProxy
    .insert(requests)
    .values({
      requestId: 0, // Temporary value
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
    })
    .returning();

  // Update request to point to itself
  await dbWithProxy
    .update(requests)
    .set({ requestId: insertedRequest.id })
    .where(sql`${requests.id} = ${insertedRequest.id}`);
  console.log("Inserted request:", insertedRequest);

  // Insert root function with explicit ID
  console.log("Creating root function...");
  const [rootFunction] = await dbWithProxy
    .insert(serverFunctions)
    .values({
      id: 1,
      name: "root",
      type: ServerFunctionType.SYSTEM,
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
      requestId: insertedRequest.id,
      metadata: {
        label: "Root",
        variant: "default" as ButtonVariant,
      },
    })
    .returning();
  console.log("Inserted root function:", rootFunction);

  // Create function call with explicit ID
  const [functionCall] = await dbWithProxy
    .insert(functionCalls)
    .values({
      id: BOOTSTRAP_FUNCTION_CALL_ID,
      serverFunctionId: rootFunction.id,
      status: FunctionCallStatus.COMPLETED,
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
      requestId: insertedRequest.id,
      args: null,
      result: null,
    })
    .returning();

  // Create models with explicit IDs
  const modelsToInsert = generateModelsToInsert().map((model) => ({
    ...model,
    requestId: insertedRequest.id,
  }));
  console.log("Inserting models:", modelsToInsert);
  const insertedModels = await dbWithProxy.insert(models).values(modelsToInsert).returning();
  console.log("Inserted models:", insertedModels);

  // Create objects without explicit IDs
  console.log("Creating objects...");
  const objectsToInsert = [
    ...insertedModels.map((model) => ({
      modelId: 7,
      recordId: model.id,
      functionCallId: functionCall.id,
      requestId: insertedRequest.id,
    })),
    {
      modelId: 6,
      recordId: insertedRequest.id,
      functionCallId: functionCall.id,
      requestId: insertedRequest.id,
    },
    {
      modelId: 3,
      recordId: rootFunction.id,
      functionCallId: functionCall.id,
      requestId: insertedRequest.id,
    },
    {
      modelId: 4,
      recordId: functionCall.id,
      functionCallId: functionCall.id,
      requestId: insertedRequest.id,
    },
  ];

  const insertedObjects = await dbWithProxy.insert(objects).values(objectsToInsert).returning();
  console.log("Inserted objects:", insertedObjects);
  console.log("Total queries tracked:", queries.length);

  console.log("Root seeding completed successfully");
}
