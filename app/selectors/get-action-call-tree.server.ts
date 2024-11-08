// app/selectors/get-action-call-tree.server.ts

import { createAction } from "~/lib/action-builder.server";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";

interface ActionCallTree {
  id: number;
  parentId: number | null;
  status: string;
  actionName: string;
  children: ActionCallTree[];
}

export const getActionCallTree = createAction(
  "get-action-call-tree",
  async () => {
    const allCalls = await db.query.actionCalls.findMany({
      with: {
        action: true,
      },
      orderBy: (actionCalls, { asc }) => [asc(actionCalls.id)],
    });

    // Get last action call as entry point
    const lastCall = allCalls[allCalls.length - 1];
    if (!lastCall) {
      throw new Error("No action calls found");
    }

    // Find root
    let rootId = lastCall.id;
    let currentParentId: number | null = lastCall.parentId;

    while (currentParentId) {
      const parent = await db.query.actionCalls.findFirst({
        where: eq(actionCalls.id, currentParentId),
        with: {
          action: true,
        },
      });
      if (!parent) break;
      rootId = parent.id;
      currentParentId = parent.parentId;
    }

    function buildTree(rootId: number): ActionCallTree | null {
      const call = allCalls.find((c) => c.id === rootId);
      if (!call) return null;

      const children = allCalls
        .filter((c) => c.parentId === call.id)
        .map((child) => buildTree(child.id))
        .filter((child): child is ActionCallTree => child !== null);

      return {
        id: call.id,
        parentId: call.parentId,
        status: call.status,
        actionName: call.action.name,
        children,
      };
    }

    const tree = buildTree(rootId);
    if (!tree) {
      throw new Error("Could not build tree");
    }

    return {
      tree,
      currentId: lastCall.id,
    };
  },
  { type: "selector" },
);
