// app/routes/objects+/_root.tsx

import { Outlet, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getTables } from "~/actions/get-tables.server";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { FileExplorer } from "~/components/ui/FileExplorer";

type FileNode = {
  id: number;
  name: string;
  type: "file" | "folder";
  children: FileNode[];
};

export async function loader() {
  const tables = getTables();

  const fileStructure = tables.map((tableName, index) => ({
    id: index + 1,
    name: tableName,
    type: "file" as const,
    children: [] as FileNode[],
  }));

  return json({ fileStructure });
}

export default function ObjectsLayout() {
  const { fileStructure } = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        {fileStructure.map((node) => (
          <FileExplorer key={node.id} data={node} type="file" />
        ))}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
