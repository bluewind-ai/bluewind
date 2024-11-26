// app/api/run-route/root.tsx

import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  // First, call the reset factory route
  console.log("Calling reset factory...");
  await fetch("http://localhost:5173/api/run-route/reset-factory", {
    method: "POST",
  });

  // Create models first so we have their IDs
  console.log("Creating models...");
  const modelsToInsert = Object.entries(TABLES).map(([_, config]) => ({
    pluralName: config.modelName,
    singularName: config.modelName.slice(0, -1),
    requestId: 0,
  }));
  const insertedModels = await db.insert(models).values(modelsToInsert).returning();

  // Create request for root action itself
  console.log("Creating root request...");
  const [insertedRequest] = await db
    .insert(requests)
    .values({
      requestId: 0,
      pathname: new URL(c.req.url).pathname,
    })
    .returning();

  // Update request to point to itself
  await db
    .update(requests)
    .set({ requestId: insertedRequest.id })
    .where(sql`${requests.id} = ${insertedRequest.id}`);

  // Update models with correct request ID
  await Promise.all(
    insertedModels.map((model) =>
      db
        .update(models)
        .set({ requestId: insertedRequest.id })
        .where(sql`${models.id} = ${model.id}`),
    ),
  );

  // Create server function
  console.log("Creating root server function...");
  const [rootFunction] = await db
    .insert(serverFunctions)
    .values({
      name: "root",
      type: ServerFunctionType.SYSTEM,
      requestId: insertedRequest.id,
      metadata: {
        label: "Start Here",
        description: "This is the root function that sets up the system",
        variant: "default",
      },
    })
    .returning();

  // Create objects for everything
  const requestsModel = insertedModels.find((m) => m.pluralName === "requests")!;
  const serverFunctionsModel = insertedModels.find((m) => m.pluralName === "server_functions")!;
  const modelsModel = insertedModels.find((m) => m.pluralName === "models")!;

  // Create object for request
  await db.insert(objects).values({
    modelId: requestsModel.id,
    recordId: insertedRequest.id,
    requestId: insertedRequest.id,
  });

  // Create object for server function
  await db.insert(objects).values({
    modelId: serverFunctionsModel.id,
    recordId: rootFunction.id,
    requestId: insertedRequest.id,
  });

  // Create objects for models
  await Promise.all(
    insertedModels.map((model) =>
      db.insert(objects).values({
        modelId: modelsModel.id,
        recordId: model.id,
        requestId: insertedRequest.id,
      }),
    ),
  );

  await fetch("http://localhost:5173/api/routes", {
    method: "POST",
    body: JSON.stringify({
      prompt: "I need you to be able to perform a reset factory",
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Parent-Request-Id": insertedRequest.id.toString(),
    },
  });

  return c.json({ requestId: insertedRequest.id });
});

export default app;
