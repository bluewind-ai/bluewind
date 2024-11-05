// app/actions/go-next.server.ts

import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { master } from "./master.server";

const actionMap = {
  master,
} as const;

export async function goNext(args: ActionFunctionArgs) {
  console.log("🟢 Starting goNext");

  // TEST ERROR - Remove this in production
  if (Math.random() > 0.5) {
    console.log("🔴 Throwing test error");
    throw new Error("Random test error to verify error handling!");
  }

  console.log("🟡 Fetching action call from DB");
  const currentActionCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, parseInt(args.params.id || "")),
    with: {
      action: true,
    },
  });
  console.log("🟡 Found action call:", currentActionCall);

  if (!currentActionCall) {
    console.log("🔴 Action call not found");
    throw new Response("Action call not found", { status: 404 });
  }

  if (currentActionCall.status === "ready_for_approval") {
    try {
      console.log("🟡 Action is ready for approval, executing...");
      const action = actionMap[currentActionCall.action.name as keyof typeof actionMap];
      const actionResult = await action(args);
      console.log("🟢 Action executed successfully:", actionResult);

      console.log("🟡 Updating action call status...");
      await db
        .update(actionCalls)
        .set({ status: "completed" })
        .where(eq(actionCalls.id, currentActionCall.id));
      console.log("🟢 Status updated successfully");

      const response = json({
        actionCall: currentActionCall,
        debugMessage: JSON.stringify(
          {
            type: "Success",
            message: "Action completed successfully",
            data: {
              actionResult,
              currentActionCall,
              status: "success",
            },
          },
          null,
          2,
        ),
      });
      console.log("🟢 Returning success response:", response);
      return response;
    } catch (error) {
      console.log("🔴 Error in action execution:", error);
      const debugInfo = {
        type: "Error",
        message: error instanceof Error ? error.message : "Unknown error",
        data: {
          error,
          currentActionCall,
          args,
        },
      };

      const response = json(
        {
          debugMessage: JSON.stringify(debugInfo, null, 2),
        },
        {
          status: 500,
        },
      );
      console.log("🔴 Returning error response:", response);
      return response;
    }
  }

  console.log("🟡 Action not ready for approval");
  const debugInfo = {
    type: "Error",
    message: `Action ${currentActionCall.id} is not ready for approval`,
    data: { currentActionCall },
  };

  const response = json(
    {
      debugMessage: JSON.stringify(debugInfo, null, 2),
    },
    {
      status: 400,
    },
  );
  console.log("🟡 Returning not-ready response:", response);
  return response;
}
