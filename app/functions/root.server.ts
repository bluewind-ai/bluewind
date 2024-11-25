// app/functions/root.server.ts

import { sql } from "drizzle-orm";

import { functionCalls, objects } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";
import type { ExtendedContext } from "~/middleware";
import { db } from "~/middleware/main";

import { master } from "./master.server";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

function generateModelsToInsert() {
  return MODEL_NAMES.map((name) => ({
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
  }));
}

export async function root(c: ExtendedContext) {
  // First create request
  const [insertedRequest] = await db
    .insert(requests)
    .values({
      requestId: 0,
      functionCallId: 1,
      pathname: new URL(c.req.url).pathname,
    })
    .returning();

  // Update request to point to itself
  await db
    .update(requests)
    .set({ requestId: insertedRequest.id })
    .where(sql`${requests.id} = ${insertedRequest.id}`);

  // Create server function
  const [rootFunction] = await db
    .insert(serverFunctions)
    .values({
      name: "root",
      type: ServerFunctionType.SYSTEM,
      requestId: insertedRequest.id,
      functionCallId: 1,
      metadata: {
        label: "Root",
        variant: "default" as ButtonVariant,
      },
    })
    .returning();

  // Create the actual function call
  const [functionCall] = await db
    .insert(functionCalls)
    .values({
      id: 1,
      serverFunctionId: rootFunction.id,
      status: FunctionCallStatus.COMPLETED,
      requestId: insertedRequest.id,
      functionCallId: 1,
      args: null,
      result: null,
    })
    .returning();

  // Create models
  const modelsToInsert = generateModelsToInsert().map((model) => ({
    ...model,
    requestId: insertedRequest.id,
    functionCallId: functionCall.id,
  }));
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();

  // Create objects for everything
  const allObjects = [
    // Request object
    {
      modelId: insertedModels.find((m) => m.pluralName === "requests")!.id,
      recordId: insertedRequest.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    },
    // Server function object
    {
      modelId: insertedModels.find((m) => m.pluralName === "server_functions")!.id,
      recordId: rootFunction.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    },
    // Function call object
    {
      modelId: insertedModels.find((m) => m.pluralName === "function_calls")!.id,
      recordId: functionCall.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    },
    // Model objects
    ...insertedModels.map((model) => ({
      modelId: insertedModels.find((m) => m.pluralName === "models")!.id,
      recordId: model.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    })),
  ];

  await db.insert(objects).values(allObjects).returning();

  // Set context for subsequent operations
  c.requestId = insertedRequest.id;
  c.functionCallId = functionCall.id;

  // Only after everything is set up, call master
  const response = await client["run-route"]["load-csv"].$post();

  await master(c);
}
