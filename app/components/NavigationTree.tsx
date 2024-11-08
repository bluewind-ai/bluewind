// app/components/NavigationTree.tsx

import * as React from "react";
import { useState } from "react";
import { Link } from "@remix-run/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Network, Play, Filter, Table } from "lucide-react";

type NavigationNode = {
  id: number;
  name: string;
  icon?: React.ReactNode | string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
};

function getIcon(node: NavigationNode) {
  if (typeof node.icon === "string") {
    return <img src={node.icon} alt={`${node.name} icon`} className="h-5 w-5" />;
  }

  if (node.icon) {
    return node.icon;
  }

  // Default icons based on type
  switch (node.type) {
    case "app":
      switch (node.name.toLowerCase()) {
        case "database":
          return <Network className="h-5 w-5" />;
        case "actions":
          return <Play className="h-5 w-5" />;
        case "selectors":
          return <Filter className="h-5 w-5" />;
        default:
          return <Table className="h-5 w-5" />;
      }
    default:
      return null;
  }
}

function NavigationItem({ node, level = 0 }: { node: NavigationNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const icon = getIcon(node);
  const hasChildren = node.children.length > 0;
  const isRoot = node.type === "root";
  const isApp = node.type === "app";

  const content = (
    <div className="flex items-center gap-2">
      {icon}
      {level > 0 && <span className="text-sm">{node.name}</span>}
    </div>
  );

  const itemClasses = `
    flex items-center gap-2 p-2 rounded-md
    ${isRoot ? "w-12 h-12 justify-center" : "w-full"}
    ${isApp ? "font-medium" : ""}
    hover:bg-accent hover:text-accent-foreground
    transition-colors
  `;

  if (!hasChildren) {
    return (
      <Link to={node.name.toLowerCase()} className={itemClasses}>
        {content}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className={itemClasses}>{content}</CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`flex flex-col gap-1 ${level === 0 ? "" : "ml-4"}`}>
          {node.children.map((child) => (
            <NavigationItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface NavigationTreeProps {
  data: NavigationNode;
}

export function NavigationTree({ data }: NavigationTreeProps) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-muted border-r border-border">
      <NavigationItem node={data} />
    </div>
  );
}
