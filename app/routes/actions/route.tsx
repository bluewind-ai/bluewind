// app/routes/actions/route.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "~/db";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { FileExplorer } from "~/components/ui/FileExplorer";

export const loader = async () => {
  const allActions = await db.query.actions.findMany();

  const fileData = {
    id: 0,
    name: "actions",
    type: "folder" as const,
    children: allActions.map((action) => ({
      id: action.id,
      name: action.name,
      type: "file" as const,
      children: [],
    })),
  };

  return json({ fileData });
};

export default function ActionsLayout() {
  const { fileData } = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FileExplorer data={fileData} type="file" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
