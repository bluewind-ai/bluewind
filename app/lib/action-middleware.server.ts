// app/lib/action-middleware.server.ts

import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { RequireApprovalError } from "~/lib/errors";
import { actions as actionMap } from "~/lib/generated/actions";

const hitCounter = new AsyncLocalStorage<number>();
const parentCallId = new AsyncLocalStorage<number>();

async function getOrCreateAction(functionName: string) {
  console.log("==== Action Debug ====");
  console.log("Function name:", functionName);
  console.log("Action map:", actionMap);
  console.log("==================");

  let existingAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, functionName),
  });

  if (!existingAction) {
    console.log("Creating action:", functionName);
    const newAction = await db
      .insert(actions)
      .values({
        name: functionName,
      })
      .returning();
    existingAction = newAction[0];
    console.log("Created action:", existingAction);
  }

  return existingAction;
}

export function withActionMiddleware(actionFn: ActionFunction): ActionFunction {
  return async ({ request, params, context: actionContext }) => {
    console.log("\n=== START MIDDLEWARE EXECUTION ===");
    console.log("Params:", params);
    console.log("Action name from params:", params.name);
    console.log("Initial parent call ID:", parentCallId.getStore());
    console.log("Initial hit count:", hitCounter.getStore());

    const currentCount = (hitCounter.getStore() || 0) + 1;
    console.log("New hit count will be:", currentCount);

    return await hitCounter.run(currentCount, async () => {
      console.log("\n=== INSIDE HIT COUNTER RUN ===");
      console.log("Hit count now:", hitCounter.getStore());
      console.log("Parent ID now:", parentCallId.getStore());

      const actionName = params.name;
      if (!actionName || !(actionName in actionMap)) {
        throw new Response(`Action ${actionName} not found`, { status: 404 });
      }

      const existingAction = await getOrCreateAction(actionName);

      if (!existingAction) {
        throw new Response(`Action ${actionName} not found in database`, { status: 404 });
      }

      if (currentCount === 1) {
        console.log("\n=== CREATING INITIAL ACTION CALL ===");
        const newActionCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "running",
          })
          .returning();

        console.log("Created action call:", newActionCall[0]);
        console.log("About to store parent ID:", newActionCall[0].id);

        return await parentCallId.run(newActionCall[0].id, async () => {
          console.log("\n=== INSIDE PARENT ID RUN ===");
          console.log("Stored parent ID is now:", parentCallId.getStore());
          console.log("Hit count is now:", hitCounter.getStore());
          const result = await actionFn({ request, params, context: actionContext });
          console.log("After action execution, parent ID is:", parentCallId.getStore());
          return result;
        });
      }

      if (currentCount === 2) {
        console.log("\n=== CREATING APPROVAL REQUEST ===");
        console.log("Current hit count:", hitCounter.getStore());
        console.log("Current parent ID:", parentCallId.getStore());

        const newCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "ready_for_approval",
            parentId: parentCallId.getStore() || null,
          })
          .returning();
        console.log("Created approval request:", newCall[0]);

        throw new RequireApprovalError();
      }

      console.log("\n=== EXECUTING NORMAL ACTION ===");
      console.log("Current hit count:", hitCounter.getStore());
      console.log("Current parent ID:", parentCallId.getStore());

      return await actionFn({ request, params, context: actionContext });
    });
  };
}

export function getMiddlewareHitCount(): number {
  return hitCounter.getStore() || 0;
}
