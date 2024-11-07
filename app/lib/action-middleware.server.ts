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

export function withActionMiddleware(
  action: ActionFunction,
  context: Context = {},
): ActionFunction {
  return async ({ request, params, context: actionContext }) => {
    const currentCount = (hitCounter.getStore() || 0) + 1;

    return await hitCounter.run(currentCount, async () => {
      return await db.transaction(async (tx) => {
        const actionName = action.name;
        context.hitCount = currentCount;
        console.log(`Middleware hit count: ${currentCount}`);

        if (currentCount === 2) {
          const existingAction = await tx.query.actions.findFirst({
            where: (fields, { eq }) => eq(fields.name, actionName),
          });

          if (existingAction) {
            await tx
              .insert(actionCalls)
              .values({
                actionId: existingAction.id,
                status: "ready_for_approval",
              })
              .returning();
          }

          throw new RequireApprovalError();
        }

        const actionCall = await tx.query.actionCalls.findMany({
          with: {
            action: true,
          },
          where: (fields, { eq }) =>
            eq(
              fields.actionId,
              tx
                .select({ id: actions.id })
                .from(actions)
                .where(eq(actions.name, actionName))
                .limit(1),
            ),
        });

        if (actionCall.length === 0) {
          const existingAction = await tx.query.actions.findFirst({
            where: (fields, { eq }) => eq(fields.name, actionName),
          });

          if (existingAction) {
            await tx
              .insert(actionCalls)
              .values({
                actionId: existingAction.id,
                status: "running",
              })
              .returning();
          }
        }

        context.startTime = Date.now();
        return await action({ request, params, context: actionContext });
      });
    });
  };
}

export function getMiddlewareHitCount(): number {
  return hitCounter.getStore() || 0;
}
