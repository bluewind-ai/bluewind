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
    console.log("==== Middleware Context Debug ====");
    console.log("Params:", params);
    console.log("Action name from params:", params.name);
    console.log("Current parent call ID:", parentCallId.getStore());
    console.log("===============================");

    const currentCount = (hitCounter.getStore() || 0) + 1;

    return await hitCounter.run(currentCount, async () => {
      const actionName = params.name;
      if (!actionName || !(actionName in actionMap)) {
        throw new Response(`Action ${actionName} not found`, { status: 404 });
      }

      console.log(`Middleware hit count: ${currentCount}`);

      const existingAction = await getOrCreateAction(actionName);

      if (!existingAction) {
        throw new Response(`Action ${actionName} not found in database`, { status: 404 });
      }

      if (currentCount === 1) {
        console.log("Creating initial action call...");
        const newActionCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "running",
          })
          .returning();

        console.log("Created initial action call:", newActionCall[0]);

        return await parentCallId.run(newActionCall[0].id, async () => {
          console.log("Storing parent call ID:", newActionCall[0].id);
          return await actionFn({ request, params, context: actionContext });
        });
      }

      if (currentCount === 2) {
        const parentId = parentCallId.getStore();
        console.log("Retrieved parent call ID for approval request:", parentId);

        const newCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "ready_for_approval",
            parentId: parentId || null,
          })
          .returning();
        console.log("Created approval request:", newCall[0]);

        throw new RequireApprovalError();
      }

      return await actionFn({ request, params, context: actionContext });
    });
  };
}

export function getMiddlewareHitCount(): number {
  return hitCounter.getStore() || 0;
}
