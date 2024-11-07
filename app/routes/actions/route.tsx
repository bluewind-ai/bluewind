// app/routes/actions/route.tsx

import { Outlet, useLoaderData, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { db } from "~/db";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "~/components/ui/resizable";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

type FileNode = {
  id: number;
  name: string;
  type: "file" | "folder";
  children: FileNode[];
};

function FileExplorerNode({ node, level = 0 }: { node: FileNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const paddingLeft = `${level * 20}px`;

  const content = (
    <>
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
    </>
  );

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div style={{ paddingLeft }}>
          {node.type === "file" ? (
            <Link
              to={node.name}
              className="flex items-center w-full hover:bg-slate-100 p-1 rounded"
            >
              {content}
            </Link>
          ) : (
            <CollapsibleTrigger className="flex items-center w-full p-1 hover:bg-slate-100 rounded">
              {content}
            </CollapsibleTrigger>
          )}
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

export const loader = async () => {
  const allActions = await db.query.actions.findMany();

  const fileData = {
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

  return json({ fileData });
};

export default function ActionsLayout() {
  const { fileData } = useLoaderData<typeof loader>();

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <FileExplorer initialFileData={fileData} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
