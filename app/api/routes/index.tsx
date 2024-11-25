// app/api/routes/index.tsx

import { Hono } from "hono";

import { serverFunctions, ServerFunctionType } from "~/db/schema/server-functions/schema";
import type { ButtonVariant } from "~/lib/server-functions-types";
import { db } from "~/middleware/main";

const app = new Hono();

app.post("/api/routes", async (c) => {
  console.log("[routes api endpoint] Starting route creation...");
  const body = await c.req.json();
  const userInput = body.prompt;

  if (
    userInput.toLowerCase().includes("factory reset") ||
    userInput.toLowerCase().includes("defect")
  ) {
    try {
      const [truncateFunction] = await db
        .insert(serverFunctions)
        .values({
          name: "truncate",
          type: ServerFunctionType.SYSTEM,
          metadata: {
            label: "Factory Reset",
            description: "Reset the entire database to factory settings",
            variant: "destructive" as ButtonVariant,
            confirmationRequired: true,
            confirmationMessage: "This will delete all data. Are you sure?",
          },
        })
        .returning();

      console.log("[routes api endpoint] Created truncate function:", truncateFunction);
      return c.json({
        success: true,
        message: "Created truncate route",
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
