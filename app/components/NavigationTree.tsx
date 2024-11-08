// app/components/NavigationTree.tsx

import { useState } from "react";
import { Network, Play, Filter, Table } from "lucide-react";
import { cn } from "~/lib/utils";

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

function getIcon(node: NavigationNode) {
  if (!node.iconKey) return null;

  switch (node.iconKey) {
    case "favicon":
      return <img src="/favicon.ico" alt={`${node.name} icon`} className="h-5 w-5" />;
    case "database":
      return <Network className="h-5 w-5" />;
    case "actions":
      return <Play className="h-5 w-5" />;
    case "selectors":
      return <Filter className="h-5 w-5" />;
    default:
      return <Table className="h-5 w-5" />;
  }
}

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
    const icon = getIcon(node);
    const isRoot = node.type === "root";
    const isApp = node.type === "app";

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <button
          className={cn(
            "flex items-center w-full p-2 hover:bg-gray-100 text-left gap-2",
            isRoot && "text-base font-semibold",
            isApp && "text-sm font-medium",
            !isRoot && !isApp && "text-xs font-normal",
          )}
          onClick={() => toggleNode(node.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleNode(node.id);
            }
          }}
        >
          {node.children.length > 0 && <span className="w-4">{isExpanded ? "▼" : "▶"}</span>}
          {icon}
          <span>{node.name}</span>
        </button>
        {isExpanded && node.children.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return <div className="w-64 bg-white border-r">{renderNode(data)}</div>;
}
