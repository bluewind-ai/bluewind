// app/lib/action-middleware.server.ts

import { AsyncLocalStorage } from "async_hooks";
import { type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actions, actionCalls } from "~/db/schema";
import { RequireApprovalError } from "~/lib/errors";

type ActionCallNode = {
  name: string;
  id?: number;
  actionId?: number;
  children: ActionCallNode[];
  status: "running" | "ready_for_approval";
};

type ActionContext = {
  tree: ActionCallNode;
  hitCount: number;
};

const actionContext = new AsyncLocalStorage<ActionContext>();

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
  return actionContext.getStore();
}

export function withActionMiddleware(name: string, actionFn: ActionFunction): ActionFunction {
  return async (args) => {
    const currentContext = getActionContext();

    if (!currentContext) {
      // First call - initialize the tree
      const action = await getOrCreateAction(name);
      const rootNode: ActionCallNode = {
        name,
        children: [],
        status: "running",
        actionId: action.id,
      };

      // Create DB entry for this node
      const dbNode = await db
        .insert(actionCalls)
        .values({
          actionId: action.id,
          status: "running",
        })
        .returning();

      rootNode.id = dbNode[0].id;

      return await actionContext.run(
        {
          tree: rootNode,
          hitCount: 1,
        },
        () => actionFn(args),
      );
    }

    // Subsequent calls - add to existing tree
    const newNode: ActionCallNode = {
      name,
      children: [],
      status: "ready_for_approval",
      actionId: (await getOrCreateAction(name)).id,
    };

    // Create DB entry with parent reference
    const dbNode = await db
      .insert(actionCalls)
      .values({
        actionId: newNode.actionId!,
        parentId: currentContext.tree.id,
        status: "ready_for_approval",
      })
      .returning();

    newNode.id = dbNode[0].id;
    currentContext.tree.children.push(newNode);
    currentContext.hitCount++;

    if (currentContext.hitCount === 2) {
      throw new RequireApprovalError();
    }

    return actionFn(args);
  };
}
