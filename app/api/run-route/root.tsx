// app/api/run-route/root.tsx

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

    // Get parent request ID from headers
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

    // 2. Create all models
    const modelsToInsert = Object.entries(TABLES).map(([_, config]) => ({
      pluralName: config.modelName,
      singularName: config.modelName.slice(0, -1),
      requestId: rootRequest.id,
      createdLocation: getCurrentLocation(),
    }));

    const insertedModels = await db.insert(models).values(modelsToInsert).returning();
    const requestModel = insertedModels.find((m) => m.pluralName === TABLES.requests.modelName);
    const serverFunctionModel = insertedModels.find(
      (m) => m.pluralName === TABLES.serverFunctions.modelName,
    );
    const modelsModel = insertedModels.find((m) => m.pluralName === "models");

    if (!requestModel || !serverFunctionModel || !modelsModel) {
      throw new Error("Required models not found");
    }

    // 3. Create the root server function
    const [rootServerFunction] = await db
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

    // 4. Create all objects
    const objectsToCreate = [
      // Root request object
      {
        modelId: requestModel.id,
        recordId: rootRequest.id,
        requestId: rootRequest.id,
        createdLocation: getCurrentLocation(),
      },
      // Root server function object
      {
        modelId: serverFunctionModel.id,
        recordId: rootServerFunction.id,
        requestId: rootRequest.id,
        createdLocation: getCurrentLocation(),
      },
      // Model objects
      ...insertedModels.map((model) => ({
        modelId: modelsModel.id,
        recordId: model.id,
        requestId: rootRequest.id,
        createdLocation: getCurrentLocation(),
      })),
    ];

    await db.insert(objects).values(objectsToCreate);

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
