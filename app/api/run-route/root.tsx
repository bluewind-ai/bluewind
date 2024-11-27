// app/api/run-route/root.tsx

import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { objects } from "~/db/schema";
import { models } from "~/db/schema/models/schema";
import { requests } from "~/db/schema/requests/schema";
import { serverFunctions } from "~/db/schema/server-functions/schema";
import { TABLES } from "~/db/schema/table-models";
import { getCurrentLocation } from "~/lib/location-tracker";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  try {
    console.log("[root route] Starting...");
    console.log("[Current Location]:", getCurrentLocation());
    console.log("Calling reset factory...");

    const parentRequestId = c.req.header("X-Parent-Request-Id");

    // 1. Create root request first
    const [rootRequest] = await db
      .insert(requests)
      .values({
        requestId: parentRequestId ? parseInt(parentRequestId) : null,
        pathname: "/",
        createdLocation: getCurrentLocation(),
      })
      .returning();

    // 2. Check existing models and create only missing ones
    const existingModels = await db.select().from(models);
    const existingModelNames = new Set(existingModels.map((m) => m.pluralName));

    const missingModels = Object.entries(TABLES)
      .filter(([_, config]) => !existingModelNames.has(config.modelName))
      .map(([_, config]) => ({
        pluralName: config.modelName,
        singularName: config.modelName.slice(0, -1),
        requestId: rootRequest.id,
        createdLocation: getCurrentLocation(),
      }));

    console.log("[root route] Existing models:", existingModels.length);
    console.log("[root route] Missing models to create:", missingModels.length);

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

    console.log("[root route] Existing root function:", existingRootFunction.length > 0);

    let rootServerFunction;
    if (existingRootFunction.length === 0) {
      [rootServerFunction] = await db
        .insert(serverFunctions)
        .values({
          name: "root",
          type: "SYSTEM",
          requestId: rootRequest.id,
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
    const objectsToCreate = [
      // Root request object
      {
        modelId: requestModel.id,
        recordId: rootRequest.id,
        requestId: rootRequest.id,
        createdLocation: getCurrentLocation(),
      },
      // Root server function object - only if we created a new one
      ...(existingRootFunction.length === 0
        ? [
            {
              modelId: serverFunctionModel.id,
              recordId: rootServerFunction.id,
              requestId: rootRequest.id,
              createdLocation: getCurrentLocation(),
            },
          ]
        : []),
      // Model objects for newly created models only
      ...insertedModels.map((model) => ({
        modelId: modelsModel.id,
        recordId: model.id,
        requestId: rootRequest.id,
        createdLocation: getCurrentLocation(),
      })),
    ];

    if (objectsToCreate.length > 0) {
      await db.insert(objects).values(objectsToCreate);
    }

    // 5. Create the reset factory route request
    const resetFactoryResponse = await fetch("http://localhost:5173/api/routes", {
      method: "POST",
      body: JSON.stringify({
        prompt: "I need you to be able to perform a reset factory",
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Parent-Request-Id": rootRequest.id.toString(),
      },
    });

    if (!resetFactoryResponse.ok) {
      throw new Error("Failed to create reset factory route");
    }

    console.log("Calling ingest company data...");
    const ingestResponse = await fetch("http://localhost:5173/api/run-route/ingest-company-data", {
      method: "POST",
      headers: {
        "X-Parent-Request-Id": rootRequest.id.toString(),
      },
    });

    if (!ingestResponse.ok) {
      throw new Error("Failed to ingest company data");
    }

    console.log("Calling store cassette...");
    const res = await fetch("http://localhost:5173/api/run-route/store-cassette", {
      method: "POST",
      headers: {
        "X-Parent-Request-Id": rootRequest.id.toString(),
      },
    });
    console.log("Store cassette result:", await res.json());

    return c.redirect(`/requests/${rootRequest.id}`);
  } catch (error) {
    console.error("[root route] Error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
