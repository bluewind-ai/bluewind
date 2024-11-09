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

const views = [
  {
    value: "objects",
    label: "Database",
    icon: <Network className="mr-2 h-4 w-4" />,
  },
  {
    value: "back-office",
    label: "Back Office",
    icon: <Table className="mr-2 h-4 w-4" />,
  },
];

export function ViewSelector() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const [value, setValue] = React.useState(
    location.pathname.startsWith("/back-office") ? "back-office" : "objects",
  );
  const navigate = useNavigate();

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
      <PopoverContent className="w-[200px] p-0 bg-background border shadow-md">
        <Command className="bg-background">
          <CommandInput placeholder="Search view..." className="bg-background" />
          <CommandList className="bg-background">
            <CommandEmpty>No view found.</CommandEmpty>
            <CommandGroup className="bg-background">
              {views.map((view) => (
                <CommandItem
                  key={view.value}
                  value={view.value}
                  className="bg-background"
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
                  {view.icon}
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
