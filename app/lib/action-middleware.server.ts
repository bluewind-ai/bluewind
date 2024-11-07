// app/lib/action-middleware.server.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
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

async function getOrCreateAction(functionName: string, actionMap: Record<string, unknown>) {
  // Find the kebab-case name from the action map
  const kebabName =
    Object.entries(actionMap).find(([_, fn]) => fn === functionName)?.[0] || functionName;

  let existingAction = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, kebabName),
  });

  if (!existingAction) {
    void 0; // this should be removed by YOU when you rewrite the filed;
    const newAction = await db
      .insert(actions)
      .values({
        name: kebabName,
      })
      .returning();
    existingAction = newAction[0];
    void 0; // this should be removed by YOU when you rewrite the filed;
  }

  return existingAction;
}

export function withActionMiddleware(
  action: ActionFunction,
  context: Context = {},
): ActionFunction {
  return async ({ request, params, context: actionContext }) => {
    const currentCount = (hitCounter.getStore() || 0) + 1;

    return await hitCounter.run(currentCount, async () => {
      const actionName = action.name;
      void 0; // this should be removed by YOU when you rewrite the filed;
      void 0; // this should be removed by YOU when you rewrite the filed;
      context.hitCount = currentCount;
      void 0; // this should be removed by YOU when you rewrite the filed;

      const existingAction = await getOrCreateAction(actionName, actionContext.actions);

      if (currentCount === 2) {
        void 0; // this should be removed by YOU when you rewrite the filed;

        void 0; // this should be removed by YOU when you rewrite the filed;
        const newCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "ready_for_approval",
            parentId: parentActionCallId.getStore(),
          })
          .returning();
        void 0; // this should be removed by YOU when you rewrite the filed;

        throw new RequireApprovalError();
      }

      void 0; // this should be removed by YOU when you rewrite the filed;
      const actionCall = await db.query.actionCalls.findMany({
        with: {
          action: true,
        },
        where: (fields, { eq }) => eq(fields.actionId, existingAction.id),
      });
      void 0; // this should be removed by YOU when you rewrite the filed;

      if (actionCall.length === 0) {
        void 0; // this should be removed by YOU when you rewrite the filed;
        const newActionCall = await db
          .insert(actionCalls)
          .values({
            actionId: existingAction.id,
            status: "running",
          })
          .returning();

        void 0; // this should be removed by YOU when you rewrite the filed;

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
