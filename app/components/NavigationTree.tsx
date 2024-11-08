// app/components/NavigationTree.tsx

import { useState } from "react";
import { Link } from "@remix-run/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Network, Play, Filter, Table } from "lucide-react";
import { cn } from "~/lib/utils";

type NavigationNode = {
  id: number;
  name: string;
  urlName?: string;
  iconKey?: string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
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

function NavigationItem({ node, level = 0 }: { node: NavigationNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const icon = getIcon(node);
  const hasChildren = node.children.length > 0;
  const isRoot = node.type === "root";
  const isApp = node.type === "app";

  const content = (
    <div className="flex items-center gap-2">
      {icon}
      <span
        className={cn(
          "text-sm",
          isRoot && "text-base font-semibold",
          isApp && "text-sm font-medium",
          !isRoot && !isApp && "text-xs font-normal",
        )}
      >
        {node.name}
      </span>
    </div>
  );

  const itemClasses = cn(
    "flex items-center gap-2 p-2 rounded-md w-full",
    "hover:bg-accent hover:text-accent-foreground transition-colors",
    isRoot && "h-12",
    isApp && "pl-4", // Only indent apps
  );

  if (!hasChildren) {
    // Use urlName for the link if available, otherwise fallback to lowercase name
    const to =
      node.type === "file"
        ? `/objects/${node.urlName || node.name.toLowerCase()}`
        : node.name.toLowerCase();

    return (
      <Link to={to} className={itemClasses}>
        {content}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className={itemClasses}>{content}</CollapsibleTrigger>
      <CollapsibleContent>
        <div
          className={cn(
            "flex flex-col gap-1 mt-1",
            isApp && "pl-2", // Slight indent for file items under apps
          )}
        >
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
    <div className="flex flex-col gap-1 p-2 bg-background border-r">
      <NavigationItem node={data} />
    </div>
  );
}
