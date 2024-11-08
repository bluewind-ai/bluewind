// app/routes/objects+/_root.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getTables } from "~/actions/get-tables.server";
import { FileExplorer } from "~/components/ui/FileExplorer";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";

type FileNode = {
  id: number;
  name: string;
  type: "file" | "folder";
  children: FileNode[];
};

export async function loader() {
  const tables = getTables();

  const fileData: FileNode = {
    id: 0,
    name: "Database",
    type: "folder",
    children: tables.map((tableName, index) => ({
      id: index + 1,
      name: tableName,
      type: "file",
      children: [] as FileNode[],
    })),
  };

  return json({ fileData });
}

export default function ObjectsRoot() {
  const { fileData } = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FileExplorer data={fileData} type="file" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Database Explorer</h2>
          <p>Select a table from the explorer to view its contents.</p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
