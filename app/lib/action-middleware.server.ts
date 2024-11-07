// app/lib/action-middleware.server.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction, type AppLoadContext } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { RequireApprovalError } from "~/lib/errors";

type Context = {
  startTime?: number;
  hitCount?: number;
};

type ActionContextWithActions = AppLoadContext & {
  actions?: Record<string, unknown>;
};

const hitCounter = new AsyncLocalStorage<number>();
const parentActionCallId = new AsyncLocalStorage<number>();

async function getOrCreateAction(
  functionName: string,
  actionMap: Record<string, unknown> | undefined,
) {
  console.log("==== Action Map Debug ====");
  console.log("Function name:", functionName);
  console.log("Action map received:", actionMap);
  console.log("Action map type:", typeof actionMap);
  if (actionMap) {
    console.log("Action map keys:", Object.keys(actionMap));
    console.log("Action map prototype:", Object.getPrototypeOf(actionMap));
  }
  console.log("========================");

  if (!actionMap) {
    console.log("Action map is undefined!");
    return null;
  }

  // Find the kebab-case name from the action map
  const kebabName =
    Object.entries(actionMap).find(([_, fn]) => fn === functionName)?.[0] || functionName;

  console.log("Found kebab name:", kebabName);

  let existingAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, kebabName),
  });

  if (!existingAction) {
    console.log("Creating action:", kebabName);
    const newAction = await db
      .insert(actions)
      .values({
        name: kebabName,
      })
      .returning();
    existingAction = newAction[0];
    console.log("Created action:", existingAction);
  }

  return existingAction;
}

export function withActionMiddleware(
  action: ActionFunction,
  context: Context = {},
): ActionFunction {
  return async ({ request, params, context: actionContext }) => {
    console.log("==== Middleware Context Debug ====");
    console.log("Action name:", action.name);
    console.log("Context received:", actionContext);
    console.log("Context keys:", Object.keys(actionContext || {}));
    console.log("Actions property:", (actionContext as ActionContextWithActions).actions);
    console.log("===============================");

    const currentCount = (hitCounter.getStore() || 0) + 1;

    return await hitCounter.run(currentCount, async () => {
      const actionName = action.name;
      console.log("Action function name:", actionName);
      console.log("Action function:", action.toString());
      context.hitCount = currentCount;
      console.log(`Middleware hit count: ${currentCount}`);

      const existingAction = await getOrCreateAction(
        actionName,
        (actionContext as ActionContextWithActions).actions,
      );

      if (!existingAction) {
        console.log("No existing action found and couldn't create one");
        return null;
      }

      if (currentCount === 2) {
        console.log("Recording approval request");

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