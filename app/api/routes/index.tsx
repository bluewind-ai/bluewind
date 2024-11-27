// app/api/routes/index.tsx

import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { objects } from "~/db/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import { getCurrentLocation } from "~/lib/location-tracker";
import type { ButtonVariant } from "~/lib/server-functions-types";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/", async (c) => {
  console.log("[routes api endpoint] Starting route creation...");
  const body = await c.req.json();
  const userInput = body.prompt;

  if (userInput === "I need you to be able to perform a reset factory") {
    try {
      const [currentRequest] = await db.query.requests.findMany({
        where: (requests, { eq }) => eq(requests.pathname, "/api/routes"),
        orderBy: (requests, { desc }) => [desc(requests.id)],
        limit: 1,
      });

      console.log("[routes api endpoint] Found current request:", currentRequest);

      const [serverFunctionsModel] = await db.query.models.findMany({
        where: (models, { eq }) => eq(models.pluralName, "server_functions"),
        limit: 1,
      });

      // Check if reset-factory function already exists
      const existingFunction = await db
        .select()
        .from(serverFunctions)
        .where(eq(serverFunctions.name, "reset-factory"))
        .limit(1);

      console.log("[routes api endpoint] Existing reset-factory:", existingFunction.length > 0);

      let truncateFunction;
      if (existingFunction.length === 0) {
        [truncateFunction] = await db
          .insert(serverFunctions)
          .values({
            name: "reset-factory",
            type: ServerFunctionType.SYSTEM,
            requestId: currentRequest.id,
            functionCallId: currentRequest.functionCallId,
            createdLocation: getCurrentLocation(),
            metadata: {
              label: "Factory Reset",
              description: "Reset the entire database to factory settings",
              variant: "destructive" as ButtonVariant,
              confirmationRequired: true,
              confirmationMessage: "This will delete all data. Are you sure?",
            },
          })
          .returning();

        // Only create object if we created a new function
        await db.insert(objects).values({
          modelId: serverFunctionsModel.id,
          recordId: truncateFunction.id,
          requestId: currentRequest.id,
          functionCallId: currentRequest.functionCallId,
          createdLocation: getCurrentLocation(),
        });

        console.log("[routes api endpoint] Created truncate function:", truncateFunction);
      } else {
        truncateFunction = existingFunction[0];
        console.log("[routes api endpoint] Using existing truncate function:", truncateFunction);
      }

      return c.json({
        success: true,
        message:
          existingFunction.length > 0
            ? "Using existing reset-factory route"
            : "Created reset-factory route",
        function: truncateFunction,
      });
    } catch (error) {
      console.error("[routes api endpoint] Error creating route:", error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error creating route",
        },
        500,
      );
    }
  }

  return c.json(
    {
      success: false,
      error: "Could not determine appropriate route from input",
    },
    400,
  );
});

export type RoutesRouteType = typeof app;
export default app;
