// app/lib/action-middleware.server.ts

import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { RequireApprovalError } from "~/lib/errors";

type Context = {
  startTime?: number;
  hitCount?: number;
};

const hitCounter = new AsyncLocalStorage<number>();
const parentActionCallId = new AsyncLocalStorage<number>();

export function withActionMiddleware(
  action: ActionFunction,
  context: Context = {},
): ActionFunction {
  return async ({ request, params, context: actionContext }) => {
    const currentCount = (hitCounter.getStore() || 0) + 1;

    return await hitCounter.run(currentCount, async () => {
      const actionName = action.name;
      console.log("Action function name:", actionName);
      console.log("Action function:", action);
      context.hitCount = currentCount;
      console.log(`Middleware hit count: ${currentCount}`);

      let existingAction = await db.query.actions.findFirst({
        where: (fields, { eq }) => eq(fields.name, actionName),
      });

      if (!existingAction) {
        console.log("Creating action:", actionName);
        const newAction = await db
          .insert(actions)
          .values({
            name: actionName,
          })
          .returning();
        existingAction = newAction[0];
        console.log("Created action:", existingAction);
      }

      if (currentCount === 2) {
        console.log(`Recording approval request for ${actionName}`);

        console.log("Creating approval request...");
        const newCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "ready_for_approval",
            parentId: parentActionCallId.getStore(),
          })
          .returning();
        console.log("Created approval request:", newCall[0]);

        throw new RequireApprovalError();
      }

      console.log("Looking for existing action calls...");
      const actionCall = await db.query.actionCalls.findMany({
        with: {
          action: true,
        },
        where: (fields, { eq }) => eq(fields.actionId, existingAction.id),
      });
      console.log("Found action calls:", actionCall);

      if (actionCall.length === 0) {
        console.log("Creating initial action call...");
        const newActionCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "running",
          })
          .returning();

        console.log("Created initial action call:", newActionCall[0]);

        await parentActionCallId.run(newActionCall[0].id, async () => {
          context.startTime = Date.now();
          return await action({ request, params, context: actionContext });
        });
      }

      context.startTime = Date.now();
      return await action({ request, params, context: actionContext });
    });
  };
}

export function getMiddlewareHitCount(): number {
  return hitCounter.getStore() || 0;
}
