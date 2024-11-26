// app/functions/root.server.ts

import { redirect } from "@remix-run/node";
import { sql } from "drizzle-orm";
import { hc } from "hono/client";

import type { RoutesRouteType } from "~/api/routes";
import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import type { ExtendedContext } from "~/middleware";
import { db } from "~/middleware/main";

const client = hc<RoutesRouteType>("http://localhost:5173");

export async function root(c: ExtendedContext) {
  // Create models first so we have their IDs
  console.log("Creating models...");
  const modelsToInsert = Object.entries(TABLES).map(([_, config]) => ({
    pluralName: config.modelName,
    singularName: config.modelName.slice(0, -1),
    requestId: 0, // We'll update this later
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

  c.requestId = insertedRequest.id;

  // Call the routes endpoint to create truncate function
  try {
    const response = await client.api.routes.$post({
      json: {
        prompt: "I need you to be able to perform a reset factory",
      },
      headers: {
        "X-Parent-Request-Id": insertedRequest.id.toString(),
      },
    });
    console.log("Routes response:", response);
  } catch (error) {
    console.error("Error calling routes endpoint:", error);
  }

  // Redirect to the request's page
  return redirect(`/requests/${insertedRequest.id}`);
}
