// app/functions/root.server.ts

import { functionCalls } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { models } from "~/db/schema/models/schema";
import { objects } from "~/db/schema/objects/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";
import type { RequestExtensions } from "~/middleware";
import { createDbProxy, DrizzleQuery } from "~/middleware";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

// First create the function call that owns all bootstrapping
const BOOTSTRAP_REQUEST_ID = 1;
const BOOTSTRAP_FUNCTION_CALL_ID = 1;

function generateModelsToInsert() {
  return MODEL_NAMES.map((name, index) => ({
    id: index + 1,
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
    functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
  }));
}

export async function root(extensions: RequestExtensions) {
  console.log("Starting root seeding...");

  const queries: DrizzleQuery[] = [];
  const dbWithProxy = createDbProxy(extensions.db, queries);

  // Create one request first since everything references it
  console.log("Creating request...");
  const requestToInsert = {
    id: BOOTSTRAP_REQUEST_ID,
    requestId: BOOTSTRAP_REQUEST_ID, // Points to itself as it's the root request
    functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
  };
  const insertedRequest = await dbWithProxy.insert(requests).values(requestToInsert).returning();
  console.log("Inserted request:", insertedRequest);

  // Insert root function next
  console.log("Creating root function...");
  const [rootFunction] = await dbWithProxy
    .insert(serverFunctions)
    .values({
      name: "root",
      type: ServerFunctionType.SYSTEM,
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID,
      metadata: {
        label: "Root",
        variant: "default" as ButtonVariant,
      },
    })
    .returning();
  console.log("Inserted root function:", rootFunction);

  // Create a function call
  const [functionCall] = await dbWithProxy
    .insert(functionCalls)
    .values({
      serverFunctionId: rootFunction.id,
      status: FunctionCallStatus.COMPLETED,
      functionCallId: BOOTSTRAP_FUNCTION_CALL_ID, // Root function call points to itself
      args: null,
      result: null,
    })
    .returning();

  // Now we can create models
  const modelsToInsert = generateModelsToInsert();
  console.log("Inserting models:", modelsToInsert);
  const insertedModels = await dbWithProxy.insert(models).values(modelsToInsert).returning();
  console.log("Inserted models:", insertedModels);

  // Create objects for models AND request
  console.log("Creating objects...");
  const objectsToInsert = [
    // Objects for the model records in the models table
    ...insertedModels.map((model) => ({
      modelId: 7, // models model ID
      recordId: model.id,
      functionCallId: functionCall.id,
    })),
    // Object for the request itself
    {
      modelId: 6, // requests model ID
      recordId: insertedRequest[0].id,
      functionCallId: functionCall.id,
    },
    // Object for root function
    {
      modelId: 3, // server_functions model ID
      recordId: rootFunction.id,
      functionCallId: functionCall.id,
    },
    // Object for function call
    {
      modelId: 4, // function_calls model ID
      recordId: functionCall.id,
      functionCallId: functionCall.id,
    },
  ];

  const insertedObjects = await dbWithProxy.insert(objects).values(objectsToInsert).returning();
  console.log("Inserted objects:", insertedObjects);
  console.log("Total queries tracked:", queries.length);

  console.log("Root seeding completed successfully");
}
