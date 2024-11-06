// app/routes/action-calls/route.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useState, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { ActivityBar } from "~/components/ActivityBar";

type TreeNode = {
  id: number;
  actionName: string;
  status: string;
  children: TreeNode[];
};

const mockTreeData: TreeNode = {
  id: 1,
  actionName: "Root Action",
  status: "completed",
  children: [
    {
      id: 2,
      actionName: "Child Action 1",
      status: "in_progress",
      children: [],
    },
  ],
};

export const loader: LoaderFunction = async () => {
  const lastAction = await db.query.actionCalls.findFirst({
    where: eq(actionCalls.status, "ready_for_approval"),
    with: { action: true },
  });

  return json({ lastAction });
};

function ActionCallNode({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const paddingLeft = `${level * 20}px`;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="flex items-center py-1 hover:bg-slate-100 cursor-pointer"
          style={{ paddingLeft }}
        >
          <CollapsibleTrigger className="flex items-center">
            {node.children.length > 0 &&
              (isOpen ? (
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              ))}
            <span className="mr-2">{node.actionName}</span>
            <span className="text-sm text-gray-500">({node.status})</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {node.children.map((child) => (
            <ActionCallNode key={child.id} node={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function ActionCallTree({ initialTreeData }: { initialTreeData: TreeNode }) {
  return (
    <div className="border-r h-full overflow-y-auto bg-white">
      <div className="p-4">
        <ActionCallNode node={initialTreeData} />
      </div>
    </div>
  );
}

export default function ActionCallsLayout() {
  const { lastAction } = useLoaderData<typeof loader>();
  const [isExpanded, setIsExpanded] = useState(true);
  const lastSize = useRef(20);
  const dragStartSize = useRef<number | null>(null);

  const handleLayout = (sizes: number[]) => {
    if (!sizes[0]) return;

    if (dragStartSize.current !== null) {
      if (sizes[0] <= 15 && isExpanded) {
        setIsExpanded(false);
        dragStartSize.current = null;
      } else if (sizes[0] > 0 && !isExpanded) {
        setIsExpanded(true);
        dragStartSize.current = null;
      }
    }

    if (sizes[0] > 15 && isExpanded) {
      lastSize.current = sizes[0];
    }
  };

  const handleDragStart = () => {
    dragStartSize.current = lastSize.current;
  };

  return (
    <div className="flex h-full">
      <ActivityBar className="w-12" lastAction={lastAction} />
      <ResizablePanelGroup direction="horizontal" onLayout={handleLayout}>
        <ResizablePanel
          defaultSize={20}
          minSize={isExpanded ? 15 : 0}
          maxSize={isExpanded ? 100 : 0}
          size={isExpanded ? undefined : 0}
        >
          <ActionCallTree initialTreeData={mockTreeData} />
        </ResizablePanel>
        <ResizableHandle withHandle onDragStart={handleDragStart} />
        <ResizablePanel>
          <main className="h-full">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
