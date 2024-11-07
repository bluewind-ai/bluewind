// app/lib/action-middleware.server.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

export type ActionCallNode = typeof actionCalls.$inferSelect;
export type Action = typeof actions.$inferSelect;
export type ActionInsert = typeof actionCalls.$inferInsert;

export type ActionCallResult = {
  result: any;
  call: ActionCallNode;
  nextCall?: ActionCallNode;
  status: "completed" | "ready_for_approval";
};

export type ActionContext = {
  currentNode: ActionCallNode;
};

const contextStore = new AsyncLocalStorage<ActionContext>();

class SuspendError extends Error {
  constructor() {
    super("Action suspended for approval");
  }
}

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
        .set({ status: "completed", result })
        .where(eq(actionCalls.id, context.currentNode.id));

      return {
        result,
        call: context.currentNode,
        status: "completed",
      } satisfies ActionCallResult;
    } catch (error) {
      if (error instanceof SuspendError) {
        const insertData: ActionInsert = {
          actionId: context.currentNode.actionId,
          parentId: context.currentNode.id,
          status: "ready_for_approval",
          args,
        };

        const nextCall = await db.insert(actionCalls).values(insertData).returning();

        return {
          status: "ready_for_approval",
          call: context.currentNode,
          nextCall: nextCall[0],
        } satisfies ActionCallResult;
      }
      throw error;
    }
  };
}

export function suspend() {
  throw new SuspendError();
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

  const insertData: ActionInsert = {
    actionId: action.id,
    status: "ready_for_approval",
    args,
  };

  const rootCall = await db.insert(actionCalls).values(insertData).returning();

  return contextStore.run(
    {
      currentNode: rootCall[0],
    },
    () => wrappedActions[actionName](args),
  );
}
