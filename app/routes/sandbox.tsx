// app/routes/sandbox.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { FileExplorer } from "~/components/ui/FileExplorer";
import * as schema from "~/db/schema";

export async function loader() {
  // Get all table names from schema
  const tables = Object.entries(schema)
    .filter(([_, value]) => value?.name === "pgTable")
    .map(([key]) => key);

  // Create root nodes for each table
  const fileStructure = tables.map((tableName, index) => ({
    id: index + 1,
    name: tableName,
    type: "file" as const,
    children: [],
  }));

  // Wrap in a root container
  const data = {
    id: 0,
    name: "Tables",
    type: "folder" as const,
    children: fileStructure,
  };

  return json({ data });
}

export default function SandboxRoute() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div className="h-screen w-full">
      <FileExplorer data={data} type="file" />
    </div>
  );
}
