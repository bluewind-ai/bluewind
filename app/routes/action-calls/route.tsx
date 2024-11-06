// app/routes/action-calls/route.tsx

import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Network, Play, GitBranch, Bug, PackageSearch } from "lucide-react";
import { Logo } from "~/components/icons/logo";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import type { InferSelectModel } from "drizzle-orm";

type ActionCall = InferSelectModel<typeof actionCalls>;

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

function ActivityBar({ className, lastAction }: { className?: string; lastAction?: ActionCall }) {
  const navigate = useNavigate();
  return (
    <div className={cn("flex flex-col gap-2 p-2 bg-muted", className)}>
      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate("/")}>
        <Logo />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => lastAction && navigate(`/action-calls/${lastAction.id}`)}
      >
        <Network className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => navigate("/actions/master")}
      >
        <Play className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <GitBranch className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <Bug className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <PackageSearch className="h-5 w-5" />
      </Button>
    </div>
  );
}

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
  return (
    <div className="flex h-full">
      <ActivityBar className="w-12" lastAction={lastAction} />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <ActionCallTree initialTreeData={mockTreeData} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80}>
          <main className="h-full">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
