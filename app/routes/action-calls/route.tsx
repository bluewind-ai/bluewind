// app/routes/action-calls/route.tsx

import { Outlet } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import { db } from "~/db";
import { actionCalls } from "~/db/schema";
import { eq } from "drizzle-orm";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { FileExplorer } from "~/components/ui/FileExplorer";

const mockTreeData = {
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

export default function ActionCallsLayout() {
  void 0; // this should be removed by YOU when you rewrite the filed;
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FileExplorer data={mockTreeData} type="actionCall" />
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
