// app/routes/sandbox.tsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { FileExplorer } from "~/components/ui/FileExplorer";
import { NewMain } from "~/components/NewMain";
import * as schema from "~/db/schema";
import { db } from "~/db";
import { enrichAction } from "~/db/schema";

export async function loader() {
  // Get actions data for NewMain component
  const actions = await db.query.actions.findMany({
    with: {
      calls: {
        orderBy: (calls, { desc }) => [desc(calls.createdAt)],
        limit: 1,
      },
    },
  });

  const enrichedActions = actions.map((action) => ({
    ...enrichAction(action),
    lastCallStatus: action.calls[0]?.status || "never_run",
    lastRunAt: action.calls[0]?.createdAt || null,
    totalCalls: action.calls.length,
  }));

  // Get all table names for FileExplorer
  const tables = Object.entries(schema)
    .filter(([_, value]) => typeof value === "object" && value !== null && "$type" in value)
    .map(([key]) => key);

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

  const explorerData = {
    id: 0,
    name: "Tables",
    type: "folder" as const,
    children: fileStructure,
  } satisfies FileNode;

  return json({
    mainData: enrichedActions,
    explorerData,
  });
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
  const { mainData, explorerData } = useLoaderData<typeof loader>();

  return (
    <div className="h-screen w-full flex">
      <div className="w-64">
        <FileExplorer data={explorerData} type="file" />
      </div>
      <div className="flex-1">
        <NewMain data={mainData} />
      </div>
    </div>
  );
}
