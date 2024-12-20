// app/components/navigation-tree.tsx
import { Link } from "@remix-run/react";
import { Filter, Network, Play, Table } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { TABLES } from "~/db/schema/table-models";
import { cn } from "~/lib/utils";

export type NavigationNode = {
  id: number;
  name: string;
  to?: string;
  iconKey?: string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
  counts?: Record<string, number>;
};
function getIcon(node: NavigationNode) {
  if (!node.iconKey) return null;
  switch (node.iconKey) {
    case "favicon":
      return <img src="/favicon.ico" alt={`${node.name} icon`} className="h-5 w-5" />;
    case "database":
      return <Network className="h-5 w-5" />;
    case TABLES.serverFunctions.urlName:
      return <Play className="h-5 w-5" />;
    case "selectors":
      return <Filter className="h-5 w-5" />;
    default:
      return <Table className="h-5 w-5" />;
  }
}
function NavigationItem({
  node,
  rootCounts,
  level = 0,
}: {
  node: NavigationNode;
  rootCounts?: Record<string, number>;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const icon = getIcon(node);
  const hasChildren = node.children.length > 0;
  const isRoot = node.type === "root";
  const isApp = node.type === "app";
  const counts = node.counts || rootCounts;
  const count = node.to && counts ? counts[node.to.slice(1)] : undefined;
  const content = (
    <div className="flex items-center gap-2 justify-between w-full">
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
      {count !== undefined && (
        <Badge variant="secondary" className="ml-auto">
          {count}
        </Badge>
      )}
    </div>
  );
  const itemClasses = cn(
    "flex items-center gap-2 p-2 rounded-md w-full",
    "hover:bg-accent hover:text-accent-foreground transition-colors",
    isRoot && "h-12",
    isApp && "pl-4",
  );
  if (!hasChildren && node.to) {
    return (
      <Link to={node.to} className={itemClasses} data-discover="true">
        {content}
      </Link>
    );
  }
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className={itemClasses}>{content}</CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn("flex flex-col gap-1 mt-1", isApp && "pl-2")}>
          {node.children.map((child) => (
            <NavigationItem key={child.id} node={child} rootCounts={counts} level={level + 1} />
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
