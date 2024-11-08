// File: app/components/ViewSelector.tsx

import { useState } from "react";
import { useNavigate, useLocation } from "@remix-run/react";
import { Network, Table, Check, ChevronsUpDown } from "lucide-react";
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
    icon: <Network className="h-5 w-5" />,
  },
  {
    value: "back-office",
    label: "Back Office",
    icon: <Table className="h-5 w-5" />,
  },
] as const;

export function ViewSelector() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [value, setValue] = useState(
    location.pathname.startsWith("/back-office") ? "back-office" : "objects",
  );
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
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
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
