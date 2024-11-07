// app/lib/action-middleware.server.ts

import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { RequireApprovalError } from "~/lib/errors";
import { actions as actionMap } from "~/lib/generated/actions";

type ActionContext = {
  hitCount: number;
  parentId: number | null;
};

const contextStore = new AsyncLocalStorage<ActionContext>();

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

    const currentContext = getMiddlewareContext();
    const nextContext: ActionContext = {
      hitCount: (currentContext?.hitCount || 0) + 1,
      parentId: currentContext?.parentId || null,
    };

    console.log("Current context:", currentContext);
    console.log("Next context:", nextContext);

    return await contextStore.run(nextContext, async () => {
      const actionName = params.name;
      if (!actionName || !(actionName in actionMap)) {
        throw new Response(`Action ${actionName} not found`, { status: 404 });
      }

      const existingAction = await getOrCreateAction(actionName);

      if (!existingAction) {
        throw new Response(`Action ${actionName} not found in database`, { status: 404 });
      }

      if (nextContext.hitCount === 1) {
        console.log("\n=== CREATING INITIAL ACTION CALL ===");
        const newActionCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "running",
          })
          .returning();

        console.log("Created action call:", newActionCall[0]);

        nextContext.parentId = newActionCall[0].id;
        return await actionFn({ request, params, context: actionContext });
      }

      if (nextContext.hitCount === 2) {
        console.log("\n=== CREATING APPROVAL REQUEST ===");
        console.log("Current context:", getMiddlewareContext());

        const newCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "ready_for_approval",
            parentId: nextContext.parentId,
          })
          .returning();
        console.log("Created approval request:", newCall[0]);

        throw new RequireApprovalError();
      }

      return await actionFn({ request, params, context: actionContext });
    });
  };
}

export function getMiddlewareContext(): ActionContext | undefined {
  return contextStore.getStore();
}

export function getMiddlewareHitCount(): number {
  return getMiddlewareContext()?.hitCount || 0;
}
