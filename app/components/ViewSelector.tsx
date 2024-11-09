// app/components/ViewSelector.tsx

import * as React from "react";
import { Check, ChevronsUpDown, Network, Table } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useNavigate, useLocation } from "@remix-run/react";
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
import type { ViewData } from "~/routes/_app";

interface ViewSelectorProps {
  views: ViewData[];
}

export function ViewSelector({ views }: ViewSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const [value, setValue] = React.useState(
    location.pathname.startsWith("/back-office") ? "back-office" : "objects",
  );
  const navigate = useNavigate();

  const getIcon = (iconKey: string) => {
    switch (iconKey) {
      case "database":
        return <Network className="mr-2 h-4 w-4" />;
      case "table":
        return <Table className="mr-2 h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? views.find((view) => view.value === value)?.label : "Select view..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-white border-2 shadow-lg">
        <Command className="bg-white">
          <CommandInput placeholder="Search view..." className="bg-white" />
          <CommandList className="bg-white">
            <CommandEmpty className="bg-white">No view found.</CommandEmpty>
            <CommandGroup className="bg-white">
              {views.map((view) => (
                <CommandItem
                  key={view.value}
                  value={view.value}
                  className="bg-white"
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
                  {getIcon(view.iconKey)}
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
