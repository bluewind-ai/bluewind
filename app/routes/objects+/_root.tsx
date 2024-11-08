// app/routes/objects+/_root.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getTables } from "~/actions/get-tables.server";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { FileExplorer } from "~/components/ui/FileExplorer";

export async function loader() {
  const tables = getTables();

  const fileData = {
    id: 0,
    name: "Objects",
    type: "folder" as const,
    children: tables.map((tableName, index) => ({
      id: index + 1,
      name: tableName,
      type: "file" as const,
      children: [],
    })),
  };

  return json({ fileData });
}

export default function ObjectsLayout() {
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
