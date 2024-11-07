// app/routes/actions.master/route.tsx

import { json, type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { withActionMiddleware } from "~/lib/action-middleware.server";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { db } from "~/db";
import { actions } from "~/db/schema";

type FileNode = {
  id: number;
  name: string;
  type: "file" | "folder";
  children: FileNode[];
};

function FileExplorerNode({ node, level = 0 }: { node: FileNode; level?: number }) {
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
            <span className="mr-2">{node.name}</span>
            <span className="text-sm text-gray-500">({node.type})</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {node.children.map((child) => (
            <FileExplorerNode key={child.id} node={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function FileExplorer({ initialFileData }: { initialFileData: FileNode }) {
  return (
    <div className="border-r h-full overflow-y-auto bg-white">
      <div className="p-4">
        <FileExplorerNode node={initialFileData} />
      </div>
    </div>
  );
}

const masterAction = async (_args: ActionFunctionArgs) => {
  return json({ success: true });
};

export const action = withActionMiddleware(masterAction);

export const loader = async () => {
  const allActions = await db.query.actions.findMany();

  // Transform the flat list into our tree structure
  const fileData: FileNode = {
    id: 0,
    name: "actions",
    type: "folder",
    children: allActions.map((action) => ({
      id: action.id,
      name: action.name,
      type: "file",
      children: [],
    })),
  };

  console.log("Loaded actions:", allActions);

  return json({
    message: "Master action endpoint",
    fileData,
  });
};

export default function MasterAction() {
  const actionData = useActionData<typeof action>();
  const { fileData } = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FileExplorer initialFileData={fileData} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Master Action</h2>
          <Form method="post">
            <Button type="submit">Run Master Action</Button>
          </Form>
          {actionData && (
            <pre className="mt-4 p-4 bg-slate-100 rounded">
              {JSON.stringify(actionData, null, 2)}
            </pre>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
