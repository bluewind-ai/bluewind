// app/selectors/get-function-call-tree.server.ts
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { functionCalls } from "~/db/schema";
import { createAction } from "~/lib/action-builder.server";

interface FunctionCallTree {
  id: number;
  parentId: number | null;
  status: string;
  actionName: string;
  children: FunctionCallTree[];
}
export const getFunctionCallTree = createAction("get-function-call-tree", async () => {
  const allCalls = await db.query.functionCalls.findMany({
    with: {
      action: true,
    },
    orderBy: (functionCalls, { asc }) => [asc(functionCalls.id)],
  });
  const lastCall = allCalls[allCalls.length - 1];
  if (!lastCall) {
    throw new Error("No function calls found");
  }
  let rootId = lastCall.id;
  let currentParentId: number | null = lastCall.parentId;
  while (currentParentId) {
    const parent = await db.query.functionCalls.findFirst({
      where: eq(functionCalls.id, currentParentId),
      with: {
        action: true,
      },
    });
    if (!parent) break;
    rootId = parent.id;
    currentParentId = parent.parentId;
  }
  function buildTree(rootId: number): FunctionCallTree | null {
    const call = allCalls.find((c) => c.id === rootId);
    if (!call) return null;
    const children = allCalls
      .filter((c) => c.parentId === call.id)
      .map((child) => buildTree(child.id))
      .filter((child): child is FunctionCallTree => child !== null);
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
});
