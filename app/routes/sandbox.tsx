// app/routes/sandbox.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { FileExplorer } from "~/components/ui/FileExplorer";
import * as schema from "~/db/schema";

export async function loader() {
  // Get all table names from schema by looking at the objects that have a $type
  const tables = Object.entries(schema)
    .filter(([_, value]) => typeof value === "object" && value !== null && "$type" in value)
    .map(([key]) => key);

  // Create root nodes for each table
  const fileStructure: Array<{
    id: number;
    name: string;
    type: "file";
    children: BaseNode[];
  }> = tables.map((tableName, index) => ({
    id: index + 1,
    name: tableName,
    type: "file",
    children: [],
  }));

  // Wrap in a root container
  const data = {
    id: 0,
    name: "Tables",
    type: "folder" as const,
    children: fileStructure,
  } satisfies FileNode;

  return json({ data });
}

type BaseNode = {
  id: number;
  children: BaseNode[];
};

type FileNode = BaseNode & {
  name: string;
  type: "file" | "folder";
};

export default function SandboxRoute() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div className="h-screen w-full">
      <FileExplorer data={data} type="file" />
    </div>
  );
}
