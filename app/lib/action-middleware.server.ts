// app/lib/action-middleware.server.ts

import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { RequireApprovalError } from "~/lib/errors";
import { actions as rawActions } from "./generated/actions";

export type ActionCallNode = {
  name: string;
  id?: number;
  actionId?: number;
  children: ActionCallNode[];
  status: "running" | "ready_for_approval";
};

export type ActionContext = {
  tree: ActionCallNode;
  hitCount: number;
};

const contextStore = new AsyncLocalStorage<ActionContext>();

async function getOrCreateAction(functionName: string) {
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
  }

  return existingAction;
}

export function getActionContext(): ActionContext | undefined {
  return contextStore.getStore();
}

export const runInActionContext = contextStore.run.bind(contextStore);

export function withActionMiddleware(name: string, actionFn: ActionFunction): ActionFunction {
  return async (args) => {
    const context = getActionContext();

    if (!context) {
      throw new Error("Action context not initialized");
    }

    console.log("Current tree:", context.tree);
    context.hitCount++;

    if (context.hitCount === 1) {
      const action = await getOrCreateAction(name);
      const dbNode = await db
        .insert(actionCalls)
        .values({
          actionId: action.id,
          status: "running",
        })
        .returning();

      context.tree.id = dbNode[0].id;
      context.tree.actionId = action.id;

      return actionFn(args);
    }

    if (context.hitCount === 2) {
      const action = await getOrCreateAction(name);
      const newNode: ActionCallNode = {
        name,
        children: [],
        status: "ready_for_approval",
        actionId: action.id,
      };

      const dbNode = await db
        .insert(actionCalls)
        .values({
          actionId: action.id,
          parentId: context.tree.id,
          status: "ready_for_approval",
        })
        .returning();

      newNode.id = dbNode[0].id;
      context.tree.children.push(newNode);

      throw new RequireApprovalError();
    }

    return actionFn(args);
  };
}

// Pre-wrap all actions with middleware
export const wrappedActions = Object.fromEntries(
  Object.entries(rawActions).map(([name, fn]) => [
    name,
    withActionMiddleware(name, (args) => fn(args)),
  ]),
) as typeof rawActions;
