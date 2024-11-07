// app/components/ui/FileExplorer.tsx

import { useState } from "react";
import { Link } from "@remix-run/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

type BaseNode = {
  id: number;
  children: BaseNode[];
};

type FileNode = BaseNode & {
  name: string;
  type: "file" | "folder";
};

type ActionCallNode = BaseNode & {
  actionName: string;
  status: string;
};

type NodeProps = {
  node: FileNode | ActionCallNode;
  level?: number;
  type: "file" | "actionCall";
};

function isFileNode(node: any): node is FileNode {
  return "type" in node;
}

function ExplorerNode({ node, level = 0, type }: NodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const paddingLeft = `${level * 20}px`;

  const content = (
    <>
      {node.children.length > 0 && (
        <svg
          className="w-4 h-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d={isOpen ? "M6 9l6 6 6-6" : "M9 6l6 6-6 6"} />
        </svg>
      )}
      {isFileNode(node) ? (
        <>
          <span className="mr-2">{node.name}</span>
          <span className="text-sm text-gray-500">({node.type})</span>
        </>
      ) : (
        <>
          <span className="mr-2">{node.actionName}</span>
          <span className="text-sm text-gray-500">({node.status})</span>
        </>
      )}
    </>
  );

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div style={{ paddingLeft }}>
          {type === "file" && isFileNode(node) && node.type === "file" ? (
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
            <ExplorerNode
              key={child.id}
              node={child as FileNode | ActionCallNode}
              level={level + 1}
              type={type}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

type FileExplorerProps = {
  data: FileNode | ActionCallNode;
  type: "file" | "actionCall";
};

export function FileExplorer({ data, type }: FileExplorerProps) {
  return (
    <div className="border-r h-full overflow-y-auto bg-white">
      <div className="p-4">
        <ExplorerNode node={data} type={type} />
      </div>
    </div>
  );
}
