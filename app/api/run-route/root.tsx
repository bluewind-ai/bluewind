// app/api/run-route/root.tsx

import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { functionCalls, objects } from "~/db/schema";
import { FunctionCallStatus } from "~/db/schema/function-calls/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ButtonVariant } from "~/lib/server-functions-types";
import { db } from "~/middleware/main";

const MODEL_NAMES = Object.keys(TABLES) as (keyof typeof TABLES)[];

function generateModelsToInsert() {
  return MODEL_NAMES.map((name) => ({
    pluralName: TABLES[name].modelName,
    singularName: TABLES[name].modelName.slice(0, -1),
  }));
}

const app = new Hono();

app.post("/api/run-route/root", async (c) => {
  console.log("[root route] Starting bootstrap...");

  const [insertedRequest] = await db
    .insert(requests)
    .values({
      requestId: 0,
      functionCallId: 1,
      pathname: new URL(c.req.url).pathname,
    })
    .returning();

  await db
    .update(requests)
    .set({ requestId: insertedRequest.id })
    .where(sql`${requests.id} = ${insertedRequest.id}`);

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

  const modelsToInsert = generateModelsToInsert().map((model) => ({
    ...model,
    requestId: insertedRequest.id,
    functionCallId: functionCall.id,
  }));
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();

  const allObjects = [
    {
      modelId: insertedModels.find((m) => m.pluralName === "requests")!.id,
      recordId: insertedRequest.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    },

    {
      modelId: insertedModels.find((m) => m.pluralName === "server_functions")!.id,
      recordId: rootFunction.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    },

    {
      modelId: insertedModels.find((m) => m.pluralName === "function_calls")!.id,
      recordId: functionCall.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    },

    ...insertedModels.map((model) => ({
      modelId: insertedModels.find((m) => m.pluralName === "models")!.id,
      recordId: model.id,
      requestId: insertedRequest.id,
      functionCallId: functionCall.id,
    })),
  ];

  await db.insert(objects).values(allObjects).returning();

  console.log("[root route] Bootstrap completed");
  return c.json({ success: true, requestId: insertedRequest.id });
});

export type RootRouteType = typeof app;
export default app;
