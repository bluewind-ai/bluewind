// app/routes/action-calls.$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Main } from "~/components/Main";

async function buildActionCallTree(rootId: number) {
  // First get all action calls that could be part of this tree
  const allCalls = await db.query.actionCalls.findMany({
    with: { action: true },
  });

  console.log("[buildActionCallTree] Found all calls:", allCalls);

  // Find the root call
  const rootCall = allCalls.find((call) => call.id === rootId);
  if (!rootCall) return null;

  // Recursive function to build tree
  function buildTree(call: typeof rootCall) {
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
  });

  if (!currentCall) {
    throw new Response("Action call not found", { status: 404 });
  }

  // Find the root of the tree
  let rootId = id;
  if (currentCall.parentId) {
    let parentId = currentCall.parentId;
    while (parentId) {
      const parent = await db.query.actionCalls.findFirst({
        where: eq(actionCalls.id, parentId),
      });
      if (!parent) break;
      rootId = parent.id;
      parentId = parent.parentId;
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

export const action: ActionFunction = async ({ params }) => {
  console.log("[action] Starting with params:", params);

  if (!params.id || isNaN(Number(params.id))) {
    return json({ error: "Invalid ID" }, { status: 400 });
  }

  const id = parseInt(params.id);

  await db.update(actionCalls).set({ status: "completed" }).where(eq(actionCalls.id, id));
  console.log("[action] Updated actionCall status to completed for id:", id);

  return json({ success: true });
};

export default function Route() {
  const data = useLoaderData<typeof loader>();
  console.log("[Route] Rendering with full tree data:", data);

  return <Main data={data} buttonLabel="Next" />;
}
