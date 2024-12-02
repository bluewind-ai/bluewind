// app/api/setup/index.tsx

import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { serverFunctions } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import { fetchWithContext } from "~/lib/fetch-with-context";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/api/setup/initialize", async (c) => {
  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  const existingModels = await db.select().from(models);
  const existingModelNames = new Set(existingModels.map((m) => m.pluralName));
  const missingModels = Object.entries(TABLES)
    .filter(([_, config]) => !existingModelNames.has(config.modelName))
    .map(([_, config]) => ({
      pluralName: config.modelName,
      singularName: config.modelName.slice(0, -1),
      requestId: parseInt(parentRequestId),
      createdLocation: getCurrentLocation(),
    }));

  let insertedModels = [];
  if (missingModels.length > 0) {
    insertedModels = await db.insert(models).values(missingModels).returning();
  }

  const allModels = [...existingModels, ...insertedModels];
  const requestModel = allModels.find((m) => m.pluralName === TABLES.requests.modelName);
  const serverFunctionModel = allModels.find(
    (m) => m.pluralName === TABLES.serverFunctions.modelName,
  );
  const modelsModel = allModels.find((m) => m.pluralName === "models");

  if (!requestModel || !serverFunctionModel || !modelsModel) {
    throw new Error("Required models not found");
  }

  const existingRootFunction = await db
    .select()
    .from(serverFunctions)
    .where(eq(serverFunctions.name, "root"))
    .limit(1);

  let rootServerFunction;
  if (existingRootFunction.length === 0) {
    [rootServerFunction] = await db
      .insert(serverFunctions)
      .values({
        name: "root",
        type: "SYSTEM",
        requestId: parseInt(parentRequestId),
        metadata: {
          variant: "default",
          label: "Root",
          description: "Root server function",
        },
        createdLocation: getCurrentLocation(),
      })
      .returning();
  } else {
    rootServerFunction = existingRootFunction[0];
  }

  const objectsToCreate = [];
  if (existingRootFunction.length === 0) {
    objectsToCreate.push({
      modelId: serverFunctionModel.id,
      recordId: rootServerFunction.id,
      requestId: parseInt(parentRequestId),
      createdLocation: getCurrentLocation(),
    });
  }

  objectsToCreate.push(
    ...insertedModels.map((model) => ({
      modelId: modelsModel.id,
      recordId: model.id,
      requestId: parseInt(parentRequestId),
      createdLocation: getCurrentLocation(),
    })),
  );

  if (objectsToCreate.length > 0) {
    await db.insert(objects).values(objectsToCreate);
  }

  const loadRoutesResponse = await fetchWithContext(c)("http://localhost:5173/api/load-routes", {
    method: "POST",
  });

  if (!loadRoutesResponse.ok) {
    throw new Error("Failed to load routes");
  }

  // const testRouteResponse = await fetchWithContext(c)("http://localhost:5173/api/test-route", {
  //   method: "POST",
  // });

  // if (!testRouteResponse.ok) {
  //   throw new Error("Failed to test route");
  // }

  return c.json({ success: true });
});

export default app;
