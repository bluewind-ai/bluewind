// app/routes/action-calls.$id/route.tsx

import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Main } from "~/components/Main";
import type { InferSelectModel } from "drizzle-orm";

type ActionCall = InferSelectModel<typeof actionCalls>;

interface ActionCallTree extends Omit<ActionCall, "actionId"> {
  children: ActionCallTree[];
  actionName: string;
}

type ActionCallWithAction = ActionCall & {
  action: {
    id: number;
    name: string;
  };
};

async function buildActionCallTree(rootId: number): Promise<ActionCallTree | null> {
  const allCalls = await db.query.actionCalls.findMany({
    with: {
      action: true,
    },
    orderBy: (actionCalls, { asc }) => [asc(actionCalls.id)],
  });

  console.log("[buildActionCallTree] Raw calls:", allCalls);

  const rootCall = allCalls.find((call) => call.id === rootId);
  if (!rootCall) return null;

  function buildTree(call: (typeof allCalls)[number]): ActionCallTree {
    const children = allCalls.filter((c) => c.parentId === call.id);
    return {
      id: call.id,
      parentId: call.parentId,
      status: call.status,
      args: call.args,
      result: call.result,
      createdAt: call.createdAt,
      actionName: call.action.name, // Here's the important part
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

  const currentCall = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.id, id),
    with: {
      action: true,
    },
  });

  if (!currentCall) {
    throw new Response("Action call not found", { status: 404 });
  }

  let rootId = id;
  if (currentCall.parentId) {
    let currentParentId: number | null = currentCall.parentId;
    while (currentParentId) {
      const parent: ActionCallWithAction | undefined = await db.query.actionCalls.findFirst({
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

  const actionCallTree = await buildActionCallTree(rootId);
  console.log("[loader] Built action call tree:", actionCallTree);

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
