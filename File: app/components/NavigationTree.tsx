// File: app/components/NavigationTree.tsx

import { Link } from "@remix-run/react";
import type { ViewData } from "~/routes/_app";

export interface NavigationNode {
  id: number;
  name: string;
  type: "root" | "file" | "folder";
  urlName?: string;
  iconKey?: string;
  children: NavigationNode[];
}

export interface NavigationTreeProps {
  data: NavigationNode;
  views: ViewData[];
}

export function NavigationTree({ data, views }: NavigationTreeProps) {
  const renderNode = (node: NavigationNode) => {
    if (node.type === "file") {
      return (
        <Link
          key={node.id}
          to={`/back-office/${node.urlName}`}
          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {node.name}
        </Link>
      );
    }

    return (
      <div key={node.id} className="space-y-1">
        <div className="px-4 py-2 font-medium">{node.name}</div>
        <div className="space-y-1 pl-4">
          {node.children.map((child) => renderNode(child))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-800">
      {renderNode(data)}
    </div>
  );
}