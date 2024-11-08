// File: app/components/NavigationTree.tsx

import { useState } from "react";
import { Link, useNavigate, useLocation } from "@remix-run/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Network, Play, Filter, Table, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
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
    label: "Objects",
  },
  {
    value: "back-office",
    label: "Back Office",
  },
] as const;

function ViewSelector() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("objects");
  const navigate = useNavigate();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mb-2"
        >
          {value ? views.find((view) => view.value === value)?.label : "Select view..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
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
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === view.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {view.label}
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
      <NavigationItem node={data} />
    </div>
  );
}
