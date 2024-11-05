// app/lib/action-middleware.ts

import { type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";

type Context = {
  startTime?: number;
};

export function withActionMiddleware(
  action: ActionFunction,
  context: Context = {},
): ActionFunction {
  return async (args) => {
    return await db.transaction(async (tx) => {
      const actionName = action.name;

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
      // Removed the try/catch so dd() can work as expected
      return await action(args);
    });
  };
}
