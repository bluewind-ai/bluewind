// app/api/routes/index.tsx

import { Hono } from "hono";

import { objects } from "~/db/schema";
import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
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

      // First get the server_functions model ID
      const [serverFunctionsModel] = await db.query.models.findMany({
        where: (models, { eq }) => eq(models.pluralName, "server_functions"),
        limit: 1,
      });

      const [truncateFunction] = await db
        .insert(serverFunctions)
        .values({
          name: "reset-factory",
          type: ServerFunctionType.SYSTEM,
          requestId: currentRequest.id,
          functionCallId: currentRequest.functionCallId,
          metadata: {
            label: "Factory Reset",
            description: "Reset the entire database to factory settings",
            variant: "destructive" as ButtonVariant,
            confirmationRequired: true,
            confirmationMessage: "This will delete all data. Are you sure?",
          },
        })
        .returning();

      // Create object for the new server function
      await db.insert(objects).values({
        modelId: serverFunctionsModel.id,
        recordId: truncateFunction.id,
        requestId: currentRequest.id,
        functionCallId: currentRequest.functionCallId,
      });

      console.log("[routes api endpoint] Created truncate function:", truncateFunction);
      return c.json({
        success: true,
        message: "Created reset-factory route",
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
