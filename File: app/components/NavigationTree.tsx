// File: app/components/NavigationTree.tsx

import { useState } from "react";
import { Link, useNavigate, useLocation } from "@remix-run/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Network, Play, Filter, Table, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

export type NavigationNode = {
  id: number;
  name: string;
  urlName?: string;
  iconKey?: string;
  type: "root" | "app" | "file";
  children: NavigationNode[];
};

const views = [
  {
    value: "objects",
    label: "Database",
    icon: <Network className="h-5 w-5" />,
  },
  {
    value: "back-office",
    label: "Back Office",
    icon: <Table className="h-5 w-5" />,
  },
] as const;

function ViewSelector() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("objects");
  const navigate = useNavigate();
  const selectedView = views.find((view) => view.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-2 rounded-md w-full hover:bg-accent hover:text-accent-foreground transition-colors h-12"
        >
          <div className="flex items-center gap-2">
            {selectedView?.icon}
            <span className="text-base font-semibold">
              {selectedView?.label || "Select view..."}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search view..." />
          <CommandList>
            <CommandEmpty>No view found.</CommandEmpty>
            <CommandGroup>
              {views.map((view) => (
                <CommandItem
                  key={view.value}
                  value={view.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    navigate(`/${currentValue}`);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {view.icon}
                    {view.label}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === view.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  const location = useLocation();
  const isBackOffice = location.pathname.startsWith("/back-office");
  const baseRoute = isBackOffice ? "/back-office" : "/objects";

  // If it's root, don't render anything as we'll use ViewSelector instead
  if (isRoot) {
    return null;
  }

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
    const to = `${baseRoute}/${node.urlName || node.name.toLowerCase()}`;

    return (
      <Link to={to} className={itemClasses} data-discover="true">
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
      <ViewSelector />
      {data.children.map((child) => (
        <NavigationItem key={child.id} node={child} />
      ))}
    </div>
  );
}
