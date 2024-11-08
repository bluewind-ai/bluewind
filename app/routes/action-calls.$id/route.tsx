// app/routes/action-calls.$id/route.tsx

import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type ActionCall = InferSelectModel<typeof actionCalls>;

interface ActionCallTree extends ActionCall {
  children: ActionCallTree[];
  action: {
    name: string;
  };
}

async function buildActionCallTree(rootId: number): Promise<ActionCallTree | null> {
  // Get all action calls with their associated actions using the proper relation
  const allCalls = await db.query.actionCalls.findMany({
    with: {
      action: true,
    },
  });

  console.log("[buildActionCallTree] Found all calls:", allCalls);

  // Find the root call
  const rootCall = allCalls.find((call) => call.id === rootId);
  if (!rootCall) return null;

  // Recursive function to build tree
  function buildTree(call: (typeof allCalls)[number]): ActionCallTree {
    const children = allCalls.filter((c) => c.parentId === call.id);
    return {
      ...call,
      children: children.map(buildTree),
    };
  }

  return buildTree(rootCall);
}

export const loader: LoaderFunction = async ({ params }) => {
  console.log("[loader] Starting with params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    throw new Response("Invalid ID", { status: 400 });
  }

  const id = parseInt(params.id);

  // First find the root action call for this tree
  const currentCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, id),
    with: {
      action: true,
    },
  });

  if (!currentCall) {
    throw new Response("Action call not found", { status: 404 });
  }

  // Find the root of the tree
  let rootId = id;
  if (currentCall.parentId) {
    let currentParentId: number | null = currentCall.parentId;
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
  }

  console.log("[loader] Found root ID:", rootId);

  // Build the complete tree
  const actionCallTree = await buildActionCallTree(rootId);
  console.log("[loader] Built action call tree:", actionCallTree);

  // Also mark which one is the current one we're looking at
  const enrichedTree = {
    tree: actionCallTree,
    currentId: id,
  };

  return json(enrichedTree);
};

// ... rest of the file stays the same ...
