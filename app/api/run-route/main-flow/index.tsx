// app/api/run-route/main-flow/index.tsx

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

app.post("/", async (c) => {
  console.log("[main-flow] Starting...");
  console.log("[Current Location]:", getCurrentLocation());

  const parentRequestId = c.req.header("X-Parent-Request-Id");
  if (!parentRequestId) {
    throw new Error("No parent request ID provided");
  }

  // 2. Check existing models and create only missing ones
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

  console.log("[main-flow] Existing models:", existingModels.length);
  console.log("[main-flow] Missing models to create:", missingModels.length);

  let insertedModels = [];
  if (missingModels.length > 0) {
    insertedModels = await db.insert(models).values(missingModels).returning();
  }

  // Combine existing and newly inserted models
  const allModels = [...existingModels, ...insertedModels];

  const requestModel = allModels.find((m) => m.pluralName === TABLES.requests.modelName);
  const serverFunctionModel = allModels.find(
    (m) => m.pluralName === TABLES.serverFunctions.modelName,
  );
  const modelsModel = allModels.find((m) => m.pluralName === "models");

  if (!requestModel || !serverFunctionModel || !modelsModel) {
    throw new Error("Required models not found");
  }

  // 3. Check if root server function exists and create if it doesn't
  const existingRootFunction = await db
    .select()
    .from(serverFunctions)
    .where(eq(serverFunctions.name, "root"))
    .limit(1);

  console.log("[main-flow] Existing root function:", existingRootFunction.length > 0);

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

  // 4. Create all objects
  const objectsToCreate = [];

  // Root server function object - only if we created a new one
  if (existingRootFunction.length === 0) {
    objectsToCreate.push({
      modelId: serverFunctionModel.id,
      recordId: rootServerFunction.id,
      requestId: parseInt(parentRequestId),
      createdLocation: getCurrentLocation(),
    });
  }

  // Model objects for newly created models only
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

  // 5. Create the reset factory route request - using fetchWithContext
  const resetFactoryResponse = await fetchWithContext(c)("http://localhost:5173/api/routes", {
    method: "POST",
    body: JSON.stringify({
      prompt: "I need you to be able to perform a reset factory",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!resetFactoryResponse.ok) {
    throw new Error("Failed to create reset factory route");
  }

  console.log("Calling ingest company data...");
  const ingestResponse = await fetchWithContext(c)(
    "http://localhost:5173/api/run-route/ingest-company-data",
    {
      method: "POST",
    },
  );

  if (!ingestResponse.ok) {
    throw new Error("Failed to ingest company data");
  }

  console.log("Calling test route...");
  const testResponse = await fetchWithContext(c)("http://localhost:5173/api/test-route", {
    method: "POST",
  });

  if (!testResponse.ok) {
    throw new Error("Failed to call test route");
  }

  return c.json({ success: true });
});

export default app;
