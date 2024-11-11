// app/components/ui/action-call-tree.tsx

import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

export type TreeNode = {
  id: number;
  actionName: string;
  status: string;
  children: TreeNode[];
};

function ActionCallNode({ node, level = 0 }: { node: TreeNode; level?: number }) {
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
            <span className="mr-2">{node.actionName}</span>
            <span className="text-sm text-gray-500">({node.status})</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {node.children.map((child) => (
            <ActionCallNode key={child.id} node={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function FunctionCallTree({ initialTreeData }: { initialTreeData: TreeNode }) {
  return (
    <div className="w-64 border-r h-[calc(100vh-64px)] overflow-y-auto bg-white">
      <div className="p-4">
        <ActionCallNode node={initialTreeData} />
      </div>
    </div>
  );
}
