// app/routes/action-calls/route.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { FileExplorer } from "~/components/ui/FileExplorer";
import type { InferSelectModel } from "drizzle-orm";

type ActionCall = InferSelectModel<typeof actionCalls>;

interface ActionCallNode {
  id: number;
  actionName: string;
  status: string;
  children: ActionCallNode[];
}

async function buildRootActionCallsTree(): Promise<ActionCallNode[]> {
  // Get all action calls
  const allCalls = await db.query.actionCalls.findMany({
    with: { action: true },
  });

  console.log("[buildRootActionCallsTree] Found all calls:", allCalls);

  // First get root level calls (no parent)
  const rootCalls = allCalls.filter((call) => !call.parentId);

  // Build tree for each root call
  function buildTree(call: ActionCall): ActionCallNode {
    const children = allCalls.filter((c) => c.parentId === call.id);
    return {
      id: call.id,
      actionName: call.action?.name || "Unknown Action",
      status: call.status,
      children: children.map(buildTree),
    };
  }

  return rootCalls.map(buildTree);
}

export const loader: LoaderFunction = async () => {
  console.log("[loader] Starting to load root action calls");

  const rootActionCalls = await buildRootActionCallsTree();
  console.log("[loader] Built root action calls tree:", rootActionCalls);

  return json({ rootActionCalls });
};

export default function ActionCallsLayout() {
  const { rootActionCalls } = useLoaderData<typeof loader>();
  console.log("[ActionCallsLayout] Rendering with root action calls:", rootActionCalls);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FileExplorer
          data={{ id: 0, actionName: "Workflows", children: rootActionCalls }}
          type="actionCall"
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        <main className="h-full">
          <Outlet />
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
