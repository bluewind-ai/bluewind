// app/lib/action-middleware.server.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";

export type ActionCallNode = typeof actionCalls.$inferSelect;
export type Action = typeof actions.$inferSelect;

export type ActionContext = {
  currentNode: ActionCallNode;
};

const contextStore = new AsyncLocalStorage<ActionContext>();

export function withActionMiddleware(name: string, actionFn: ActionFunction): ActionFunction {
  return async (args) => {
    const context = contextStore.getStore();
    if (!context) {
      throw new Error("Action context not initialized");
    }

    try {
      const result = await actionFn(args);
      await db
        .update(actionCalls)
        .set({ status: "completed" })
        .where({ id: context.currentNode.id });
      return result;
    } catch (error) {
      if (error.name === "SuspendForApproval") {
        // Create the next action call record
        const nextActionCall = await db
          .insert(actionCalls)
          .values({
            actionId: error.nextActionId,
            parentId: context.currentNode.id,
            status: "ready_for_approval",
            savedInput: error.args,
          })
          .returning();

        return {
          status: "ready_for_approval",
          nextActionCall: nextActionCall[0],
        };
      }
      throw error;
    }
  };
}

export function suspend(nextActionId: Action["id"], args?: any) {
  const error = new Error("Action suspended for approval");
  error.name = "SuspendForApproval";
  error.nextActionId = nextActionId;
  error.args = args;
  throw error;
}

export async function executeAction(args: ActionFunctionArgs) {
  const { wrappedActions } = await import("~/lib/wrapped-actions.server");
  const actionName = args.params.name as keyof typeof wrappedActions;

  if (!(actionName in wrappedActions)) {
    throw new Response(`Action ${actionName} not found`, { status: 404 });
  }

  const action = await db.query.actions.findFirst({
    where: (fields, { eq }) => eq(fields.name, actionName),
  });

  if (!action) {
    throw new Error(`Action ${actionName} not found in database`);
  }

  const rootCall = await db
    .insert(actionCalls)
    .values({
      actionId: action.id,
      status: "ready_for_approval",
    })
    .returning();

  return await runInActionContext(
    {
      currentNode: rootCall[0],
    },
    () => wrappedActions[actionName](args),
  );
}
