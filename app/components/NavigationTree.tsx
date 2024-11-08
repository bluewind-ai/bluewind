// app/components/NavigationTree.tsx

import { useState } from "react";

export type NavigationNode = {
  id: number;
  name: string;
  iconKey?: string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
};

type NavigationTreeProps = {
  data: NavigationNode;
};

export function NavigationTree({ data }: NavigationTreeProps) {
  const [expanded, setExpanded] = useState<number[]>([]);

  const toggleNode = (id: number) => {
    if (expanded.includes(id)) {
      setExpanded(expanded.filter((nodeId) => nodeId !== id));
    } else {
      setExpanded([...expanded, id]);
    }
  };

  const renderNode = (node: NavigationNode, level = 0) => {
    const isExpanded = expanded.includes(node.id);

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => toggleNode(node.id)}
        >
          {node.children.length > 0 && <span className="mr-2">{isExpanded ? "▼" : "▶"}</span>}
          <span>{node.name}</span>
        </div>
        {isExpanded && node.children.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return <div className="w-64 bg-white border-r">{renderNode(data)}</div>;
}
